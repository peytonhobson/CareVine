const { integrationSdk, handleError, apiBaseUrl } = require('../api-util/sdk');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const moment = require('moment');

const NOTIFICATION_TYPE_BOOKING_MODIFIED_RESPONSE = 'bookingModifiedResponse';
const ISO_OFFSET_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSZ';

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
  const { txId, modification, previousMetadata, isAccepted } = req.body;

  try {
    const transaction = (
      await integrationSdk.transactions.show({ id: txId, include: ['customer', 'provider'] })
    ).data.data;

    const customerId = transaction.relationships.customer.data.id;
    const providerId = transaction.relationships.provider.data.id;

    const customer = (await integrationSdk.users.show({ id: customerId })).data.data;
    const provider = (await integrationSdk.users.show({ id: providerId })).data.data;

    const { bookingNumber } = transaction.attributes.metadata;

    const providerDisplayName = provider.attributes.profile.displayName;

    const notificationId = uuidv4();
    const newNotification = {
      id: notificationId,
      type: NOTIFICATION_TYPE_BOOKING_MODIFIED_RESPONSE,
      createdAt: moment().format(ISO_OFFSET_FORMAT),
      isRead: false,
      metadata: {
        isAccepted,
        txId,
        bookingNumber,
        providerDisplayName,
        modification,
        previousMetadata,
      },
    };

    const userId = customer.id.uuid;
    const oldNotifications = customer.attributes.profile.privateData.notifications ?? [];

    const newNotifications = [newNotification, ...oldNotifications];

    await integrationSdk.users.updateProfile({
      id: userId,
      privateData: {
        notifications: newNotifications,
      },
    });

    await sendEmail({
      receiverId: userId,
      templateData: {
        providerDisplayName,
        bookingNumber,
        isAccepted,
        marketplaceUrl: process.env.REACT_APP_CANONICAL_ROOT_URL,
        notificationId,
      },
      templateName: 'booking-modification-response',
    });

    await integrationSdk.transactions.updateMetadata({
      id: txId,
      metadata: {
        awaitingModificationApproval: false,
      },
    });

    res.status(200).json({});
  } catch (e) {
    handleError(res, e);
  }
};
