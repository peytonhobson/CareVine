require('dotenv').config();
const flexIntegrationSdk = require('sharetribe-flex-integration-sdk');
const moment = require('moment');

const integrationSdk = flexIntegrationSdk.createInstance({
  // These two env vars need to be set in the `.env` file.
  clientId: process.env.FLEX_INTEGRATION_CLIENT_ID_PROD,
  clientSecret: process.env.FLEX_INTEGRATION_CLIENT_SECRET_PROD,

  // Normally you can just skip setting the base URL and just use the
  // default that the `createInstance` uses. We explicitly set it here
  // for local testing and development.
  baseUrl: process.env.FLEX_INTEGRATION_BASE_URL || 'https://flex-integ-api.sharetribe.com',
});

const onDayAgo = moment()
  .subtract(1, 'days')
  .toISOString();

integrationSdk.listings
  .query({
    meta_finishProfileReminderReceived: false,
    include: ['author'],
    states: ['draft'],
  })
  .then(listingsResponse => {
    const listings = listingsResponse.data.data;

    listings.forEach(l => {
      console.log(l.attributes.createdAt);
    });
  });

console.log(onDayAgo);
