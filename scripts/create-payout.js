require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const main = async () => {
  await stripe.payouts.create(
    {
      amount: 69952274,
      currency: 'usd',
    },
    {
      stripeAccount: 'acct_1MFf3NQw1sFyCVAj',
    }
  );
};

main();
