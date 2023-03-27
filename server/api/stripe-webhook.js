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

const updateBackgroundCheckSubscription = subscription => {
  const userId = subscription.metadata.userId;

  axios
    .post(
      `${apiBaseUrl()}/api/update-user-metadata`,
      {
        userId,
        metadata: {
          backgroundCheckSubscription: {
            // May set this to null if webhooks work
            status: subscription.status,
            subscriptionId: subscription.id,
            type: subscription.items.data[0].price.id === CAREVINE_GOLD_PRICE_ID ? 'vine' : 'basic',
            currentPeriodEnd: subscription.current_period_end,
            amount: subscription.plan.amount,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        },
      },
      {
        headers: {
          'Content-Type': 'application/transit+json',
        },
      }
    )
    .catch(e => log.error(e));
};

const updateBackgroundCheckSubscriptionSchedule = schedule => {
  const userId = schedule.metadata.userId;

  integrationSdk.users
    .updateProfile({
      id: userId,
      privateData: {
        backgroundCheckSubscriptionSchedule: {
          scheduleId: schedule.id,
          status: schedule.status,
          startDate: schedule.phases[0].start_date,
          type: schedule.phases[0].items[0].price === CAREVINE_GOLD_PRICE_ID ? 'vine' : 'basic',
          amount: schedule.phases[0].items[0].price === CAREVINE_GOLD_PRICE_ID ? 499 : 1499,
        },
      },
    })
    .catch(e => log.error(e));
};

const cancelBackgroundCheckSubscriptionSchedule = schedule => {
  const userId = schedule.metadata.userId;

  integrationSdk.users
    .updateProfile({
      id: userId,
      privateData: {
        backgroundCheckSubscriptionSchedule: null,
      },
    })
    .catch(e => log.error(e));
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
      const susbcriptionScheduleCanceled = event.data.object;
      cancelBackgroundCheckSubscriptionSchedule(susbcriptionScheduleCanceled);
      break;
    case 'subscription_schedule.created':
      const susbcriptionScheduleCreated = event.data.object;
      updateBackgroundCheckSubscriptionSchedule(susbcriptionScheduleCreated);
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
};
