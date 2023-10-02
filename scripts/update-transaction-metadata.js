// This dotenv import is required for the `.env` file to be read
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

const queryAllPages = (query, page = 3, allResults = []) => {
  return integrationSdk.transactions
    .query({
      customerId: '6352e1f6-c07c-403c-84ac-48bbaef586a2',
      providerId: '639bbc9d-9dab-4c1d-af2b-acd25f350334',
      page,
      perPage: 100,
    })
    .then(response => {
      const { data, meta } = response;
      const { totalPages, page: currentPage } = data.meta;
      const results = [...allResults, ...data.data];
      if (currentPage < totalPages) {
        console.log(page);
        return queryAllPages(query, currentPage + 1, results);
      } else {
        return results;
      }
    });
};

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function sleep() {
  await timeout(500);
}

const main = async () => {
  try {
    const transactions = await queryAllPages();

    console.log(transactions);
    console.log(`Found ${transactions.length} transactions`);
    // Wrap calls to integration API in a function, that will be later
    // executed by the bulkUpdate function.

    let count = 0;
    for (const tx of transactions) {
      console.log(count);
      count++;
      await integrationSdk.transactions.updateMetadata({
        id: tx.id.uuid,
        metadata: {
          cancelAtPeriodEnd: true,
        },
      });
    }
  } catch (err) {
    console.log(err?.data?.errors || err);
  }
};

main();
