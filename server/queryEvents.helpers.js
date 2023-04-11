const fs = require('fs');
const flexIntegrationSdk = require('sharetribe-flex-integration-sdk');
const axios = require('axios');
const SB_API_TOKEN = process.env.SENDBIRD_API_TOKEN;
const appId = process.env.REACT_APP_SENDBIRD_APP_ID;
const log = require('./log');
const isDev = process.env.REACT_APP_ENV === 'development';
const rootUrl = process.env.REACT_APP_CANONICAL_ROOT_URL;
const CAREGIVER = 'caregiver';
const BACKGROUND_CHECK_APPROVED = 'approved';
const BACKGROUND_CHECK_REJECTED = 'rejected';
const isTest = process.env.NODE_ENV === 'production' && isDev;
const isProd = process.env.NODE_ENV === 'production' && !isDev;
const isLocal = process.env.NODE_ENV === 'development' && isDev;
const { v4: uuidv4 } = require('uuid');

const createSlug = str => {
  let text = str
    .toString()
    .toLowerCase()
    .trim();

  const sets = [
    { to: 'a', from: 'ÀÁÂÃÄÅÆĀĂĄẠẢẤẦẨẪẬẮẰẲẴẶ' },
    { to: 'c', from: 'ÇĆĈČ' },
    { to: 'd', from: 'ÐĎĐÞ' },
    { to: 'e', from: 'ÈÉÊËĒĔĖĘĚẸẺẼẾỀỂỄỆ' },
    { to: 'g', from: 'ĜĞĢǴ' },
    { to: 'h', from: 'ĤḦ' },
    { to: 'i', from: 'ÌÍÎÏĨĪĮİỈỊ' },
    { to: 'j', from: 'Ĵ' },
    { to: 'ij', from: 'Ĳ' },
    { to: 'k', from: 'Ķ' },
    { to: 'l', from: 'ĹĻĽŁ' },
    { to: 'm', from: 'Ḿ' },
    { to: 'n', from: 'ÑŃŅŇ' },
    { to: 'o', from: 'ÒÓÔÕÖØŌŎŐỌỎỐỒỔỖỘỚỜỞỠỢǪǬƠ' },
    { to: 'oe', from: 'Œ' },
    { to: 'p', from: 'ṕ' },
    { to: 'r', from: 'ŔŖŘ' },
    { to: 's', from: 'ßŚŜŞŠ' },
    { to: 't', from: 'ŢŤ' },
    { to: 'u', from: 'ÙÚÛÜŨŪŬŮŰŲỤỦỨỪỬỮỰƯ' },
    { to: 'w', from: 'ẂŴẀẄ' },
    { to: 'x', from: 'ẍ' },
    { to: 'y', from: 'ÝŶŸỲỴỶỸ' },
    { to: 'z', from: 'ŹŻŽ' },
    { to: '-', from: "·/_,:;'" },
  ];

  sets.forEach(set => {
    text = text.replace(new RegExp(`[${set.from}]`, 'gi'), set.to);
  });

  const slug = encodeURIComponent(
    text
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w-]+/g, '') // Remove all non-word chars
      .replace(/--+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, '') // Trim - from end of text
  );

  return slug.length > 0 ? slug : 'no-slug';
};

const apiBaseUrl = () => {
  const port = process.env.REACT_APP_DEV_API_SERVER_PORT;
  const useDevApiServer = process.env.NODE_ENV === 'development' && !!port;

  // In development, the dev API server is running in a different port
  if (useDevApiServer) {
    return `http://localhost:${port}`;
  }

  // Otherwise, use the same domain and port as the frontend
  return process.env.REACT_APP_CANONICAL_ROOT_URL;
};

const integrationSdk = flexIntegrationSdk.createInstance({
  // These two env vars need to be set in the `.env` file.
  clientId: process.env.FLEX_INTEGRATION_CLIENT_ID,
  clientSecret: process.env.FLEX_INTEGRATION_CLIENT_SECRET,

  // Normally you can just skip setting the base URL and just use the
  // default that the `createInstance` uses. We explicitly set it here
  // for local testing and development.
  baseUrl: process.env.FLEX_INTEGRATION_BASE_URL || 'https://flex-integ-api.sharetribe.com',
});

const approveListingNotification = (userId, userName, listingId) => {
  try {
    const urlParams = `/l/${createSlug(userName)}/${listingId}`;

    axios.post(
      `${apiBaseUrl()}/api/sendgrid-template-email`,
      {
        receiverId: userId,
        templateName: 'listing-approved',
        templateData: { marketplaceUrl: rootUrl, urlParams },
      },
      {
        headers: {
          'Content-Type': 'application/transit+json',
        },
      }
    );
  } catch (e) {
    log.error(e, 'approve-listing-email-failed', {});
  }

  const newNotification = {
    id: uuidv4(),
    type: 'listingOpened',
    createdAt: new Date().getTime(),
    isRead: false,
    metadata: {},
  };

  try {
    axios.post(
      `${apiBaseUrl()}/api/update-user-notifications`,
      {
        userId,
        newNotification,
      },
      {
        headers: {
          'Content-Type': 'application/transit+json',
        },
      }
    );
  } catch (e) {
    log.error(e, 'approve-listing-notifications-failed', {});
  }
};

const closeListing = async userId => {
  let listing;

  try {
    const res = await integrationSdk.listings.query({ authorId: userId });
    listing = res?.data?.data?.length > 0 && res.data.data[0];
  } catch (e) {
    log.error(e, 'listing-closed-query-failed', {});
  }

  if (listing?.attributes?.state === 'published') {
    try {
      await integrationSdk.listings.close(
        {
          id: listing.id.uuid,
        },
        {
          expand: true,
        }
      );
    } catch (e) {
      log.error(e, 'listing-closed-failed', {});
    }

    try {
      axios.post(
        `${apiBaseUrl()}/api/sendgrid-template-email`,
        {
          receiverId: userId,
          templateName: 'listing-closed',
          templateData: { marketplaceUrl: rootUrl },
        },
        {
          headers: {
            'Content-Type': 'application/transit+json',
          },
        }
      );
    } catch (e) {
      log.error(e, 'listing-closed-email-failed', {});
    }

    try {
      const newNotification = {
        id: uuidv4(),
        type: 'listingRemoved',
        createdAt: new Date().getTime(),
        isRead: false,
        metadata: {},
      };

      axios.post(
        `${apiBaseUrl()}/api/update-user-notifications`,
        {
          userId,
          newNotification,
        },
        {
          headers: {
            'Content-Type': 'application/transit+json',
          },
        }
      );
    } catch (e) {
      log.error(e, 'listing-closed-notifications-failed', {});
    }
  }
};

module.exports = {
  approveListingNotification,
  closeListing,
};
