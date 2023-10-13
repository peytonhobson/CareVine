const { integrationSdk, handleError, apiBaseUrl } = require('../api-util/sdk');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const moment = require('moment');
const { addTimeToStartOfDay } = require('../bookingHelpers');

const NOTIFICATION_TYPE_BOOKING_MODIFIED = 'bookingModified';
const ISO_OFFSET_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSZ';
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const findNextWeekStartTime = bookingSchedule => {
  const now = moment();

  const nextWeekStart = now
    .clone()
    .add(1, 'week')
    .startOf('week');

  const nextWeekStartDay = WEEKDAYS.indexOf(bookingSchedule[0].dayOfWeek);
  const nextWeekStartDate = nextWeekStart.clone().weekday(nextWeekStartDay);
  const nextWeekStartTime = addTimeToStartOfDay(nextWeekStartDate, bookingSchedule[0].startTime);

  return nextWeekStartTime;
};

const sortExceptionsByDate = exceptions =>
  exceptions.sort((a, b) => moment(a.date).isBefore(b.date));

const sendEmail = async params => {
  await axios.post(
    `${apiBaseUrl()}/api/sendgrid-template-email`,
    {
      ...params,
    },
    {
      headers: {
        'Content-Type': 'application/transit+json',
      },
    }
  );
};

module.exports = async (req, res) => {
  const { txId, modification, previousMetadata, isRequest } = req.body;

  try {
    const transaction = (
      await integrationSdk.transactions.show({ id: txId, include: ['customer', 'provider'] })
    ).data.data;

    const customerId = transaction.relationships.customer.data.id;
    const providerId = transaction.relationships.provider.data.id;

    const customer = (await integrationSdk.users.show({ id: customerId })).data.data;
    const provider = (await integrationSdk.users.show({ id: providerId })).data.data;

    const { bookingNumber } = transaction.attributes.metadata;

    const customerDisplayName = customer.attributes.profile.displayName;

    let expiration;
    const modificationType = Object.keys(modification)[0];
    switch (modificationType) {
      case 'bookingSchedule':
        expiration = findNextWeekStartTime(modification.bookingSchedule);
        break;
      case 'endDate':
        expiration = moment(modification.endDate).startOf('day');
        break;
      case 'exceptions':
        const firstExceptionDate = sortExceptionsByDate(modification.exceptions)[0].date;
        expiration = moment(firstExceptionDate).startOf('day');
        break;
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
    const replacedNotifications = oldNotifications.filter(
      n =>
        !(
          n.type === NOTIFICATION_TYPE_BOOKING_MODIFIED &&
          n.metadata.txId === txId &&
          Object.keys(n.metadata.modification)[0] === Object.keys(modification)[0]
        )
    );
    const newNotifications = [newNotification, ...replacedNotifications];

    await integrationSdk.users.updateProfile({
      id: userId,
      privateData: {
        notifications: newNotifications,
      },
    });

    await sendEmail({
      receiverId: userId,
      templateData: {
        customerDisplayName,
        bookingNumber,
        isRequest,
        marketplaceUrl: process.env.REACT_APP_CANONICAL_ROOT_URL,
        notificationId,
      },
      templateName: 'booking-modified',
    });

    if (isRequest) {
      await integrationSdk.transactions.updateMetadata({
        id: txId,
        metadata: {
          awaitingModificationApproval: true,
        },
      });
    }

    res.status(200).json({});
  } catch (e) {
    handleError(res, e);
  }
};
