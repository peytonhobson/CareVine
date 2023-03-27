const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { integrationSdk, handleError, handleStripeError, serialize } = require('../api-util/sdk');
const log = require('../log');

const CARD_FEE_PERCENTAGE = 0.06;
const BANK_FEE_PERCENTAGE = 0.03;

const calculateOrderAmount = (amount, isCard) => {
  return amount + amount * (isCard ? CARD_FEE_PERCENTAGE : BANK_FEE_PERCENTAGE);
};

const calculateFeeAmount = (amount, isCard) => {
  return amount * (isCard ? CARD_FEE_PERCENTAGE : BANK_FEE_PERCENTAGE);
};

module.exports = (req, res) => {
  // Create a PaymentIntent with the order amount and currency

  const { userId, amount, stripeCustomerId, isCard, noFee, description } = req.body;

  const applicationFeeMaybe = noFee
    ? null
    : {
        application_fee_amount: Math.ceil(calculateFeeAmount(amount, isCard)),
      };

  integrationSdk.users
    .show({ id: userId.uuid, include: ['stripeAccount'] })
    .then(res => {
      const stripeAccountId = res?.data?.data?.attributes?.profile?.metadata?.stripeAccountId;
      const email = res?.data?.data?.attributes?.email;

      return stripe.paymentIntents.create({
        amount: noFee ? amount : Math.ceil(calculateOrderAmount(amount, isCard)),
        currency: 'usd',
        payment_method_types: [isCard ? 'card' : 'us_bank_account'],
        transfer_data: {
          destination: stripeAccountId,
        },
        ...applicationFeeMaybe,
        customer: stripeCustomerId,
        receipt_email: email,
        description,
      });
    })
    .then(apiResponse => {
      res
        .set('Content-Type', 'application/transit+json')
        .send(
          serialize({
            ...apiResponse,
          })
        )
        .end();
    })
    .catch(e => {
      if (e.raw) {
        handleStripeError(res, e);
      } else {
        handleError(res, e);
      }
    });
};
