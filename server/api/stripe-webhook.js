const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { handleError, serialize, integrationSdk } = require('../api-util/sdk');
const log = require('../log');
const VINE_CHECK_PRICE_ID =
  process.env.REACT_APP_ENV === 'development'
    ? 'price_1MXTvhJsU2TVwfKBFEkLhUKp'
    : 'price_1MXTyYJsU2TVwfKBrzI6O23S';

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
// 'whsec_b88f8999d9d2c9f50c195babbb8b67eb6a33803a28f1e37a11e302e35af4ddc7';
// process.env.STRIPE_WEBHOOK_SECRET;

const updateBackgroundCheckSubscription = subscription => {
  const userId = subscription.metadata.userId;

  integrationSdk.users
    .updateProfile({
      id: userId,
      privateData: {
        backgroundCheckSubscription: {
          // May set this to null if webhooks work
          status: subscription.status,
          subscriptionId: subscription.id,
          type: subscription.items.data[0].price.id === VINE_CHECK_PRICE_ID ? 'vine' : 'basic',
          currentPeriodEnd: subscription.current_period_end,
          amount: subscription.plan.amount,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
      },
    })
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
          type: schedule.phases[0].items[0].price === VINE_CHECK_PRICE_ID ? 'vine' : 'basic',
          amount: schedule.phases[0].items[0].price === VINE_CHECK_PRICE_ID ? 499 : 1499,
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
