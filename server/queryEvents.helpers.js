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

const approveListingNotification = async (userId, userName, listingId) => {
  try {
    const urlParams = `/l/${createSlug(userName)}/${listingId}`;

    await axios.post(
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
    await axios.post(
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
      await axios.post(
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

      await axios.post(
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

const updateListingApproveListing = async event => {
  const userId = event.attributes.resource.relationships?.author?.data?.id?.uuid;

  try {
    const res = await integrationSdk.users.show({
      id: userId,
      include: ['stripeAccount'],
    });

    const user = res?.data?.data;
    const metadata = user?.attributes?.profile?.metadata;
    const openListing =
      metadata?.userType === CAREGIVER
        ? metadata?.backgroundCheckSubscription?.status === 'active' &&
          user?.attributes?.emailVerified
        : user?.attributes?.emailVerified;
    if (openListing) {
      const listingId = event.attributes.resource.id.uuid;

      await integrationSdk.listings.approve({
        id: listingId,
      });

      const userName = user?.attributes?.profile?.displayName;
      approveListingNotification(userId, userName, listingId);
    }
  } catch (e) {
    log.error(e, 'listing-update-approved-failed', {});
  }
};

const updateUserListingApproved = async event => {
  let listingState = null;
  const userId = event.attributes.resource.id?.uuid;

  try {
    const res = await integrationSdk.listings.query({
      authorId: userId,
    });

    const userListingId = res.data.data[0].id.uuid;
    listingState = res.data.data[0].attributes.state;
    const displayName = event.attributes.resource.attributes.profile.displayName;

    if (listingState === 'pendingApproval') {
      await integrationSdk.listings.approve({
        id: userListingId,
      });

      approveListingNotification(userId, displayName, userListingId);
    }

    if (listingState === 'closed') {
      await integrationSdk.listings.open({
        id: userListingId,
      });

      approveListingNotification(userId, displayName, userListingId);
    }
  } catch (e) {
    log.error(e, 'user-update-approved-failed', {});
  }
};

const enrollUserTCM = async (event, userAccessCode) => {
  try {
    await axios.post(
      `${apiBaseUrl()}/api/authenticate-enroll-tcm`,
      {
        userAccessCode,
      },
      {
        headers: {
          'Content-Type': 'application/transit+json',
        },
      }
    );

    const userId = event?.attributes?.resource?.id?.uuid;
    await integrationSdk.users.updateProfile({
      id: userId,
      privateData: {
        tcmEnrolled: true,
      },
    });
  } catch (e) {
    log.error(e, 'user-enroll-tcm-failed', {});
  }
};

const deEnrollUserTCM = async (event, userAccessCode) => {
  try {
    await axios.post(
      `${apiBaseUrl()}/api/authenticate-deenroll-tcm`,
      {
        userAccessCode,
      },
      {
        headers: {
          'Content-Type': 'application/transit+json',
        },
      }
    );

    const userId = event.attributes.resource.id.uuid;
    await integrationSdk.users.updateProfile({
      id: userId,
      privateData: {
        tcmEnrolled: false,
      },
    });
  } catch (e) {
    log.error(e, 'user-deenroll-tcm-failed', {});
  }
};

const cancelSubscription = async backgroundCheckSubscription => {
  try {
    await axios.post(
      `${apiBaseUrl()}/api/stripe-update-subscription`,
      {
        subscriptionId: backgroundCheckSubscription.subscriptionId,
        params: { cancel_at_period_end: true },
      },
      {
        headers: {
          'Content-Type': 'application/transit+json',
        },
      }
    );
  } catch (e) {
    log.error(e, 'stripe-update-subscription-failed');
  }
};

module.exports = {
  updateUserListingApproved,
  approveListingNotification,
  closeListing,
  updateListingApproveListing,
  enrollUserTCM,
  deEnrollUserTCM,
  cancelSubscription,
};
