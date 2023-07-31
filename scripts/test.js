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
    const tx = await integrationSdk.transactions.show({
      id: '64c58089-d531-4e29-aff0-9e93ad4bcc92',
      include: ['booking'],
    });

    console.log(tx.data.included);
  } catch (e) {
    console.log(e);
  }
};

main();
