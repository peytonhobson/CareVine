const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { handleStripeError, serialize } = require('../../api-util/sdk');
const log = require('../../log');

module.exports = (req, res) => {
  const { paymentIntentId, amount, applicationFeeRefund, params = {} } = req.body;

  stripe.refunds
    .create({
      payment_intent: paymentIntentId,
      amount,
      reason: 'requested_by_customer',
      reverse_transfer: true,
      ...params,
    })
    .then(apiResponse => {
      if (applicationFeeRefund) {
        stripe.applicationFees
          .list({
            limit: 3,
          })
          .then(response => {
            const applicationFeeId = response.data?.[0].id;

            stripe.applicationFees
              .createRefund(applicationFeeId, { amount: applicationFeeRefund })
              .catch(e => {
                throw e;
              });
          })
          .catch(e => {
            throw e;
          });
      }

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
