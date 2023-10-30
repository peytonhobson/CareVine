const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { handleStripeError, serialize } = require('../../api-util/sdk');
const log = require('../../log');

module.exports = (req, res) => {
  const { paymentIntentId, amount, applicationFeeRefund, params = {} } = req.body;

  stripe.refunds
    .create({
      payment_intent: paymentIntentId,
      amount: amount + applicationFeeRefund,
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
                log.error(e, 'Error refunding application fee', {
                  applicationFeeId,
                  amount,
                  applicationFeeRefund,
                });
              });
          })
          .catch(e => {
            log.error(e, 'Error listing application fees', { paymentIntentId });
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
