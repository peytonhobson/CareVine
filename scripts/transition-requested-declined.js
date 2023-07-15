require('dotenv').config();
const flexIntegrationSdk = require('sharetribe-flex-integration-sdk');

const integrationSdk = flexIntegrationSdk.createInstance({
  // These two env vars need to be set in the `.env` file.
  clientId: process.env.FLEX_INTEGRATION_CLIENT_ID,
  clientSecret: process.env.FLEX_INTEGRATION_CLIENT_SECRET,

  // Normally you can just skip setting the base URL and just use the
  // default that the `createInstance` uses. We explicitly set it here
  // for local testing and development.
  baseUrl: process.env.FLEX_INTEGRATION_BASE_URL || 'https://flex-integ-api.sharetribe.com',
});

const main = async () => {
  try {
    const listingsResponse = await integrationSdk.transactions.query();

    const txs = listingsResponse.data.data;
    await Promise.all(
      txs.forEach(async tx => {
        if (tx.attributes.lastTransition === 'transition/request-booking') {
          await integrationSdk.transactions.transition({
            id: tx.id.uuid,
            transition: 'transition/decline-booking',
            params: {},
          });
        }
      })
    );
  } catch (err) {
    console.log(err);
  }
};

main();
