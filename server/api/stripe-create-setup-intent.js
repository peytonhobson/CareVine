const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { handleStripeError, serialize } = require('../api-util/sdk');
const log = require('../log');

module.exports = (req, res) => {
  const { stripeCustomerId } = req.body;

  if (stripeCustomerId) {
    return stripe.setupIntents
      .create({
        customer: stripeCustomerId,
        payment_method_types: ['card', 'us_bank_account'],
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
        handleStripeError(res, e);
      });
  } else {
    res
      .set('Content-Type', 'application/transit+json')
      .status(400)
      .send(serialize({ error: 'Missing stripeCustomerId' }))
      .end();
  }
};
