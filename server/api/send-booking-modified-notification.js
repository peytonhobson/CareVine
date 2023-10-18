const { integrationSdk, handleError, apiBaseUrl, getTrustedSdk } = require('../api-util/sdk');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const moment = require('moment');
const { addTimeToStartOfDay, findNextWeekStartTime } = require('../bookingHelpers');

const NOTIFICATION_TYPE_BOOKING_MODIFIED = 'bookingModified';
const ISO_OFFSET_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSZ';
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const sortExceptionsByDate = exceptions =>
  exceptions.sort((a, b) => moment(a.date).isBefore(b.date));

const findChangeAppliedDay = (chargedLineItems, weekdays, exceptions) => {
  const allChargedLineItems = chargedLineItems.map(c => c.lineItems).flat();
  const nextWeekStartTime = findNextWeekStartTime(allChargedLineItems, weekdays, exceptions);

  return nextWeekStartTime.startOf('day');
};

module.exports = async (req, res) => {
  const { txId, modification, previousMetadata, isRequest } = req.body;

  try {
    const transaction = (
      await integrationSdk.transactions.show({
        id: txId,
        include: ['customer', 'provider', 'listing'],
      })
    ).data.data;

    const customerId = transaction.relationships.customer.data.id;
    const providerId = transaction.relationships.provider.data.id;

    const customer = (await integrationSdk.users.show({ id: customerId })).data.data;
    const provider = (await integrationSdk.users.show({ id: providerId })).data.data;

    const { bookingNumber, chargedLineItems = [] } = transaction.attributes.metadata;

    const customerDisplayName = customer.attributes.profile.displayName;

    let appliedDay;
    let expiration;
    const modificationTypes = Object.keys(modification);

    if (modificationTypes.includes('bookingSchedule')) {
      expiration = appliedDay = findChangeAppliedDay(
        chargedLineItems,
        modification.bookingSchedule,
        modification.exceptions
      );

      console.log('appliedDay', appliedDay);
    } else if (modificationTypes.includes('exceptions')) {
      const firstExceptionDate = sortExceptionsByDate(modification.exceptions)[0].date;
      expiration = moment(firstExceptionDate).startOf('day');
    } else if (modificationTypes.includes('endDate')) {
      expiration = moment(modification.endDate).startOf('day');
    } else {
      expiration = moment().add(3, 'days');
    }

    const threeDaysFromNow = moment().add(3, 'days');
    expiration = expiration.isAfter(threeDaysFromNow) ? threeDaysFromNow : expiration;

    const notificationId = uuidv4();
    const newNotification = {
      id: notificationId,
      type: NOTIFICATION_TYPE_BOOKING_MODIFIED,
      createdAt: moment().format(ISO_OFFSET_FORMAT),
      isRead: false,
      metadata: {
        isRequest,
        txId,
        bookingNumber,
        customerDisplayName,
        modification,
        expiration: expiration.format(ISO_OFFSET_FORMAT),
        previousMetadata,
      },
    };

    const userId = provider.id.uuid;
    const oldNotifications = provider.attributes.profile.privateData.notifications ?? [];

    // If customer makes multiple requests, we want to replace the old one so caregiver can't accept multiple times
    // Shouldn't be an issue as we only send one request at a time, but here just in case we change that
    const replacedNotifications = oldNotifications.filter(
      n =>
        !(
          n.type === NOTIFICATION_TYPE_BOOKING_MODIFIED &&
          n.metadata.txId === txId &&
          JSON.stringify(Object.keys(n.metadata.modification)) ===
            JSON.stringify(Object.keys(modification))
        )
    );

    const trustedSdk = await getTrustedSdk(req);
    const bookingStart = moment(expiration)
      .add(5 - (moment(expiration).minute() % 5), 'minutes')
      .set({ second: 0, millisecond: 0 })
      .format(ISO_OFFSET_FORMAT);
    const bookingEnd = moment(bookingStart)
      .clone()
      .add(5, 'minutes')
      .format(ISO_OFFSET_FORMAT);
    const bookingTimesMaybe = isRequest
      ? {
          bookingStart,
          bookingEnd,
        }
      : {};

    const modifyBookingTransaction = (
      await trustedSdk.transactions.initiate({
        processAlias: 'modify-booking-process/active',
        transition: isRequest ? 'transition/modify-booking-request' : 'transition/booking-modified',
        params: {
          listingId: transaction.relationships.listing.data.id,
          ...bookingTimesMaybe,
          metadata: {
            customerDisplayName,
            bookingNumber,
            notificationId,
            bookingId: txId,
          },
        },
      })
    ).data.data;

    const modifyBookingTxId = modifyBookingTransaction.id.uuid;
    newNotification.metadata.modifyBookingTxId = modifyBookingTransaction.id.uuid;
    const newNotifications = [newNotification, ...replacedNotifications];

    await integrationSdk.users.updateProfile({
      id: userId,
      privateData: {
        notifications: newNotifications,
        modifyBookingTxId,
      },
    });

    if (isRequest) {
      await integrationSdk.transactions.updateMetadata({
        id: txId,
        metadata: {
          awaitingModification: modification,
        },
      });
    }

    res.status(200).json({});
  } catch (e) {
    handleError(res, e);
    console.log(e?.data?.errors?.[0]?.source);
  }
};
