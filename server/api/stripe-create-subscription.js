const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { handleStripeError, serialize } = require('../api-util/sdk');
const log = require('../log');

const CAREVINE_GOLD_PRICE_ID =
  process.env.REACT_APP_ENV === 'development'
    ? 'price_1MXTvhJsU2TVwfKBFEkLhUKp'
    : 'price_1MXTyYJsU2TVwfKBrzI6O23S';

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
      description: `Payment for ${
        priceId === CAREVINE_GOLD_PRICE_ID ? 'Carevine Gold' : 'CareVine Basic'
      }`,
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
