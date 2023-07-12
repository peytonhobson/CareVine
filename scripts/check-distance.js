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
    const res = await integrationSdk.listings.show({
      id: '648e1eeb-e21f-45ab-8c14-545f028957da',
    });

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
        return cGeolocation
          ? calculateDistanceBetweenOrigins(geolocation, cGeolocation) <= 20
          : false;
      })
      .map(l => l.relationships.author.data.id.uuid);

    const userResponse = await Promise.all(
      authorIds.map(async id => {
        return await integrationSdk.users.show({ id });
      })
    );

    const emails = userResponse.map(u => ({
      to: u.data.data.attributes.email,
      dynamic_template_data: {
        listingTitle: listing.attributes.title,
        marketplaceUrl: 'https://carevine.us',
      },
    }));

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      from: 'CareVine@carevine-mail.us',
      template_id: 'd-4440656b0a504f3d9e5d2c2311dbc888',
      asm: {
        group_id: 42912,
      },
      personalizations: emails,
    };

    console.log(emails);

    sgMail
      .sendMultiple(msg)
      .then(() => {
        console.log('Emails sent successfully');
      })
      .catch(error => {
        console.log(error?.response?.body?.errors);
      });
  } catch (err) {
    console.log(err);
  }
};

main();
