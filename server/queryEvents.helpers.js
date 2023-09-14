const { integrationSdk } = require('./api-util/sdk');
const axios = require('axios');
const log = require('./log');
const rootUrl = process.env.REACT_APP_CANONICAL_ROOT_URL;
const { v4: uuidv4 } = require('uuid');
const isDev = process.env.REACT_APP_ENV === 'development';
const { point, distance } = require('@turf/turf');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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

const approveListingNotification = async (userId, listingId, sendEmail, eventSequenceId) => {
  if (sendEmail) {
    try {
      const userResponse = await integrationSdk.users.show({ id: userId });

      const user = userResponse.data.data;

      const notifications = user.attributes.profile.metadata.notifications || [];

      const hasNotification = notifications.find(
        n => n.metadata.eventSequenceId === eventSequenceId
      );

      if (hasNotification) {
        return;
      }

      const userName = userResponse?.data.data.attributes.profile.displayName;

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
  }

  const newNotification = {
    id: uuidv4(),
    type: 'listingOpened',
    createdAt: new Date().getTime(),
    isRead: false,
    metadata: {
      eventSequenceId,
    },
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

const closeListingNotification = async (userId, eventSequenceId) => {
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
        eventSequenceId,
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
};

const enrollUserTCM = async (event, userAccessCode) => {
  try {
    await axios.post(
      `${apiBaseUrl()}/api/authenticate-enroll-tcm`,
      {
        userAccessCode: isDev ? 'test' : userAccessCode,
      },
      {
        headers: {
          'Content-Type': 'application/transit+json',
        },
      }
    );

    const userId = event.attributes.resource.id?.uuid;
    await integrationSdk.users.updateProfile({
      id: userId,
      privateData: {
        tcmEnrolled: true,
      },
    });
  } catch (e) {
    log.error(e?.data, 'user-enroll-tcm-failed', { userAccessCode });
  }
};

const deEnrollUserTCM = async (event, userAccessCode) => {
  try {
    await axios.post(
      `${apiBaseUrl()}/api/authenticate-deenroll-tcm`,
      {
        userAccessCode: isDev ? 'test' : userAccessCode,
      },
      {
        headers: {
          'Content-Type': 'application/transit+json',
        },
      }
    );

    const userId = event.attributes.resource.id?.uuid;
    await integrationSdk.users.updateProfile({
      id: userId,
      privateData: {
        tcmEnrolled: false,
      },
    });
  } catch (e) {
    log.error(e?.data, 'user-deenroll-tcm-failed', { userAccessCode });
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

const backgroundCheckApprovedNotification = async userId => {
  try {
    const res = await integrationSdk.listings.query({ authorId: userId });

    const listing = res?.data?.data?.length > 0 ? res.data.data[0] : null;

    const listingId = listing?.id?.uuid;
    await axios.post(
      `${apiBaseUrl()}/api/sendgrid-template-email`,
      {
        receiverId: userId,
        templateName: 'background-check-approved',
        templateData: {
          marketplaceUrl: rootUrl,
          listingId: listingId,
        },
      },
      {
        headers: {
          'Content-Type': 'application/transit+json',
        },
      }
    );
  } catch (e) {
    log.error(e, 'bc-approved-email-failed', {});
  }
};

const backgroundCheckRejectedNotification = async userId => {
  try {
    await axios.post(
      `${apiBaseUrl()}/api/sendgrid-template-email`,
      {
        receiverId: userId,
        templateName: 'background-check-rejected',
        templateData: { marketplaceUrl: rootUrl },
      },
      {
        headers: {
          'Content-Type': 'application/transit+json',
        },
      }
    );
  } catch (e) {
    log.error(e, 'send-bc-rejected-email-failed', {});
  }
};

const addUnreadMessageCount = async (txId, senderId) => {
  try {
    const response = await integrationSdk.transactions.show({
      id: txId,
      include: ['provider', 'customer'],
    });
    const transaction = response.data.data;

    const { customer, provider } = transaction.relationships;

    const customerUserId = customer.data.id?.uuid;
    const providerUserId = provider.data.id?.uuid;
    const recipientUserId = senderId === customerUserId ? providerUserId : customerUserId;

    const unreadMessageCount = transaction.attributes.metadata.unreadMessageCount ?? {
      [customerUserId]: 0,
      [providerUserId]: 0,
    };

    await integrationSdk.transactions.updateMetadata({
      id: txId,
      metadata: {
        unreadMessageCount: {
          ...unreadMessageCount,
          [recipientUserId]: (unreadMessageCount[recipientUserId] += 1),
        },
      },
    });

    sendWebsocketMessage(recipientUserId, 'message-created');
  } catch (e) {
    log.error(e, 'add-unread-message-count-failed', {});
  }
};

const sendQuizFailedEmail = async userId => {
  try {
    await axios.post(
      `${apiBaseUrl()}/api/sendgrid-standard-email`,
      {
        fromEmail: 'admin-notification@carevine-mail.us',
        receiverEmail: 'peyton.hobson@carevine.us',
        subject: 'Identity Quiz Failed',
        html: `<html><span>User ID: ${userId}</span></html>`,
      },
      {
        headers: {
          'Content-Type': 'application/transit+json',
        },
      }
    );
  } catch (e) {
    log.error(e, 'send-quiz-failed-email-failed', {});
  }
};

const calculateDistanceBetweenOrigins = (latlng1, latlng2) => {
  const options = { units: 'miles' };
  const point1 = point([latlng1.lng, latlng1.lat]);
  const point2 = point([latlng2.lng, latlng2.lat]);
  return Number.parseFloat(distance(point1, point2, options)).toFixed(2);
};

const sendNewJobInAreaEmail = async listing => {
  try {
    const listingId = listing.id.uuid;

    const authorResponse = await integrationSdk.users.show({
      id: listing.relationships.author.data.id.uuid,
      include: ['profileImage'],
      'fields.image': ['variants.square-small'],
      'limit.images': 1,
    });
    const author = authorResponse.data.data;

    const profilePicture =
      authorResponse.data?.included?.[0]?.attributes?.variants?.['square-small']?.url;

    const response = await integrationSdk.listings.query({
      meta_listingType: 'caregiver',
      include: ['author', 'author.profileImage'],
    });

    const listings = response.data.data;

    if (!listings.length) return;

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

    const { city, state } = listing.attributes.publicData.location;
    const { displayName, abbreviatedName } = author.attributes.profile;

    const emails = userResponse.map(u => ({
      to: u.data.data.attributes.email,
      dynamic_template_data: {
        marketplaceUrl: process.env.REACT_APP_CANONICAL_ROOT_URL,
        profilePicture,
        name: displayName,
        description: listing.attributes.description.substring(0, 140) + '...',
        listingId,
        distance: authors.find(a => a.id === u.data.data.id.uuid).distance,
        location: `${city}, ${state}`,
        abbreviatedName,
      },
    }));

    const msg = {
      from: {
        email: 'CareVine@carevine-mail.us',
        name: 'CareVine',
      },
      template_id: 'd-28579166f80a41c4b04b07a02dbc05d4',
      asm: {
        group_id: 42912,
      },
      personalizations: emails,
    };

    await sgMail.sendMultiple(msg);
  } catch (err) {
    log.error(err?.data?.errors, 'send-new-job-in-area-email-failed', {});
  }
};

// const sendNewCaregiverInAreaEmail = async listing => {
//   try {
//     const listingId = listing.id.uuid;

//     const authorResponse = await integrationSdk.users.show({
//       id: listing.relationships.author.data.id.uuid,
//       include: ['profileImage'],
//       'fields.image': ['variants.square-small'],
//       'limit.images': 1,
//     });
//     const author = authorResponse.data.data;

//     const profilePicture =
//       authorResponse.data?.included?.[0]?.attributes?.variants?.['square-small']?.url;

//     const response = await integrationSdk.listings.query({
//       meta_listingType: 'employer',
//       include: ['author', 'author.profileImage'],
//     });

//     const listings = response.data.data;

//     if (!listings.length) return;

//     const geolocation = listing?.attributes?.geolocation;

//     const authors = listings
//       .filter(l => {
//         const { geolocation: cGeolocation } = l?.attributes;
//         return cGeolocation
//           ? calculateDistanceBetweenOrigins(geolocation, cGeolocation) <= 20
//           : false;
//       })
//       .map(l => ({
//         id: l.relationships.author.data.id.uuid,
//         distance: calculateDistanceBetweenOrigins(geolocation, l?.attributes?.geolocation),
//       }));

//     const userResponse = await Promise.all(
//       authors.map(async author => {
//         return await integrationSdk.users.show({ id: author.id });
//       })
//     );

//     const { city, state } = listing.attributes.publicData.location;
//     const { displayName, abbreviatedName } = author.attributes.profile;

//     const emails = userResponse.map(u => ({
//       to: u.data.data.attributes.email,
//       dynamic_template_data: {
//         marketplaceUrl: process.env.REACT_APP_CANONICAL_ROOT_URL,
//         profilePicture,
//         name: displayName,
//         description: listing.attributes.description.substring(0, 140) + '...',
//         listingId,
//         distance: authors.find(a => a.id === u.data.data.id.uuid).distance,
//         location: `${city}, ${state}`,
//         abbreviatedName,
//       },
//     }));

//     const msg = {
//       from: {
//         email: 'CareVine@carevine-mail.us',
//         name: 'CareVine',
//       },
//       template_id: 'd-20bf043d40624d0aace5806466edb50b',
//       asm: {
//         group_id: 42912,
//       },
//       personalizations: emails,
//     };

//     await sgMail.sendMultiple(msg);
//   } catch (err) {
//     log.error(err?.data?.errors, 'send-new-caregiver-in-area-email-failed', {});
//   }
// };

const sendWebsocketMessage = async (userId, type) => {
  try {
    await axios.post(
      `${apiBaseUrl()}/ws/${type}`,
      {
        userId,
        serverId: process.env.WEBSOCKET_SERVER_ID,
      },
      {
        headers: {
          'Content-Type': 'application/transit+json',
        },
      }
    );
  } catch (err) {
    log.error(err, 'send-websocket-message-failed', {});
  }
};

module.exports = {
  approveListingNotification,
  enrollUserTCM,
  deEnrollUserTCM,
  cancelSubscription,
  backgroundCheckRejectedNotification,
  backgroundCheckApprovedNotification,
  addUnreadMessageCount,
  sendQuizFailedEmail,
  closeListingNotification,
  sendNewJobInAreaEmail,
  // sendNewCaregiverInAreaEmail,
  sendWebsocketMessage,
};
