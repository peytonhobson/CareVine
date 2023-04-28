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
      console.log(response.data);
      if (users.length === 0) {
        res.status(404).send('User not found');
        return;
      }
      const user = users[0];

      console.log(user);

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
