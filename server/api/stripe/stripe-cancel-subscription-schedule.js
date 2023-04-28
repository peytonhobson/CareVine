const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { handleStripeError, serialize } = require('../../api-util/sdk');
const log = require('../../log');

module.exports = (req, res) => {
  const { scheduleId } = req.body;

  stripe.subscriptionSchedules
    .cancel(scheduleId)
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
