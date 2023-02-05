const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { handleStripeError, serialize } = require('../api-util/sdk');
const log = require('../log');

module.exports = (req, res) => {
  const { stripeCustomerId, startDate, priceId, userId } = req.body;

  stripe.subscriptionSchedules
    .create({
      customer: stripeCustomerId,
      start_date: startDate,
      end_behavior: 'release',
      phases: [
        {
          items: [{ price: priceId }],
        },
      ],
      metadata: {
        userId,
      },
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
};
