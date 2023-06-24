require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { integrationSdk } = require('../server/api-util/sdk');

const refundAmount = process.argv[2];
const txId = process.argv[3];
const dryRun = process.argv[4] === 'dry-run';

const main = async () => {
  try {
    const tx = await integrationSdk.transactions.show({ id: txId });

    if (tx.data.data.attributes.lastTransition !== 'transition/dispute') {
      console.log('Transaction is not in dispute state');
      return;
    }

    const { lineItems, paymentIntentId } = tx.data.data.attributes.metadata;
    console.log(tx.data.data.attributes.metadata);

    const additionalLineItem = { amount: -1 * refundAmount, code: 'refund' };

    const newLineItems = [...lineItems, additionalLineItem];

    if (!dryRun) {
      await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: refundAmount,
        refund_application_fee: true,
        reason: 'Dispute',
        reverse_transfer: true,
      });

      await integrationSdk.transactions.updateMetadata({
        id: txId,
        metadata: {
          lineItems: newLineItems,
        },
      });

      await integrationSdk.transactions.transition({
        id: txId,
        transition: 'transition/dispute-resolved',
        params: {},
      });

      console.log('Refund successful');
    } else {
      console.log('newLineItems ', newLineItems);
      console.log('refundAmount ', refundAmount);
      console.log('txId ', txId);
    }
  } catch (e) {
    console.log(e);
  }
};

main();
