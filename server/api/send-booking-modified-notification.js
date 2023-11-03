const { integrationSdk, handleError, getTrustedSdk } = require('../api-util/sdk');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { addTimeToStartOfDay, findNextWeekStartTime } = require('../bookingHelpers');
const { isEqual } = require('lodash');

const NOTIFICATION_TYPE_BOOKING_MODIFIED = 'bookingModified';
const ISO_OFFSET_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSZ';

const sortByDate = (a, b) => moment(a.date).diff(b.date);

const findLastLineItems = (acc, curr) => {
  const currLineItems = curr.lineItems;

  const sortedLineItems = currLineItems.sort(sortByDate);

  if (acc.length === 0) return sortedLineItems;

  const lastCurrentDate = sortedLineItems[sortedLineItems.length - 1].date;
  const lastAccDate = acc[acc.length - 1].date;

  return moment(lastCurrentDate).isAfter(lastAccDate) ? sortedLineItems : acc;
};

const findChangeAppliedDate = (chargedLineItems, weekdays, exceptions, startDate, ledger = []) => {
  if (chargedLineItems.length === 0 && ledger.length === 0) return moment(startDate);

  const combinedItems = [...chargedLineItems, ...ledger];
  const lastLineItems = combinedItems.reduce(findLastLineItems, []);
  const nextWeekStartTime = findNextWeekStartTime(lastLineItems, weekdays, exceptions);

  return nextWeekStartTime.startOf('day');
};

const findExceptionExpiration = (modification = {}, previousMetadata = {}) => {
  const allNewExceptions = Object.values(modification.exceptions).flat();
  const allOldExceptions = Object.values(previousMetadata.exceptions).flat();

  const addedExceptions = allNewExceptions.filter(e => !allOldExceptions.some(o => isEqual(e, o)));
  const removedExceptions = allOldExceptions.filter(
    o => !allNewExceptions.some(e => isEqual(e, o))
  );

  const firstException = [...addedExceptions, ...removedExceptions].sort((a, b) =>
    moment(a.date).diff(b.date)
  )?.[0];
  const firstExceptionDateTime = addTimeToStartOfDay(
    firstException?.date,
    firstException?.startTime
  );

  return firstExceptionDateTime;
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

    const {
      bookingNumber,
      chargedLineItems = [],
      startDate,
      ledger = [],
    } = transaction.attributes.metadata;

    const customerDisplayName = customer.attributes.profile.displayName;

    let appliedDate;
    let expiration;
    const modificationType = modification.type;

    if (modificationType === 'bookingSchedule') {
      expiration = appliedDate = findChangeAppliedDate(
        chargedLineItems,
        modification.bookingSchedule,
        modification.exceptions,
        startDate,
        ledger
      );
    } else if (modificationType === 'exceptions') {
      expiration = findExceptionExpiration(modification, previousMetadata);
    } else if (modificationType === 'endDate') {
      expiration = moment(modification.endDate).startOf('day');
    } else {
      expiration = moment().add(3, 'days');
    }

    const threeDaysFromNow = moment().add(3, 'days');
    expiration = moment(expiration).isAfter(threeDaysFromNow) ? threeDaysFromNow : expiration;

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
        appliedDate: appliedDate?.format(ISO_OFFSET_FORMAT),
      },
    };

    const userId = provider.id.uuid;
    const oldNotifications = provider.attributes.profile.privateData.notifications ?? [];

    // If customer makes multiple requests, we want to replace the old one so caregiver can't accept multiple times
    // Shouldn't be an issue as we only send one request at a time, but here just in case we change that
    const replacedNotifications = oldNotifications.filter(n => {
      if (!n.metadata.modification) return true;
      const oldModificationType = n.metadata.modification.type;
      const newModificationType = modification.type;

      return !(
        n.type === NOTIFICATION_TYPE_BOOKING_MODIFIED &&
        n.metadata.txId === txId &&
        oldModificationType === newModificationType
      );
    });

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
