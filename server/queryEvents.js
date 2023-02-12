module.exports = queryEvents = () => {
  const fs = require('fs');
  const flexIntegrationSdk = require('sharetribe-flex-integration-sdk');
  const axios = require('axios');
  const SB_API_TOKEN = process.env.SENDBIRD_API_TOKEN;
  const appId = process.env.REACT_APP_SENDBIRD_APP_ID;
  const log = require('./log');
  const isDev = process.env.REACT_APP_ENV === 'development';
  const rootURL = process.env.REACT_APP_CANONICAL_ROOT_URL;

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
  const pollIdleWait = 10000; // 1 minute
  // Polling interval (in ms) when a full page of events is received and there may be more
  const pollWait = 1000; // 1s

  // File to keep state across restarts. Stores the last seen event sequence ID,
  // which allows continuing polling from the correct place
  const stateFile = 'server/last-sequence-id.state';

  const queryEvents = args => {
    var filter = { eventTypes: 'user/updated, listing/updated, user/deleted' };
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
      const userId = event.attributes.resource.relationships.author.data.id.uuid;

      const prevListingState =
        event.attributes.previousValues &&
        event.attributes.previousValues.attributes &&
        event.attributes.previousValues.attributes.state;
      const newListingState = event.attributes.resource.attributes.state;

      if (prevListingState === 'draft' && newListingState === 'pendingApproval') {
        integrationSdk.users
          .show({
            id: userId,
          })
          .then(res => {
            const user = res.data.data;
            if (user.attributes.emailVerified) {
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
      const previousValues = event.attributes.previousValues;
      const currentAttributes = event.attributes.resource.attributes;
      const metadata =
        currentAttributes && currentAttributes.profile && currentAttributes.profile.metadata;
      const privateData =
        currentAttributes && currentAttributes.profile && currentAttributes.profile.privateData;
      const previousValuesProfile =
        previousValues && previousValues.attributes && previousValues.attributes.profile;

      const prevEmailVerified =
        previousValues.attributes && previousValues.attributes.emailVerified;
      const emailVerified = event.attributes.resource.attributes.emailVerified;

      // Maybe rewrite as (!!!undefined)
      if (prevEmailVerified !== undefined && !prevEmailVerified && emailVerified) {
        const userId = event.attributes.resource.id.uuid;

        let userListingId = null;

        integrationSdk.listings
          .query({
            authorId: userId,
          })
          .then(res => {
            userListingId = res.data.data[0] && res.data.data.id && res.data.data.id.uuid;
            const listingState = res.data.data[0].attributes.state;

            if (listingState === 'pendingApproval') {
              integrationSdk.listings.approve({
                id: userListingId,
              });
            }
          })
          .catch(err => {
            log.error(err.data);
          });
      }

      const backgroundCheckApprovedStatus =
        metadata && metadata.backgroundCheckApproved && metadata.backgroundCheckApproved.status;
      const previousBCSubscription =
        previousValuesProfile &&
        previousValuesProfile.metadata &&
        previousValuesProfile.metadata.backgroundCheckSubscription;
      const backgroundCheckSubscription = metadata && metadata.backgroundCheckSubscription;
      const tcmEnrolled = privateData && privateData.tcmEnrolled;
      const identityProofQuizAttempts = privateData && privateData.identityProofQuizAttempts;
      const backgroundCheckRejected = privateData && privateData.backgroundCheckRejected;

      if (
        backgroundCheckApprovedStatus &&
        !isDev &&
        !tcmEnrolled &&
        backgroundCheckSubscription.type === 'vine' &&
        backgroundCheckSubscription.status === 'active'
      ) {
        const userAccessCode = privateData.authenticateUserAccessCode;

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
            const userId = event.attributes.resource.id.uuid;
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
        const userAccessCode = privateData.authenticateUserAccessCode;

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

      const previousQuizAttempts =
        previousValuesProfile &&
        previousValuesProfile.privateData &&
        previousValuesProfile.privateData.identityProofQuizAttempts;
      const previousBackgroundCheckRejected =
        previousValuesProfile &&
        previousValuesProfile.privateData &&
        previousValuesProfile.privateData.backgroundCheckRejected;

      // If failed background check, set subscription to cancel at end of period
      if (
        ((identityProofQuizAttempts >= 3 && previousQuizAttempts < 3) ||
          (backgroundCheckRejected && !previousBackgroundCheckRejected)) &&
        backgroundCheckSubscription &&
        backgroundCheckSubscription.status === 'active'
      ) {
        axios
          .post(
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
          )
          .catch(e => log.error(e));
      }

      // Close user listing if background check subscription is cancelled
      if (
        backgroundCheckSubscription &&
        backgroundCheckSubscription.status !== 'active' &&
        previousBCSubscription &&
        previousBCSubscription.status === 'active'
      ) {
        const userId = event.attributes.resource.id.uuid;

        integrationSdk.listings
          .query({ authorId: userId })
          .then(res => {
            const listing = res.data.data[0];
            if (listing.state === 'published') {
              integrationSdk.listings
                .close(
                  {
                    id: listing.id.uuid,
                  },
                  {
                    expand: true,
                  }
                )
                .catch(e => log.error(e.data.errors));
            }
          })
          .catch(e => log.error(e.data.errors));
      }
    }

    if (eventType === 'user/deleted') {
      const previousValues = event.attributes.previousValues;
      const userId = previousValues && previousValues.id && previousValues.id.uuid;

      axios
        .get(`https://api-${appId}.sendbird.com/v3/users/${userId}/my_group_channels`, {
          headers: {
            'Content-Type': 'application/json; charset=utf8',
            'Api-Token': SB_API_TOKEN,
          },
        })
        .then(apiResponse => {
          const channels = apiResponse.data.channels;

          channels.forEach(channel => {
            axios
              .delete(
                `https://api-${appId}.sendbird.com/v3/group_channels/${channel.channel_url}`,
                {
                  headers: {
                    'Content-Type': 'application/json; charset=utf8',
                    'Api-Token': SB_API_TOKEN,
                  },
                }
              )
              .catch(e => log.error(e.data));
          });
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
