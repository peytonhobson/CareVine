const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { integrationSdk, handleStripeError, serialize } = require('../api-util/sdk');
const log = require('../log');

module.exports = (req, res) => {
  const { stripeCustomerId, params } = req.body;

  return stripe.customers
    .update(stripeCustomerId, { ...params })
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
      handleStripeError(res, e);
    });
};
