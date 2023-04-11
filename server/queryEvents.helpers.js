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

const approveListingNotification = userId => {
  try {
    axios.post(
      `${apiBaseUrl()}/api/sendgrid-template-email`,
      {
        receiverId: userId,
        templateName: 'listing-approved',
        templateData: { marketplaceUrl: rootUrl },
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
