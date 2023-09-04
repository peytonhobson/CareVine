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

const listingId = process.argv[2];

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
      id: listingId,
      include: ['author'],
    });

    const listing = res.data.data;

    const authorResponse = await integrationSdk.users.show({
      id: listing.relationships.author.data.id.uuid,
      include: ['profileImage'],
      'fields.image': ['variants.email-variant&imageVariant.email-variant=w:130;h:130;fit:scale'],
      'limit.images': 1,
    });
    const author = authorResponse.data.data;

    const response = await integrationSdk.listings.query({
      meta_listingType: 'employer',
      include: ['author', 'author.profileImage'],
    });

    const listings = response.data.data;

    const geolocation = listing?.attributes?.geolocation;

    const authors = listings
      .filter(l => {
        const { geolocation: cGeolocation } = l?.attributes;
        return cGeolocation
          ? calculateDistanceBetweenOrigins(geolocation, cGeolocation) <= 20
          : false;
      })
      .map(l => ({
        id: l.relationships.author.data.id.uuid,
        distance: calculateDistanceBetweenOrigins(geolocation, l?.attributes?.geolocation),
      }));

    const userResponse = await Promise.all(
      authors.map(async author => {
        return await integrationSdk.users.show({ id: author.id });
      })
    );

    const emails = userResponse.map(u => ({
      to: u.data.data.attributes.email,
      dynamic_template_data: {
        marketplaceUrl: 'https://carevine.us',
        profilePicture:
          'https://sharetribe.imgix.net/644806ee-acbc-40b2-bfbb-b116f6b16b03/64efd338-6b54-4f69-bb95-a4026c067b30?auto=format&crop=edges&fit=crop&h=240&w=240&s=ee095ea41af0b36cff665c2214293e9d',
        name: author.attributes.profile.displayName,
        description: listing.attributes.description.substring(0, 140) + '...',
        listingId,
        distance: authors.find(a => a.id === u.data.data.id.uuid).distance,
        location: `${listing.attributes.publicData.location.city}, ${listing.attributes.publicData.location.state}`,
      },
    }));

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      from: 'CareVine@carevine-mail.us',
      template_id: 'd-20bf043d40624d0aace5806466edb50b',
      asm: {
        group_id: 42912,
      },
      personalizations: emails,
      // personalizations: emails.slice(0, 1).map(e => ({
      //   ...e,
      //   to: 'peyton.hobson1@gmail.com',
      // })),
    };

    console.log(msg.personalizations);

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
