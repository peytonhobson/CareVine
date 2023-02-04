const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { handleStripeError, serialize } = require('../api-util/sdk');
const log = require('../log');

module.exports = (req, res) => {
  const { stripeCustomerId, priceId, userId, params } = req.body;

  stripe.subscriptions
    .create({
      customer: stripeCustomerId,
      items: [
        {
          price: priceId,
        },
      ],
      collection_method: 'charge_automatically',
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card'],
      },
      //   automatic_tax: {
      //     enabled: true,
      //   },
      metadata: {
        userId,
      },
      expand: ['latest_invoice.payment_intent'],
      ...params,
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
