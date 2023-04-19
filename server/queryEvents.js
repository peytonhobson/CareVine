module.exports = queryEvents = () => {
  const fs = require('fs');
  const flexIntegrationSdk = require('sharetribe-flex-integration-sdk');
  const log = require('./log');
  const isDev = process.env.REACT_APP_ENV === 'development';
  const CAREGIVER = 'caregiver';
  const BACKGROUND_CHECK_APPROVED = 'approved';
  const BACKGROUND_CHECK_REJECTED = 'rejected';
  const isTest = process.env.NODE_ENV === 'production' && isDev;
  const isProd = process.env.NODE_ENV === 'production' && !isDev;
  const isLocal = process.env.NODE_ENV === 'development' && isDev;
  const {
    closeListing,
    updateListingApproveListing,
    updateUserListingApproved,
    enrollUserTCM,
    deEnrollUserTCM,
    cancelSubscription,
    backgroundCheckApprovedNotification,
    deleteUserChannels,
    backgroundCheckRejectedNotification,
    addUnreadMessageCount,
  } = require('./queryEvents.helpers');

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
  let stateFile = null;

  if (isLocal) {
    stateFile = './server/last-sequence-id.state';
  } else if (isTest) {
    stateFile = './server/last-sequence-id-test.state';
  } else if (isProd) {
    stateFile = './server/last-sequence-id-prod.state';
  }

  const queryEvents = args => {
    var filter = {
      eventTypes: [
        'user/updated, listing/updated, user/deleted',
        'user/created',
        'message/created',
      ],
    };
    return integrationSdk.events
      .query({ ...args, ...filter })
      .catch(e => log.error(e, 'Error querying events'));
  };

  const saveLastEventSequenceId = sequenceId => {
    // Save state to local file
    try {
      fs.writeFileSync(stateFile, sequenceId.toString());
    } catch (err) {
      log.error(err);
      throw err;
    }
  };

  const loadLastEventSequenceId = () => {
    // Load state from local file, if any
    try {
      const data = fs.readFileSync(stateFile);
      return parseInt(data, 10);
    } catch (err) {
      log.error(err);
      return null;
    }
  };

  const handleEvent = event => {
    const eventType = event.attributes.eventType;

    if (eventType === 'listing/updated') {
      const prevListingState = event?.attributes?.previousValues?.attributes?.state;
      const newListingState = event?.attributes?.resource?.attributes?.state;

      // Approve listing if they meet requirements when listing is published
      if (prevListingState === 'draft' && newListingState === 'pendingApproval') {
        console.log('approve listing listing update');
        updateListingApproveListing(event);
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

      const openListing =
        metadata?.userType === CAREGIVER
          ? backgroundCheckSubscription?.status === 'active' &&
            emailVerified &&
            ((prevBackgroundCheckSubscription?.status &&
              prevBackgroundCheckSubscription?.status !== 'active') ||
              (prevEmailVerified !== undefined && !prevEmailVerified))
          : prevEmailVerified !== undefined && !prevEmailVerified && emailVerified;

      // If user meets requirements to open listing and didn't previously, approve listing
      if (openListing) {
        console.log('approve listing 2');
        updateUserListingApproved(event);
      }

      const tcmEnrolled = privateData?.tcmEnrolled;

      if (
        backgroundCheckApprovedStatus === BACKGROUND_CHECK_APPROVED &&
        !isDev &&
        !tcmEnrolled &&
        backgroundCheckSubscription.type === 'vine' &&
        backgroundCheckSubscription.status === 'active'
      ) {
        const userAccessCode = privateData.authenticateUserAccessCode;

        console.log('enroll tcm');
        enrollUserTCM(event, userAccessCode);
      }

      if (
        !isDev &&
        tcmEnrolled &&
        (backgroundCheckSubscription.type !== 'vine' ||
          backgroundCheckSubscription.status !== 'active')
      ) {
        const userAccessCode = privateData?.authenticateUserAccessCode;

        console.log('deenroll tcm');
        deEnrollUserTCM(event, userAccessCode);
      }
      const prevBackgroundCheckApprovedStatus =
        previousValuesProfile?.metadata?.backgroundCheckApproved?.status;
      const previousQuizAttempts = previousValuesProfile?.privateData?.identityProofQuizAttempts;
      const identityProofQuizAttempts = privateData?.identityProofQuizAttempts;
      const previousBackgroundCheckRejected =
        prevBackgroundCheckApprovedStatus === BACKGROUND_CHECK_REJECTED;
      const backgroundCheckRejected = backgroundCheckApprovedStatus === BACKGROUND_CHECK_REJECTED;

      // If failed background check, set subscription to cancel at end of period
      if (
        ((identityProofQuizAttempts >= 3 && previousQuizAttempts < 3) ||
          (backgroundCheckRejected && !previousBackgroundCheckRejected)) &&
        backgroundCheckSubscription?.status === 'active'
      ) {
        console.log('cancel subscription');
        cancelSubscription(backgroundCheckSubscription);
      }

      const backgroundCheckSubscriptionSchedule = privateData?.backgroundCheckSubscriptionSchedule;

      // Close user listing if background check subscription is cancelled and they don't have a subscription schedule
      if (
        backgroundCheckSubscription?.status !== 'active' &&
        previousBCSubscription?.status === 'active' &&
        !backgroundCheckSubscriptionSchedule
      ) {
        const userId = event?.attributes?.resource?.id?.uuid;

        console.log('close listing');
        closeListing(userId);
      }

      if (
        backgroundCheckApprovedStatus === BACKGROUND_CHECK_APPROVED &&
        prevBackgroundCheckApprovedStatus &&
        prevBackgroundCheckApprovedStatus !== BACKGROUND_CHECK_APPROVED
      ) {
        const userId = event?.attributes?.resource?.id?.uuid;

        backgroundCheckApprovedNotification(userId);
      }

      if (
        backgroundCheckApprovedStatus === BACKGROUND_CHECK_REJECTED &&
        prevBackgroundCheckApprovedStatus &&
        prevBackgroundCheckApprovedStatus !== BACKGROUND_CHECK_REJECTED
      ) {
        const userId = event?.attributes?.resource?.id?.uuid;
        backgroundCheckRejectedNotification(userId);
      }
    }

    // If user is deleted, delete their channels
    if (eventType === 'user/deleted') {
      const previousValues = event?.attributes?.previousValues;
      const userId = previousValues?.id?.uuid;

      console.log('delete user channels');
      deleteUserChannels(userId);
    }

    if (eventType === 'message/created') {
      const message = event?.attributes?.resource;
      const senderId = message?.relationships?.sender?.data?.id?.uuid;
      const transactionId = message?.relationships?.transaction?.data?.id?.uuid;

      addUnreadMessageCount(transactionId, senderId);
    }

    saveLastEventSequenceId(event.attributes.sequenceId);
  };

  const pollLoop = sequenceId => {
    var params = sequenceId ? { startAfterSequenceId: sequenceId } : { createdAtStart: startTime };
    queryEvents(params).then(res => {
      const events = res?.data?.data;
      const fullPage = events?.length === res?.data?.meta?.perPage;
      const delay = fullPage ? pollWait : pollIdleWait;
      const lastEvent = events?.length ? events[events?.length - 1] : null;
      const lastSequenceId = lastEvent ? lastEvent.attributes?.sequenceId : sequenceId;

      events?.forEach(e => {
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
