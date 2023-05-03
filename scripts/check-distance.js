require('dotenv').config();
const flexIntegrationSdk = require('sharetribe-flex-integration-sdk');
var crypto = require('crypto');
const { point, distance } = require('@turf/turf');
const sgMail = require('@sendgrid/mail');

const calculateDistanceBetweenOrigins = (latlng1, latlng2) => {
  const options = { units: 'miles' };
  const point1 = point([latlng1.lng, latlng1.lat]);
  const point2 = point([latlng2.lng, latlng2.lat]);
  return Number.parseFloat(distance(point1, point2, options)).toFixed(2);
};

const integrationSdk = flexIntegrationSdk.createInstance({
  // These two env vars need to be set in the `.env` file.
  clientId: process.env.FLEX_INTEGRATION_CLIENT_ID_PROD,
  clientSecret: process.env.FLEX_INTEGRATION_CLIENT_SECRET_PROD,

  // Normally you can just skip setting the base URL and just use the
  // default that the `createInstance` uses. We explicitly set it here
  // for local testing and development.
  baseUrl: process.env.FLEX_INTEGRATION_BASE_URL || 'https://flex-integ-api.sharetribe.com',
});
const main = async () => {
  try {
    const res = await integrationSdk.listings.show({ id: '64527f99-195b-4de8-9801-a8fa2e7ed95b' });

    const listing = res.data.data;

    const response = await integrationSdk.listings.query({
      meta_listingType: 'caregiver',
      include: ['author'],
    });

    const listings = response.data.data;

    const geolocation = listing?.attributes?.geolocation;

    const authorIds = listings
      .filter(l => {
        const { geolocation: cGeolocation } = l?.attributes;
        return calculateDistanceBetweenOrigins(geolocation, cGeolocation) <= 20;
      })
      .map(l => l.relationships.author.data.id.uuid);

    const userResponse = await Promise.all(
      authorIds.map(async id => {
        return await integrationSdk.users.show({ id });
      })
    );

    const emails = userResponse.map(u => u.data.data.attributes.email);

    console.log(emails);

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      from: 'CareVine@carevine-mail.us',
      to: emails,
      template_id: 'd-7da4e1b9c133497499ddcb6ad1ccff9f',
      asm: {
        group_id: 22860,
      },
    };

    // sgMail
    //   .sendMultiple(msg)
    //   .then(() => {
    //     console.log('Emails sent successfully');
    //   })
    //   .catch(error => {
    //     console.log(error?.response?.body?.errors);
    //   });
  } catch (err) {
    console.log(err);
  }
};

main();
