module.exports = queryEvents = () => {
  const { integrationSdk } = require('./api-util/sdk');
  const log = require('./log');
  const isDev = process.env.REACT_APP_ENV === 'development';
  const BACKGROUND_CHECK_APPROVED = 'approved';
  const BACKGROUND_CHECK_REJECTED = 'rejected';
  const isTest = process.env.NODE_ENV === 'production' && isDev;
  const isProd = process.env.NODE_ENV === 'production' && !isDev;
  const isLocal = process.env.NODE_ENV === 'development' && isDev;
  const activeSubscriptionTypes = ['active', 'trialing'];
  const {
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
    updateBookingEnd,
    updateNextWeekStart,
    makeReviewable,
    updateBookingLedger,
    updateNextWeekMetadata,
    sendNewJobInAreaEmail,
    sendNewCaregiverInAreaEmail,
    sendWebsocketMessage,
  } = require('./queryEvents.helpers');
  const { GetObjectCommand, S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

  // Start polloing from current time on, when there's no stored state
  const startTime = new Date();

  // Polling interval (in ms) when all events have been fetched.
  const pollIdleWait = 3000; // 3 seconds
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
      await client.send(command);
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
      log.error(err);
    }
  };

  const handleEvent = event => {
    const eventType = event.attributes.eventType;

    if (eventType === 'listing/updated') {
      const listing = event.attributes.resource;
      const prevListingState = event.attributes.previousValues.attributes.state;
      const newListingState = listing.attributes?.state;
      const listingId = listing.id.uuid;
      const listingType = listing.attributes?.metadata?.listingType;

      const userId = listing.relationships.author.data.id.uuid;
      if (prevListingState === 'closed' && newListingState === 'published') {
        approveListingNotification(userId, listingId);
      }

      if (prevListingState === 'draft' && newListingState === 'published') {
        approveListingNotification(userId, listingId, true, event.attributes.sequenceId);
      }

      if (prevListingState === 'published' && newListingState === 'closed') {
        closeListingNotification(userId, event.attributes.sequenceId);
      }

      if (
        prevListingState === 'draft' &&
        newListingState === 'published' &&
        listingType === 'employer' &&
        isProd
      ) {
        sendNewJobInAreaEmail(listing);
      }

      if (
        prevListingState === 'draft' &&
        newListingState === 'published' &&
        listingType === 'caregiver' &&
        isProd
      ) {
        sendNewCaregiverInAreaEmail(listing);
      }
    }

    if (eventType === 'user/updated') {
      const previousValues = event?.attributes?.previousValues;
      const currentAttributes = event?.attributes?.resource?.attributes;
      const metadata = currentAttributes?.profile?.metadata;
      const privateData = currentAttributes?.profile?.privateData;
      const previousValuesProfile = previousValues?.attributes?.profile;

      const backgroundCheckApprovedStatus = metadata?.backgroundCheckApproved?.status;
      const backgroundCheckSubscription = metadata?.backgroundCheckSubscription;

      const tcmEnrolled = privateData?.tcmEnrolled;

      const previousNotifications = previousValuesProfile?.privateData?.notifications;
      const notifications = privateData?.notifications;

      if (previousNotifications && previousNotifications?.length !== notifications?.length) {
        sendWebsocketMessage(event.attributes.resource.id.uuid, 'user-updated');
      }

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
      const lastTransition = transaction.attributes.lastTransition;
      const metadata = transaction.attributes.metadata;
      const hasNextBooking = metadata.bookingSchedule && !metadata.cancelAtPeriodEnd;

      // if (lastTransition === 'transition/start' || lastTransition === 'transition/start-repeat') {
      //   updateBookingEnd(transaction);
      // }

      if (lastTransition === 'transition/charge') {
        createBookingPayment(transaction);
      }

      if (
        lastTransition === 'transition/cancel-charged-booking-provider' ||
        lastTransition === 'transition/cancel-charged-booking-customer'
      ) {
        createCaregiverPayout(transaction);
      }

      // if (
      //   lastTransition === 'transition/complete' ||
      //   lastTransition === 'transition/complete-canceled'
      // ) {
      //   makeReviewable(transaction);
      //   createCaregiverPayout(transaction);
      //   updateBookingLedger(transaction);
      // }

      // if (lastTransition === 'transition/complete' && hasNextBooking) {
      //   updateNextWeekStart(transaction);
      //   updateNextWeekMetadata(transaction);
      // }
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
