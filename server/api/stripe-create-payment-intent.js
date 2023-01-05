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

  const { userId, amount, stripeCustomerId, isCard } = req.body;

  integrationSdk.users
    .show({ id: userId.uuid, include: ['stripeAccount'] })
    .then(res => {
      const stripeAccountId = res.data.data.attributes.profile.metadata.stripeAccountId;

      return stripeAccountId;
    })
    .then(stripeAccountId => {
      return stripe.paymentIntents
        .create({
          amount: calculateOrderAmount(amount, isCard),
          currency: 'usd',
          payment_method_types: [isCard ? 'card' : 'us_bank_account'],
          transfer_data: {
            destination: stripeAccountId,
          },
          application_fee_amount: calculateFeeAmount(amount, isCard),
          customer: stripeCustomerId,
        })
        .catch(e => {
          handleStripeError(res, e);
          throw e;
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
      handleError(res, e);
    });
};
