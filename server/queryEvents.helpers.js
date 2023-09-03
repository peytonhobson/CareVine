const flexIntegrationSdk = require('sharetribe-flex-integration-sdk');
const axios = require('axios');
const log = require('./log');
const rootUrl = process.env.REACT_APP_CANONICAL_ROOT_URL;
const CAREGIVER = 'caregiver';
const { v4: uuidv4 } = require('uuid');
const activeSubscriptionTypes = ['active', 'trialing'];
const AUTHENTICATE_API_KEY = process.env.AUTHENTICATE_API_KEY;
const isDev = process.env.REACT_APP_ENV === 'development';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const moment = require('moment');

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

const integrationSdk = flexIntegrationSdk.createInstance({
  // These two env vars need to be set in the `.env` file.
  clientId: process.env.FLEX_INTEGRATION_CLIENT_ID,
  clientSecret: process.env.FLEX_INTEGRATION_CLIENT_SECRET,

  // Normally you can just skip setting the base URL and just use the
  // default that the `createInstance` uses. We explicitly set it here
  // for local testing and development.
  baseUrl: process.env.FLEX_INTEGRATION_BASE_URL || 'https://flex-integ-api.sharetribe.com',
});

const approveListingNotification = async (userId, listingId) => {
  try {
    const userResponse = await integrationSdk.users.show({ id: userId });

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

  const newNotification = {
    id: uuidv4(),
    type: 'listingOpened',
    createdAt: new Date().getTime(),
    isRead: false,
    metadata: {},
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

const closeListingNotification = async userId => {
  try {
    await axios.post(
      `${apiBaseUrl()}/api/sendgrid-template-email`,
      {
        receiverId: userId,
        templateName: 'listing-closed',
        templateData: { marketplaceUrl: rootUrl },
      },
      {
        headers: {
          'Content-Type': 'application/transit+json',
        },
      }
    );
  } catch (e) {
    log.error(e, 'listing-closed-email-failed', {});
  }

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

    unreadMessageCount[recipientUserId] += 1;

    await integrationSdk.transactions.updateMetadata({
      id: txId,
      metadata: {
        unreadMessageCount,
      },
    });
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

const createBookingPayment = async transaction => {
  const {
    lineItems,
    paymentMethodId,
    bookingFee,
    processingFee,
    stripeCustomerId,
    clientEmail,
    stripeAccountId,
  } = transaction.attributes.metadata;

  const { customer, listing } = transaction.relationships;
  const txId = transaction.id.uuid;
  const userId = customer.data.id?.uuid;
  const listingId = listing.data.id?.uuid;

  const amount = parseInt(lineItems.reduce((acc, item) => acc + parseFloat(item.amount), 0) * 100);
  const formattedBookingFee = parseInt(Math.round(bookingFee * 100));
  const formattedProcessingFee = parseInt(Math.round(processingFee * 100));

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: parseInt(amount + formattedBookingFee + formattedProcessingFee),
      currency: 'usd',
      payment_method_types: ['card', 'us_bank_account'],
      transfer_data: {
        destination: stripeAccountId,
      },
      application_fee_amount: parseInt(Math.round(formattedBookingFee + formattedProcessingFee)),
      customer: stripeCustomerId,
      receipt_email: clientEmail,
      description: 'Carevine Booking',
      metadata: { userId, txId },
    });

    const paymentIntentId = paymentIntent.id;

    await integrationSdk.transactions.updateMetadata({
      id: txId,
      metadata: {
        paymentIntentId,
      },
    });

    await stripe.paymentIntents.confirm(paymentIntentId, { payment_method: paymentMethodId });
  } catch (e) {
    try {
      await integrationSdk.transactions.transition({
        id: transaction.id.uuid,
        transition: 'transition/decline-payment',
        params: {},
      });

      const fullListingResponse = await integrationSdk.listings.show({ id: listingId });
      const fullListing = fullListingResponse.data.data;
      const bookedDates = fullListing.attributes.metadata.bookedDates;
      const bookingDates = lineItems.map(l => l.date);

      const newBookedDates = bookedDates.filter(b => !bookingDates.includes(b));

      await integrationSdk.listings.update({
        id: listingId,
        metadata: {
          bookedDates: newBookedDates,
        },
      });
    } catch (e) {
      log.error(e, 'transition-decline-payment-failed', {});
    }

    log.error(e, 'create-booking-payment-failed', {});
  }
};

const createCaregiverPayout = async transaction => {
  const { lineItems, paymentIntentId, stripeAccountId } = transaction.attributes.metadata;

  const amount = lineItems?.reduce((acc, item) => acc + item.amount, 0) * 100;

  if (!amount || amount === 0 || !paymentIntentId) return;

  try {
    const providerId = transaction.relationships.provider.data.id.uuid;

    const providerResponse = await integrationSdk.users.show({
      id: providerId,
    });
    const provider = providerResponse.data.data;

    const pendingPayouts = provider.attributes.profile.privateData.pendingPayouts ?? [];

    await integrationSdk.users.updateProfile({
      id: providerId,
      privateData: {
        hasPendingPayout: true,
        pendingPayouts: [
          ...pendingPayouts,
          {
            amount,
            paymentIntentId,
            date: new Date().toISOString(),
            openDispute: false,
            txId: transaction.id.uuid,
          },
        ],
      },
    });
  } catch (e) {
    log.error(e, 'create-caregiver-payout-failed', { stripeAccountId });
  }
};

const convertTimeFrom12to24 = fullTime => {
  if (!fullTime || fullTime.length === 5) {
    return fullTime;
  }

  const [time, ampm] = fullTime.split(/(am|pm)/i);
  const [hours, minutes] = time.split(':');
  let convertedHours = parseInt(hours);

  if (ampm.toLowerCase() === 'am' && hours === '12') {
    convertedHours = 0;
  } else if (ampm.toLowerCase() === 'pm' && hours !== '12') {
    convertedHours += 12;
  }

  return `${convertedHours.toString().padStart(2, '0')}:${minutes}`;
};

const findEndTimeFromLineItems = lineItems => {
  if (!lineItems || lineItems.length === 0) return null;
  const sortedLineItems = lineItems.sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });

  const lastDay = sortedLineItems[sortedLineItems.length - 1] ?? { endTime: '12:00am' };
  const additionalTime =
    lastDay.endTime === '12:00am' ? 24 : convertTimeFrom12to24(lastDay.endTime).split(':')[0];
  const endTime = moment(sortedLineItems[sortedLineItems.length - 1].date)
    .add(additionalTime, 'hours')
    .toDate();

  return endTime;
};

const updateBookingEnd = async transaction => {
  const txId = transaction.id.uuid;
  const { lineItems } = transaction.attributes.metadata;

  const bookingEnd = findEndTimeFromLineItems(lineItems);
  const bookingStart = moment(bookingEnd)
    .subtract(1, 'hours')
    .toDate();

  try {
    await integrationSdk.transactions.transition({
      id: txId,
      transition: 'transition/start-update-times',
      params: {
        bookingStart,
        bookingEnd,
      },
    });
  } catch (e) {
    log.error(e?.data?.errors, 'update-booking-end-failed', {});
  }
};

const makeReviewable = async transaction => {
  const customerId = transaction.relationships.customer.data.id.uuid;
  const providerId = transaction.relationships.provider.data.id.uuid;
  const listingId = transaction.relationships.listing.data.id.uuid;

  try {
    const customerResponse = await integrationSdk.users.show({
      id: customerId,
    });

    const customer = customerResponse.data.data;
    const pendingReviews = customer.attributes.profile.metadata.pendingReviews ?? [];

    const transactionResponse = await integrationSdk.transactions.query({
      customerId,
      providerId,
      include: ['reviews'],
    });

    const reviews = await transactionResponse.data.data.filter(
      tx => tx.relationships.reviews.data.length > 0
    );

    if (pendingReviews.includes(listingId) || reviews.length !== 0) return;

    await integrationSdk.users.updateProfile({
      id: customerId,
      metadata: {
        pendingReviews: [...pendingReviews, listingId],
      },
    });

    const { providerName } = transaction.attributes.metadata;

    await axios.post(
      `${apiBaseUrl()}/api/sendgrid-template-email`,
      {
        receiverId: customerId,
        templateName: 'customer-can-review',
        templateData: {
          marketplaceUrl: rootUrl,
          listingId,
          providerName,
        },
      },
      {
        headers: {
          'Content-Type': 'application/transit+json',
        },
      }
    );
  } catch (e) {
    log.error(e?.data?.errors, 'make-reviewable-failed', {});
  }
};

const addTimeToStartOfDay = (day, time) => {
  const hours = moment(time, ['h:mm A']).format('HH');
  return moment(day)
    .add(hours, 'hours')
    .toDate();
};

const updateBookingLedger = async transaction => {
  const txId = transaction.id.uuid;

  const {
    lineItems,
    paymentMethodType,
    bookingRate,
    paymentMethodId,
    paymentIntentId,
    refundAmount,
  } = transaction.attributes.metadata;

  const amount = parseFloat(
    lineItems.reduce((acc, item) => acc + parseFloat(item.amount), 0)
  ).toFixed(2);
  const bookingFee = parseInt(Math.round(amount * 0.05));
  const processingFee =
    paymentMethodType === 'Bank Account'
      ? parseFloat(Math.round(amount * 0.008)).toFixed(2)
      : parseFloat(Math.round(amount * 0.029) + 0.3).toFixed(2);

  try {
    const transactionResponse = await integrationSdk.transactions.show({
      id: txId,
      include: ['booking'],
    });

    const bookingLedger = transactionResponse.data.data.attributes.metadata.ledger ?? [];
    const booking = transactionResponse.data.included.find(i => i.type === 'booking');
    const bookingEnd = booking.attributes.end;

    const ledgerEntry = {
      bookingRate,
      paymentMethodId,
      paymentMethodType,
      bookingFee,
      processingFee,
      paymentIntentId,
      totalPayment: parseFloat(Number(bookingFee) + Number(processingFee) + Number(amount)).toFixed(
        2
      ),
      payout: parseFloat(amount).toFixed(2),
      refundAmount: refundAmount ? refundAmount : null,
      start: lineItems?.[0]
        ? addTimeToStartOfDay(lineItems?.[0].date, lineItems?.[0].startTime).toISOString()
        : null,
      end: bookingEnd.toISOString(),
    };

    await integrationSdk.transactions.updateMetadata({
      id: txId,
      metadata: {
        ledger: [...bookingLedger, ledgerEntry],
      },
    });
  } catch (e) {
    log.error(e?.data?.errors, 'update-booking-ledger-failed', {});
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
  createBookingPayment,
  createCaregiverPayout,
  updateBookingEnd,
  makeReviewable,
  updateBookingLedger,
};
