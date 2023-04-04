const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { handleStripeError, serialize } = require('../api-util/sdk');
const log = require('../log');

module.exports = async (req, res) => {
  const { subscriptionId, params } = req.body;

  try {
    const subscriptionItems = await stripe.subscriptionItems.list({
        subscription: subscriptionId,
    });

    const subscriptionItem = await stripe.subscriptionItems.update(
        subscriptionItems.data[0].id,
        {...params}
    );

    res
        .set('Content-Type', 'application/transit+json')
        .send(
          serialize({
            ...subscriptionItem,
          })
        )
        .end();
  } catch (e) {
    handleStripeError(res, e);
  }
};
