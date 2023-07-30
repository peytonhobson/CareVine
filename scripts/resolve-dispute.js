require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// const { integrationSdk } = require('../server/api-util/sdk');
const flexIntegrationSdk = require('sharetribe-flex-integration-sdk');

// node ./scripts/resolve-dispute.js 1000 tx_1HJ5Xt2eZvKYlo2CJ5QZ1Z5c --dry
// CLI amount should be in decimal format (50.26)

const integrationSdk = flexIntegrationSdk.createInstance({
  // These two env vars need to be set in the `.env` file.
  clientId: process.env.FLEX_INTEGRATION_CLIENT_ID,
  clientSecret: process.env.FLEX_INTEGRATION_CLIENT_SECRET,

  // Normally you can just skip setting the base URL and just use the
  // default that the `createInstance` uses. We explicitly set it here
  // for local testing and development.
  baseUrl: process.env.FLEX_INTEGRATION_BASE_URL || 'https://flex-integ-api.sharetribe.com',
});

const refundAmount = process.argv[2];
const txId = process.argv[3];
const dryRun = process.argv[4] === '--dry';

const main = async () => {
  try {
    const tx = await integrationSdk.transactions.show({ id: txId, include: ['provider'] });

    if (tx.data.data.attributes.lastTransition !== 'transition/dispute') {
      console.log('Transaction is not in dispute state');
      return;
    }

    const { lineItems, paymentIntentId } = tx.data.data.attributes.metadata;

    const additionalLineItem = { amount: -1 * refundAmount, code: 'refund' };

    const newLineItems = [...lineItems, additionalLineItem];

    if (!dryRun) {
      await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: parseInt(refundAmount * 100),
        reason: 'requested_by_customer',
        reverse_transfer: true,
      });

      await integrationSdk.transactions.updateMetadata({
        id: txId,
        metadata: {
          lineItems: newLineItems,
        },
      });

      const newAmount = newLineItems.reduce((acc, item) => acc + item.amount, 0);

      const provider = tx.data.data.relationships.provider.data;

      const pendingPayouts = provider.attributes.profile.metadata.pendingPayouts ?? [];
      const newPendingPayouts = pendingPayouts.map(payout => {
        if (payout.txId === bookingId) {
          return {
            ...payout,
            openDispute: false,
            amount: newAmount,
          };
        }
        return payout;
      });

      await integrationSdk.users.updateProfile({
        id: tx.data.data.relationships.provider.data.id.uuid,
        metadata: {
          pendingPayouts: newPendingPayouts,
        },
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
