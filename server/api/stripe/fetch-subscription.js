const { handleStripeError, serialize } = require('../../api-util/sdk');
const log = require('../../log');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = (req, res) => {
  const { subscriptionId } = req.body;

  stripe.subscriptions
    .retrieve(subscriptionId)
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
      log.error(e, 'error fetching subscription');
      handleStripeError(res, e);
    });
};
