const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { handleError, serialize, integrationSdk } = require('../api-util/sdk');
const log = require('../log');
const CAREVINE_GOLD_PRICE_ID =
  process.env.REACT_APP_ENV === 'development'
    ? 'price_1MXTvhJsU2TVwfKBFEkLhUKp'
    : 'price_1MXTyYJsU2TVwfKBrzI6O23S';
const axios = require('axios');

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const apiBaseUrl = () => {
  const port = process.env.REACT_APP_DEV_API_SERVER_PORT;
  const useDevApiServer = process.env.NODE_ENV === 'development' && !!port;

  // In development, the dev API server is running in a different port
  if (useDevApiServer) {
    return `http://localhost:${port}`;
  }

  // Otherwise, use the same domain and port as the frontend
  return process.env.REACT_APP_CANONICAL_ROOT_URL;
};

const sendgridEmail = (receiverId, templateName, templateData, failMessage) => {
  axios
    .post(
      `${apiBaseUrl()}/api/sendgrid-template-email`,
      {
        receiverId,
        templateName,
        templateData,
      },
      {
        headers: {
          'Content-Type': 'application/transit+json',
        },
      }
    )
    .catch(e => log.error(e, failMessage, {}));
};

const sendgridStandardEmail = (receiverEmail, subject, html) => {
  axios
    .post(
      `${apiBaseUrl()}/api/sendgrid-standard-email`,
      {
        receiverEmail,
        subject,
        html,
      },
      {
        headers: {
          'Content-Type': 'application/transit+json',
        },
      }
    )
    .catch(e => log.error(e, failMessage, {}));
};

const updateBackgroundCheckSubscription = subscription => {
  const userId = subscription.metadata.userId;

  let prevBackgroundCheckSubscription = null;

  let failStage = 'update-subscription-failed';

  integrationSdk.users
    .show({ id: userId })
    .then(res => {
      const user = res?.data?.data;
      prevBackgroundCheckSubscription =
        user?.attributes?.profile?.metadata?.backgroundCheckSubscription;

      return res;
    })
    .then(() => {
      axios.post(
        `${apiBaseUrl()}/api/update-user-metadata`,
        {
          userId,
          metadata: {
            backgroundCheckSubscription: {
              // May set this to null if webhooks work
              status: subscription?.status,
              subscriptionId: subscription?.id,
              type:
                subscription?.items?.data[0]?.price?.id === CAREVINE_GOLD_PRICE_ID
                  ? 'vine'
                  : 'basic',
              currentPeriodEnd: subscription?.current_period_end,
              amount: subscription?.plan?.amount,
              cancelAtPeriodEnd: subscription?.cancel_at_period_end,
            },
          },
        },
        {
          headers: {
            'Content-Type': 'application/transit+json',
          },
        }
      );
    })
    .then(() => {
      if (
        (prevBackgroundCheckSubscription?.status !== 'canceled' &&
          subscription?.status === 'canceled') ||
        (!prevBackgroundCheckSubscription?.cancelAtPeriodEnd && subscription?.cancel_at_period_end)
      ) {
        failStage = 'subscription-canceled-email-failed';
        // TODO: Implement template data
        sendgridEmail(userId, 'subscription-canceled', {}, failStage);
      }
    })
    .catch(e => log.error(e, failStage));
};

const updateBackgroundCheckSubscriptionSchedule = schedule => {
  const userId = schedule?.metadata?.userId;

  integrationSdk.users
    .updateProfile({
      id: userId,
      privateData: {
        backgroundCheckSubscriptionSchedule: {
          scheduleId: schedule?.id,
          status: schedule?.status,
          startDate: schedule?.phases[0]?.start_date,
          type: schedule?.phases[0]?.items[0]?.price === CAREVINE_GOLD_PRICE_ID ? 'vine' : 'basic',
          amount: schedule?.phases[0]?.items[0]?.price === CAREVINE_GOLD_PRICE_ID ? 499 : 1499,
        },
      },
    })
    .then(() => {
      // TODO: Check if we want to send a separate email for this
      // sendgridEmail(userId, 'subscription-schedule-confirmed', {});
    })
    .catch(e => log.error(e));
};

const cancelBackgroundCheckSubscriptionSchedule = schedule => {
  const userId = schedule?.metadata?.userId;

  integrationSdk.users
    .updateProfile({
      id: userId,
      privateData: {
        backgroundCheckSubscriptionSchedule: null,
      },
    })
    .then(() => {
      // TODO: Check if we want to send a separate email for this
      // sendgridEmail(userId, 'subscription-schedule-canceled', {});
    })
    .catch(e => log.error(e, 'cancel-background-check-subscription-schedule-failed'));
};

const sendExpiringEmail = data => {
  const card = data.data.object.object === 'card' ? data.data.object : null;

  if (card) {
    const stripeCustomerId = card.customer;

    stripe.customers
      .retrieve(stripeCustomerId)
      .then(customer => {
        const userId = customer.metadata['sharetribe-user-id'];

        // TODO: Replace template data when available
        sendgridEmail(userId, 'payment-expiring', {}, 'send-payment-expiring-email-failed');
      })
      .catch(e => log.error(e, 'send-payment-expiring-email-failed', {}));
  }
};

const sendChargeFailedEmail = data => {
  const feeAmount = Number.parseFloat(data?.application_fee_amount / 100).toFixed(2);
  const amount = Number.parseFloat(data?.amount / 100 - feeAmount).toFixed(2);
  const failureMessage = data?.failure_message;
  const description = data?.description;
  const userId = data?.metadata?.userId;
  const type = data?.payment_method_details?.type;

  if (type !== 'card') {
    sendgridEmail(
      userId,
      'payment-failed',
      { feeAmount, amount, failureMessage, description },
      'send-payment-failed-email-failed'
    );
  }
};

module.exports = (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    log.error(err);
    response
      .status(400)
      .send(
        `Webhook Error: ${err.message}, sig: ${sig}, request.body: ${request.body}, endpointSecret: ${endpointSecret}`
      );
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'customer.subscription.created':
      console.log('customer.subscription.created');
      const customerSubscriptionCreated = event.data.object;
      // console.log(customerSubscriptionCreated);
      updateBackgroundCheckSubscription(customerSubscriptionCreated);
      break;
    case 'customer.subscription.deleted':
      console.log('customer.subscription.deleted');
      const customerSubscriptionDeleted = event.data.object;
      updateBackgroundCheckSubscription(customerSubscriptionDeleted);
      break;
    case 'customer.subscription.paused':
      console.log('customer.subscription.paused');
      const customerSubscriptionPaused = event.data.object;
      updateBackgroundCheckSubscription(customerSubscriptionPaused);
      break;
    case 'customer.subscription.resumed':
      console.log('customer.subscription.resumed');
      const customerSubscriptionResumed = event.data.object;
      updateBackgroundCheckSubscription(customerSubscriptionResumed);
      break;
    case 'customer.subscription.updated':
      console.log('customer.subscription.updated');
      const customerSubscriptionUpdated = event.data.object;
      // console.log(customerSubscriptionUpdated);
      if (
        customerSubscriptionUpdated.status !== 'incomplete_expired' ||
        customerSubscriptionUpdated.status !== 'incomplete'
      ) {
        updateBackgroundCheckSubscription(customerSubscriptionUpdated);
      }
      break;
    case 'charge.failed':
      console.log('charge.failed');
      const chargeFailed = event.data.object;
      sendChargeFailedEmail(chargeFailed);
      break;
    case 'invoice.paid':
      const invoicePaid = event.data.object;
      // TODO: Send email to user that their subscription has been paid
      break;
    case 'invoice.payment_failed':
      const invoicePaymentFailed = event.data.object;
      // TODO: Send email to user that their subscription payment has failed and their subscription has been paused
      break;
    case 'subscription_schedule.canceled':
      console.log('subscription_schedule.canceled');
      const susbcriptionScheduleCanceled = event.data.object;
      cancelBackgroundCheckSubscriptionSchedule(susbcriptionScheduleCanceled);
      break;
    case 'subscription_schedule.created':
      console.log('subscription_schedule.created');
      const susbcriptionScheduleCreated = event.data.object;
      updateBackgroundCheckSubscriptionSchedule(susbcriptionScheduleCreated);
      break;
    // ... handle other event types
    case 'customer.source.expiring':
      const customerSourceExpiring = event.data.object;
      sendExpiringEmail(customerSourceExpiring);
      break;
    case 'charge.dispute.created':
      const disputeCreated = event.data.object;
      sendgridStandardEmail(
        'peyton.hobson@carevine.us',
        'Dispute Created',
        JSON.stringify(disputeCreated)
      );
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
};
