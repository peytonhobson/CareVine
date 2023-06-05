require('dotenv').config();
const { ConstructionOutlined } = require('@mui/icons-material');
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

const convertTimeFrom12to24 = fullTime => {
  // Current time looks like 7:00am
  // We want to convert it to 07:00
  const [time, ampm] = fullTime.split(/(am|pm)/i);

  const [hours, minutes] = time.split(':');

  if (hours === '12' && ampm === 'am') {
    return '00:00';
  }

  if (ampm === 'pm') {
    return `${parseInt(hours) + 12}:${minutes}`;
  }
  return `${hours < 10 ? `0${hours}` : hours}:${minutes}`;
};

const convertPublicPlanToBuiltIn = publicPlan => {
  const { entries, timezone } = publicPlan;

  const convertedEntries = entries.map(entry => ({
    dayOfWeek: entry.dayOfWeek,
    startTime: convertTimeFrom12to24(entry.startTime),
    endTime: convertTimeFrom12to24(entry.endTime),
    seats: 1,
  }));

  return {
    type: 'availability-plan/time',
    timezone,
    entries: convertedEntries,
  };
};

const main = async () => {
  try {
    const listingsResponse = await integrationSdk.listings.query({ meta_listingType: 'caregiver' });

    const listings = listingsResponse.data.data;

    const hasPublicPlan = listings.filter(
      listing => listing.attributes.publicData.availabilityPlan
    );

    await Promise.all(
      hasPublicPlan.map(async listing => {
        const convertedPlan = convertPublicPlanToBuiltIn(
          listing.attributes.publicData.availabilityPlan
        );

        try {
          await integrationSdk.listings.update({
            id: listing.id.uuid,
            availabilityPlan: convertedPlan,
          });
        } catch (err) {
          //   console.log(err);
        }
      })
    );
  } catch (err) {
    console.log(err.data.errors);
  }
};

main();
