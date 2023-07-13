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
  const activeSubscriptionTypes = ['active', 'trialing'];
  var Readable = require('stream').Readable;
  const {
    closeListing,
    updateListingApproveListing,
    updateUserListingApproved,
    enrollUserTCM,
    deEnrollUserTCM,
    cancelSubscription,
    backgroundCheckApprovedNotification,
    backgroundCheckRejectedNotification,
    addUnreadMessageCount,
    sendQuizFailedEmail,
    approveListingNotification,
    closeListingNotification,
    createBookingPayment,
    createCaregiverPayout,
  } = require('./queryEvents.helpers');
  const { GetObjectCommand, S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

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
    stateFile = 'state-files/last-sequence-id.state';
  } else if (isTest) {
    stateFile = 'state-files/last-sequence-id-test.state';
  } else if (isProd) {
    stateFile = 'state-files/last-sequence-id-prod.state';
  }

  const client = new S3Client({ region: 'us-west-2' });
  const readCommand = new GetObjectCommand({
    Bucket: 'carevine',
    Key: stateFile,
  });

  const queryEvents = args => {
    var filter = {
      eventTypes: [
        'user/updated, listing/updated, user/deleted',
        'user/created',
        'message/created',
        'transaction/transitioned',
      ],
    };
    return integrationSdk.events
      .query({ ...args, ...filter })
      .catch(e => log.error(e, 'Error querying events'));
  };

  const saveLastEventSequenceId = async sequenceId => {
    const buf = Buffer.from(JSON.stringify(sequenceId));

    // Save state to local file
    const command = new PutObjectCommand({
      Bucket: 'carevine',
      Key: stateFile,
      Body: buf,
    });

    try {
      const response = await client.send(command);
    } catch (err) {
      log.error(err);
    }
  };

  const loadLastEventSequenceId = async () => {
    // Load state from local file, if any
    try {
      const response = await client.send(readCommand);
      // The Body object also has 'transformToByteArray' and 'transformToWebStream' methods.
      const data = await response.Body.transformToString();
      return parseInt(data, 10);
    } catch (err) {
      console.log(err);
      log.error(err);
    }
  };

  const handleEvent = event => {
    const eventType = event.attributes.eventType;

    if (eventType === 'listing/updated') {
      const prevListingState = event.attributes.previousValues.attributes.state;
      const newListingState = event.attributes.resource.attributes?.state;
      const listingId = event.attributes.resource.id.uuid;

      // Approve listing if they meet requirements when listing is published
      if (
        prevListingState &&
        prevListingState === 'draft' &&
        newListingState === 'pendingApproval'
      ) {
        updateListingApproveListing(event);
      }

      if (prevListingState && prevListingState !== 'published' && newListingState === 'published') {
        const userId = event.attributes.resource.relationships.author.data.id.uuid;
        approveListingNotification(userId, listingId);
      }

      if (prevListingState && prevListingState === 'published' && newListingState === 'closed') {
        const userId = event.attributes.resource.relationships.author.data.id.uuid;
        closeListingNotification(userId);
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
      const backgroundCheckSubscription = metadata?.backgroundCheckSubscription;
      const prevBackgroundCheckSubscription =
        previousValuesProfile?.metadata?.backgroundCheckSubscription;

      const openListing =
        metadata?.userType === CAREGIVER
          ? activeSubscriptionTypes.includes(backgroundCheckSubscription?.status) &&
            emailVerified &&
            ((prevBackgroundCheckSubscription?.status &&
              !activeSubscriptionTypes.includes(prevBackgroundCheckSubscription?.status)) ||
              (prevEmailVerified !== undefined && !prevEmailVerified))
          : prevEmailVerified !== undefined && !prevEmailVerified && emailVerified;

      // If user meets requirements to open listing and didn't previously, approve listing
      if (openListing) {
        console.log(openListing);
        updateUserListingApproved(event);
      }

      const tcmEnrolled = privateData?.tcmEnrolled;

      if (
        backgroundCheckApprovedStatus === BACKGROUND_CHECK_APPROVED &&
        !isDev &&
        !tcmEnrolled &&
        backgroundCheckSubscription?.type === 'vine' &&
        activeSubscriptionTypes.includes(backgroundCheckSubscription?.status)
      ) {
        const userAccessCode = privateData?.authenticateUserAccessCode;

        enrollUserTCM(event, userAccessCode);
      }

      if (
        tcmEnrolled &&
        !isDev &&
        (backgroundCheckSubscription?.type !== 'vine' ||
          !activeSubscriptionTypes.includes(backgroundCheckSubscription?.status))
      ) {
        const userAccessCode = privateData?.authenticateUserAccessCode;

        deEnrollUserTCM(event, userAccessCode);
      }
      const prevBackgroundCheckApprovedStatus =
        previousValuesProfile?.metadata?.backgroundCheckApproved?.status;
      const previousQuizAttempts = previousValuesProfile?.privateData?.identityProofQuizAttempts;
      const identityProofQuizAttempts = privateData?.identityProofQuizAttempts;
      const previousBackgroundCheckRejected =
        prevBackgroundCheckApprovedStatus &&
        prevBackgroundCheckApprovedStatus === BACKGROUND_CHECK_REJECTED;
      const backgroundCheckRejected = backgroundCheckApprovedStatus === BACKGROUND_CHECK_REJECTED;

      // If failed background check, set subscription to cancel at end of period
      if (
        ((identityProofQuizAttempts >= 3 && previousQuizAttempts < 3) ||
          (backgroundCheckRejected && !previousBackgroundCheckRejected)) &&
        activeSubscriptionTypes.includes(backgroundCheckSubscription?.status)
      ) {
        cancelSubscription(backgroundCheckSubscription);

        if (identityProofQuizAttempts >= 3) {
          const userId = event.attributes.resource?.id?.uuid;
          sendQuizFailedEmail(userId);
        }
      }

      const backgroundCheckSubscriptionSchedule = privateData?.backgroundCheckSubscriptionSchedule;

      // Close user listing if background check subscription is cancelled and they don't have a subscription schedule
      if (
        !activeSubscriptionTypes.includes(backgroundCheckSubscription?.status) &&
        activeSubscriptionTypes.includes(prevBackgroundCheckSubscription?.status) &&
        !backgroundCheckSubscriptionSchedule
      ) {
        const userId = event?.attributes?.resource?.id?.uuid;

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

    if (eventType === 'message/created') {
      const message = event?.attributes?.resource;
      const senderId = message?.relationships?.sender?.data?.id?.uuid;
      const transactionId = message?.relationships?.transaction?.data?.id?.uuid;

      addUnreadMessageCount(transactionId, senderId);
    }

    if (eventType === 'user/deleted') {
      const previousValues = event.attributes.previousValues;
      const tcmEnrolled = previousValues.attributes.profile.privateData?.tcmEnrolled;
      const userAccessCode =
        previousValues.attributes.profile.privateData?.authenticateUserAccessCode;

      if (tcmEnrolled && userAccessCode && !isDev) {
        deEnrollUserTCM(event, userAccessCode);
      }
    }

    if (eventType === 'transaction/transitioned') {
      const transaction = event.attributes.resource;

      if (lastTransition === 'transition/charge') {
        createBookingPayment(transaction);
      }

      // If transition is dispute-resolved we need to first check if the dispute was resolved in favor of the caregiver
      // If it was, we need to pay the caregiver the full amount,
      // otherwise we need to use a script to refund the client X amount and then update the transaction by removing any refunded line items
      // Line items are used to calculate caregiver payout
      if (
        lastTransition === 'transition/pay-caregiver' ||
        lastTransition === 'transition/resolve-dispute' ||
        lastTransition === 'transition/cancel-pay-caregiver'
      ) {
        createCaregiverPayout(transaction);
      }
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
  loadLastEventSequenceId().then(lastSequenceId => {
    pollLoop(lastSequenceId);
  });
};
