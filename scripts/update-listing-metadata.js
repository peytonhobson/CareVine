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
  if (dryRun === '--dry-run=false') {
    try {
      const listings = await integrationSdk.listings.query({ meta_listingType: 'caregiver' });
      console.log(`Found ${listings.data.data.length} listings`);
      // Wrap calls to integration API in a function, that will be later
      // executed by the bulkUpdate function.

      await Promise.all(
        listings.data.data.map(async listing => {
          const scheduleTypes = listing.attributes.publicData.scheduleTypes || [];

          console.log(listing.id);

          await integrationSdk.listings.update({
            id: listing.id,
            publicData: {
              openToLiveIn: scheduleTypes.includes('liveIn') ? 'yes' : 'no',
            },
          });
        })
      );
    } catch (err) {
      console.log(err);
    }
  } else {
    analyze.then(() => {
      console.log('To execute bulk update, run this command with --dry-run=false option');
    });
  }
};

main();
