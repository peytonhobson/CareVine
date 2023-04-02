const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { handleError, serialize, integrationSdk } = require('../api-util/sdk');
const log = require('../log');
const CAREVINE_GOLD_PRICE_ID =
  process.env.REACT_APP_ENV === 'development'
    ? 'price_1MXTvhJsU2TVwfKBFEkLhUKp'
    : 'price_1MXTyYJsU2TVwfKBrzI6O23S';
const axios = require('axios');
const rootUrl = process.env.REACT_APP_CANONICAL_ROOT_URL;
const moment = require('moment');

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

const sendgridStandardEmail = (fromEmail, receiverEmail, subject, html) => {
  axios
    .post(
      `${apiBaseUrl()}/api/sendgrid-standard-email`,
      {
        fromEmail,
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
  const type =
    subscription?.items?.data[0]?.price?.id === CAREVINE_GOLD_PRICE_ID ? 'vine' : 'basic';

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
              type,
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
      const isReactivatingSubscription =
        (prevBackgroundCheckSubscription?.status === 'canceled' ||
          prevBackgroundCheckSubscription?.cancelAtPeriodEnd) &&
        prevBackgroundCheckSubscription?.type === type &&
        subscription?.status === 'active';

      const isCanceling =
        !prevBackgroundCheckSubscription?.cancelAtPeriodEnd && subscription?.cancel_at_period_end;

      const isUpgrading = prevBackgroundCheckSubscription?.type === 'basic' && type === 'vine';

      const isConfirming =
        (!prevBackgroundCheckSubscription ||
          !prevBackgroundCheckSubscription.status === 'incomplete') &&
        subscription?.status === 'active';

      const subscriptionName = type === 'vine' ? 'Carevine Gold' : 'Carevine Basic';
      const endDate = moment(subscription?.current_period_end * 1000).format('MM/DD/YYYY');

      if (isReactivatingSubscription) {
        failStage = 'subscription-reactivated-email-failed';
        sendgridEmail(
          userId,
          'subscription-reactivated',
          { marketplaceUrl: rootUrl, subscriptionName, renewalDate: endDate },
          failStage
        );
      }

      if (isCanceling) {
        failStage = 'subscription-canceled-email-failed';

        sendgridEmail(
          userId,
          'subscription-canceled',
          { marketplaceUrl: rootUrl, endDate, subscriptionName },
          failStage
        );
      }

      if (isUpgrading) {
        failStage = 'subscription-upgraded-email-failed';
        // TODO: Implement template data
        console.log('upgrade email');
        sendgridEmail(userId, 'subscription-upgraded', { marketplaceUrl: rootUrl }, failStage);
      }

      if (isConfirming) {
        failStage = 'subscription-confirmed-email-failed';
        sendgridEmail(
          userId,
          'subscription-confirmed',
          { marketplaceUrl: rootUrl, subscriptionName, renewalDate: endDate },
          failStage
        );
      }
    })
    .catch(e => log.error(e, failStage));
};

const updateBackgroundCheckSubscriptionSchedule = schedule => {
  const userId = schedule?.metadata?.userId;
  const type = schedule?.phases[0]?.items[0]?.price === CAREVINE_GOLD_PRICE_ID ? 'vine' : 'basic';
  const startDate = schedule?.phases[0]?.start_date;

  integrationSdk.users
    .updateProfile({
      id: userId,
      privateData: {
        backgroundCheckSubscriptionSchedule: {
          scheduleId: schedule?.id,
          status: schedule?.status,
          startDate,
          type,
          amount: schedule?.phases[0]?.items[0]?.price === CAREVINE_GOLD_PRICE_ID ? 499 : 1499,
        },
      },
    })
    .then(() => {
      const newSubscriptionName = type === 'vine' ? 'Carevine Gold' : 'Carevine Basic';
      const oldSubscriptionName = type === 'vine' ? 'Carevine Basic' : 'Carevine Gold';
      sendgridEmail(
        userId,
        'subscription-schedule-confirmed',
        {
          marketplaceUrl: rootUrl,
          newSubscriptionName,
          oldSubscriptionName,
          startDate: moment(startDate * 1000).format('MM/DD/YYYY'),
        },
        'send-subscription-schedule-confirmed-email-failed'
      );
    })
    .catch(e => log.error(e));
};

const cancelBackgroundCheckSubscriptionSchedule = async schedule => {
  const userId = schedule?.metadata?.userId;

  let currentUser = null;

  try {
    currentUser = await integrationSdk.users.show({ id: userId });
  } catch (e) {
    log.error(e, 'cancel-background-check-subscription-schedule-user-query-failed');
  }

  const currentSubscription =
    currentUser?.data?.data?.attributes?.profile?.metadata.backgroundCheckSubscription;
  const endDate = moment(currentSubscription?.currentPeriodEnd * 1000).format('MM/DD/YYYY');

  integrationSdk.users
    .updateProfile({
      id: userId,
      privateData: {
        backgroundCheckSubscriptionSchedule: null,
      },
    })
    .then(() => {
      sendgridEmail(
        userId,
        'subscription-schedule-canceled',
        { marketplaceUrl: rootUrl, endDate },
        'send-subscription-schedule-canceled-email-failed'
      );
    })
    .catch(e => log.error(e, 'cancel-background-check-subscription-schedule-failed'));
};

const sendChargeFailedEmail = data => {
  // const feeAmount = Number.parseFloat(data?.application_fee_amount / 100).toFixed(2);
  // const amount = Number.parseFloat(data?.amount / 100 - feeAmount).toFixed(2);
  const failureMessage = data?.failure_message;
  const type = data?.payment_method_details?.type;
  const { recipientName, channelUrl, userId } = data?.metadata;

  if (type !== 'card') {
    sendgridEmail(
      userId,
      'payment-failed',
      {
        marketplaceUrl: rootUrl,
        failureMessage,
        channelUrl,
        recipientName,
      },
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
      const subscriptionScheduleCanceled = event.data.object;
      cancelBackgroundCheckSubscriptionSchedule(subscriptionScheduleCanceled);
      break;
    case 'subscription_schedule.created':
      console.log('subscription_schedule.created');
      const subscriptionScheduleCreated = event.data.object;
      updateBackgroundCheckSubscriptionSchedule(subscriptionScheduleCreated);
      break;
    case 'charge.dispute.created':
      const disputeCreated = event.data.object;
      sendgridStandardEmail(
        'admin-notification@carevine.us',
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
