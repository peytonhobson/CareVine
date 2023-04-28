const { integrationSdk, handleError, serialize } = require('../../api-util/sdk');
const log = require('../../log');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = (req, res) => {
  // Create a PaymentIntent with the order amount and currency

  const { stripeCustomerId } = req.body;

  stripe.customers
    .retrieve(stripeCustomerId)
    .then(apiResponse => {
      res
        .status(200)
        .set('Content-Type', 'application/transit+json')
        .send(
          serialize({
            data: apiResponse,
          })
        )
        .end();
    })
    .catch(e => {
      handleError(res, e);
    });
};
