const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { handleStripeError } = require('../../api-util/sdk');
const log = require('../../log');

module.exports = async (req, res) => {
  const { paymentIntentId, amount, applicationFeeRefund, chargeId, params = {} } = req.body;

  try {
    const apiResponse = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount + applicationFeeRefund,
      reason: 'requested_by_customer',
      reverse_transfer: true,
      ...params,
    });

    if (applicationFeeRefund && chargeId) {
      const charges = await stripe.charges.list({
        limit: 3,
        payment_intent: paymentIntentId,
      });

      const applicationFeeId = charges.data?.find(c => c.application_fee)?.application_fee;
      console.log('applicationFeeId', applicationFeeId);
      console.log('creating refund');

      try {
        await stripe.applicationFees.createRefund(applicationFeeId, {
          amount: applicationFeeRefund,
        });
      } catch (e) {
        log.error(e, 'Error refunding application fee', {
          applicationFeeId,
          amount,
          applicationFeeRefund,
        });
      }
    }

    res.status(200).json({ ...apiResponse });
  } catch (e) {
    handleStripeError(res, e);
  }
};
