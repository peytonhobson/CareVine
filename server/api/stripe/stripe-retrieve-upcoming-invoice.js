const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { handleStripeError, serialize } = require('../../api-util/sdk');
const log = require('../../log');

module.exports = (req, res) => {
  const { stripeCustomerId } = req.body;

  return stripe.invoices
    .retrieveUpcoming({
      customer: stripeCustomerId,
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
      if (e.statusCode === 404) {
        res
          .set('Content-Type', 'application/transit+json')
          .send(
            serialize({
              data: null,
            })
          )
          .end();
        return;
      }

      log.error(e, 'stripe-retrieve-upcoming-invoice-failed');
      handleStripeError(res, e);
    });
};
