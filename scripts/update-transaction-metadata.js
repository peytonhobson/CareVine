// This dotenv import is required for the `.env` file to be read
require('dotenv').config();
const flexIntegrationSdk = require('sharetribe-flex-integration-sdk');

// Read dry run from arguments
const dryRun = process.argv[2];

const integrationSdk = flexIntegrationSdk.createInstance({
  // These two env vars need to be set in the `.env` file.
  clientId: process.env.FLEX_INTEGRATION_CLIENT_ID,
  clientSecret: process.env.FLEX_INTEGRATION_CLIENT_SECRET,

  // Normally you can just skip setting the base URL and just use the
  // default that the `createInstance` uses. We explicitly set it here
  // for local testing and development.
  baseUrl: process.env.FLEX_INTEGRATION_BASE_URL || 'https://flex-integ-api.sharetribe.com',
});

const timeout = 500;

const main = async () => {
  try {
    const transactions = await integrationSdk.transactions.query({
      perPage: 100,
      page: 7,
    });

    console.log(transactions);
    console.log(`Found ${transactions.data.data.length} transactions`);
    // Wrap calls to integration API in a function, that will be later
    // executed by the bulkUpdate function.

    await Promise.all(
      transactions.data.data.map(async transaction => {
        const bookingSchedule = transaction.attributes.metadata.bookingSchedule;

        // console.log(listing.id);

        if (bookingSchedule && !Array.isArray(bookingSchedule)) {
          await integrationSdk.transactions.updateMetadata({
            id: transaction.id.uuid,
            metadata: {
              bookingSchedule: [],
            },
          });
        }
      })
    );
  } catch (err) {
    console.log(err);
  }
};

main();
