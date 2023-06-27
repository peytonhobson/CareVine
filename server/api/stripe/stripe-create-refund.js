const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { handleStripeError, serialize } = require('../../api-util/sdk');
const log = require('../../log');

module.exports = (req, res) => {
  const { paymentIntentId, amount } = req.body;

  stripe.refunds
    .create({
      payment_intent: paymentIntentId,
      amount,
      refund_application_fee: true,
      reason: 'requested_by_customer',
      reverse_transfer: true,
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
