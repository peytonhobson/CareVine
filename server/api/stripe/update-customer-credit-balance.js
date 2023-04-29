const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { handleStripeError, serialize, integrationSdk } = require('../../api-util/sdk');
const log = require('../../log');

module.exports = (req, res) => {
  const { referralCode, amount } = req.body;

  return stripe.customers
    .search({
      query: `metadata['referralCode']: '${referralCode}'`,
    })
    .then(response => {
      const users = response.data;
      const user = users.length > 0 ? users[0] : null;

      if (!user) {
        throw new Error('User not found');
      }

      return user.id;
    })
    .then(stripeCustomerId => {
      return stripe.customers.createBalanceTransaction(stripeCustomerId, {
        amount,
        currency: 'usd',
      });
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
    .catch(e => handleStripeError(res, e));
};
