module.exports = queryEvents = () => {
  const fs = require('fs');
  const flexIntegrationSdk = require('sharetribe-flex-integration-sdk');
  const axios = require('axios');
  const SB_API_TOKEN = process.env.SENDBIRD_API_TOKEN;
  const appId = process.env.REACT_APP_SENDBIRD_APP_ID;
  const log = require('./log');
  const isDev = process.env.REACT_APP_ENV === 'development';
  const rootURL = process.env.REACT_APP_CANONICAL_ROOT_URL;
  const CAREGIVER = 'caregiver';

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

  // Start polloing from current time on, when there's no stored state
  const startTime = new Date();

  // Polling interval (in ms) when all events have been fetched.
  const pollIdleWait = 10000; // 10 seconds
  // Polling interval (in ms) when a full page of events is received and there may be more
  const pollWait = 1000; // 1s

  // File to keep state across restarts. Stores the last seen event sequence ID,
  // which allows continuing polling from the correct place
  const stateFile = 'server/last-sequence-id.state';

  const queryEvents = args => {
    var filter = { eventTypes: ['user/updated, listing/updated, user/deleted', 'user/created'] };
    return integrationSdk.events.query({ ...args, ...filter });
  };

  const saveLastEventSequenceId = sequenceId => {
    // Save state to local file
    try {
      fs.writeFileSync(stateFile, sequenceId.toString());
    } catch (err) {
      throw err;
    }
  };

  const loadLastEventSequenceId = () => {
    // Load state from local file, if any
    try {
      const data = fs.readFileSync(stateFile);
      return parseInt(data, 10);
    } catch (err) {
      return null;
    }
  };

  const handleEvent = event => {
    const eventType = event.attributes.eventType;

    if (eventType === 'listing/updated') {
      const userId = event?.attributes?.resource?.relationships?.author?.data?.id?.uuid;

      const prevListingState = event?.attributes?.previousValues?.attributes?.state;
      const newListingState = event?.attributes?.resource?.attributes?.state;

      if (prevListingState === 'draft' && newListingState === 'pendingApproval') {
        console.log('approve listing');
        integrationSdk.users
          .show({
            id: userId,
            include: ['stripeAccount'],
          })
          .then(res => {
            const user = res?.data?.data;
            const metadata = user?.attributes?.profile?.metadata;
            const openListing =
              metadata?.userType === CAREGIVER
                ? metadata?.backgroundCheckSubscription?.status === 'active' &&
                  user?.relationships?.stripeAccount?.data &&
                  user?.attributes?.emailVerified
                : user?.attributes?.emailVerified;
            if (openListing) {
              const listingId = event.attributes.resource.id.uuid;

              integrationSdk.listings.approve({
                id: listingId,
              });
            }
          })
          .catch(err => log.error(err));
      }
    }

    if (eventType === 'user/updated') {
      const previousValues = event?.attributes?.previousValues;
      const currentAttributes = event?.attributes?.resource?.attributes;
      const metadata = currentAttributes?.profile?.metadata;
      const privateData = currentAttributes?.profile?.privateData;
      const previousValuesProfile = previousValues?.attributes?.profile;

      const prevEmailVerified = previousValues?.attributes?.emailVerified;
      const emailVerified = event?.attributes?.resource?.attributes?.emailVerified;
      const backgroundCheckApprovedStatus = metadata?.backgroundCheckApproved?.status;
      const previousBCSubscription = previousValuesProfile?.metadata?.backgroundCheckSubscription;
      const backgroundCheckSubscription = metadata?.backgroundCheckSubscription;
      const prevBackgroundCheckSubscription =
        previousValuesProfile?.metadata?.backgroundCheckSubscription;
      const stripeAccount = event?.attributes?.resource?.relationships?.stripeAccount?.data;
      const prevStripeAccount = previousValues?.attributes?.relationships?.stripeAccount?.data;
      const openListing =
        metadata?.userType === CAREGIVER
          ? backgroundCheckSubscription?.status === 'active' &&
            stripeAccount &&
            emailVerified &&
            (!prevStripeAccount ||
              prevBackgroundCheckSubscription?.status !== 'active' ||
              (prevEmailVerified !== undefined && !prevEmailVerified))
          : prevEmailVerified !== undefined && !prevEmailVerified && emailVerified;

      // If user meets requirements to open listing, approve listing
      if (openListing) {
        const userId = event?.attributes?.resource?.id?.uuid;

        console.log('approve listing 2');
        integrationSdk.listings
          .query({
            authorId: userId,
          })
          .then(res => {
            console.log('approve listing 2 past query 1');
            const userListingId = res?.data?.data[0]?.id?.uuid;
            const listingState = res?.data?.data[0]?.attributes?.state;

            if (listingState === 'pendingApproval') {
              console.log('approve listing 2 at approve');
              integrationSdk.listings
                .approve({
                  id: userListingId,
                })
                .catch(err => log.error(err));
            }
          })
          .catch(err => {
            log.error(err.data);
          });
      }

      const tcmEnrolled = privateData?.tcmEnrolled;
      const identityProofQuizAttempts = privateData?.identityProofQuizAttempts;
      const backgroundCheckRejected = privateData?.backgroundCheckRejected;

      if (
        backgroundCheckApprovedStatus &&
        !isDev &&
        !tcmEnrolled &&
        backgroundCheckSubscription.type === 'vine' &&
        backgroundCheckSubscription.status === 'active'
      ) {
        const userAccessCode = privateData.authenticateUserAccessCode;

        console.log('enroll tcm');
        axios
          .post(
            `${apiBaseUrl()}/api/authenticate-enroll-tcm`,
            {
              userAccessCode,
            },
            {
              headers: {
                'Content-Type': 'application/transit+json',
              },
            }
          )
          .then(() => {
            const userId = event?.attributes?.resource?.id?.uuid;
            integrationSdk.users.updateProfile({
              id: userId,
              privateData: {
                tcmEnrolled: true,
              },
            });
          })
          .catch(err => log.error(err));
      }

      if (
        !isDev &&
        tcmEnrolled &&
        (backgroundCheckSubscription.type !== 'vine' ||
          backgroundCheckSubscription.status !== 'active')
      ) {
        const userAccessCode = privateData?.authenticateUserAccessCode;

        console.log('deenroll tcm');
        axios
          .post(
            `${apiBaseUrl()}/api/authenticate-deenroll-tcm`,
            {
              userAccessCode,
            },
            {
              headers: {
                'Content-Type': 'application/transit+json',
              },
            }
          )
          .then(() => {
            const userId = event.attributes.resource.id.uuid;
            integrationSdk.users.updateProfile({
              id: userId,
              privateData: {
                tcmEnrolled: false,
              },
            });
          })
          .catch(err => log.error(err));
      }

      const previousQuizAttempts = previousValuesProfile?.privateData?.identityProofQuizAttempts;
      const previousBackgroundCheckRejected =
        previousValuesProfile?.privateData?.backgroundCheckRejected;

      // If failed background check, set subscription to cancel at end of period
      if (
        ((identityProofQuizAttempts >= 3 && previousQuizAttempts < 3) ||
          (backgroundCheckRejected && !previousBackgroundCheckRejected)) &&
        backgroundCheckSubscription?.status === 'active'
      ) {
        console.log('cancel subscription');
        axios
          .post(
            `${apiBaseUrl()}/api/stripe-update-subscription`,
            {
              subscriptionId: backgroundCheckSubscription?.subscriptionId,
              params: { cancel_at_period_end: true },
            },
            {
              headers: {
                'Content-Type': 'application/transit+json',
              },
            }
          )
          .catch(e => log.error(e));
      }

      // Close user listing if background check subscription is cancelled
      if (
        backgroundCheckSubscription?.status !== 'active' &&
        previousBCSubscription?.status === 'active'
      ) {
        const userId = event?.attributes?.resource?.id?.uuid;

        console.log('close listing');
        integrationSdk.listings
          .query({ authorId: userId })
          .then(res => {
            const listing = res?.data?.data[0];
            if (listing.state === 'published') {
              integrationSdk.listings
                .close(
                  {
                    id: listing?.id?.uuid,
                  },
                  {
                    expand: true,
                  }
                )
                .catch(e => log.error(e?.data?.errors));
            }
          })
          .catch(e => log.error(e?.data?.errors));
      }
    }

    if (eventType === 'user/created') {
      // If user has userType in publicData, but not in metadata, add userType to metadata
      // This indicates the update user metadata call failed

      const currentAttributes = event?.attributes?.resource?.attributes;
      const metadata = currentAttributes?.profile?.metadata;
      const publicData = currentAttributes?.profile?.publicData;

      if (publicData?.userType && !metadata?.userType) {
        const userId = event?.attributes?.resource?.id?.uuid;

        console.log('update user metadata userType');
        integrationSdk.users
          .updateProfile({
            id: userId,
            metadata: {
              userType: publicData?.userType,
            },
          })
          .catch(err => log.error(err));
      }
    }

    if (eventType === 'user/deleted') {
      const previousValues = event?.attributes?.previousValues;
      const userId = previousValues?.id?.uuid;

      console.log('delete user channels');
      axios
        .get(`https://api-${appId}.sendbird.com/v3/users/${userId}/my_group_channels`, {
          headers: {
            'Content-Type': 'application/json; charset=utf8',
            'Api-Token': SB_API_TOKEN,
          },
        })
        .then(apiResponse => {
          const channels = apiResponse?.data?.channels;

          if (channels?.length > 0) {
            channels.forEach(channel => {
              axios.delete(
                `https://api-${appId}.sendbird.com/v3/group_channels/${channel.channel_url}`,
                {
                  headers: {
                    'Content-Type': 'application/json; charset=utf8',
                    'Api-Token': SB_API_TOKEN,
                  },
                }
              );
            });
          }
        })
        .catch(e => log.error(e.data));
    }

    saveLastEventSequenceId(event.attributes.sequenceId);
  };

  const pollLoop = sequenceId => {
    var params = sequenceId ? { startAfterSequenceId: sequenceId } : { createdAtStart: startTime };
    queryEvents(params).then(res => {
      const events = res.data.data;
      const fullPage = events.length === res.data.meta.perPage;
      const delay = fullPage ? pollWait : pollIdleWait;
      const lastEvent = events[events.length - 1];
      const lastSequenceId = lastEvent ? lastEvent.attributes.sequenceId : sequenceId;

      events.forEach(e => {
        handleEvent(e);
      });

      setTimeout(() => {
        pollLoop(lastSequenceId);
      }, delay);
    });
  };

  // Load state from local file, if any
  const lastSequenceId = loadLastEventSequenceId();

  // kick off the polling loop
  pollLoop(lastSequenceId);
};
