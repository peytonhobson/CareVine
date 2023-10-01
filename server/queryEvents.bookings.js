const axios = require('axios');
const log = require('./log');
const rootUrl = process.env.REACT_APP_CANONICAL_ROOT_URL;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sgMail = require('@sendgrid/mail');
const moment = require('moment');
const { integrationSdk } = require('./api-util/sdk');
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const { constructBookingMetadataRecurring, addTimeToStartOfDay } = require('./bookingHelpers');
// Time
const ISO_OFFSET_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSZ';

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

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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

    await integrationSdk.transactions.updateMetadata({
      id: txId,
      metadata: {
        chargedLineItems: [{ paymentIntentId, lineItems }],
      },
    });
  } catch (e) {
    try {
      await integrationSdk.transactions.transition({
        id: transaction.id.uuid,
        transition: 'transition/decline-payment',
        params: {},
      });

      const fullListingResponse = await integrationSdk.listings.show({ id: listingId });
      const fullListing = fullListingResponse.data.data;

      // If single booking, create new listing bookedDates by removing booking dates
      const bookedDates = fullListing.attributes.metadata.bookedDates;
      const bookingDates = lineItems.map(l => l.date);
      const newBookedDates = bookedDates.filter(b => !bookingDates.includes(b));

      // If recurring booking, create new listing bookedDays by removing booking days
      const listingBookedDays = fullListing.attributes.metadata.bookedDays;
      const newBookedDays = listingBookedDays.filter(b => b.txId !== transaction.id.uuid);

      await integrationSdk.listings.update({
        id: listingId,
        metadata: {
          bookedDates: newBookedDates,
          bookedDays: newBookedDays,
        },
      });
    } catch (e) {
      log.error(e, 'transition-decline-payment-failed', {});
    }

    log.error(e, 'create-booking-payment-failed', {});
  }
};

// TODO: Double check this isnt getting called twice when cancelling delivered booking
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
            date: moment().format(ISO_OFFSET_FORMAT),
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

const findEndTimeFromLineItems = lineItems => {
  if (!lineItems || lineItems.length === 0) return null;
  const sortedLineItems = lineItems.sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });

  const lastDay = sortedLineItems[sortedLineItems.length - 1] ?? { endTime: '12:00am' };
  const additionalTime =
    lastDay.endTime === '12:00am' ? 24 : moment(lastDay.endTime, ['h:mma']).format('HH');
  const endTime = moment
    .parseZone(sortedLineItems[sortedLineItems.length - 1].date)
    .add(additionalTime, 'hours');

  return endTime;
};

const updateBookingEnd = async transaction => {
  const txId = transaction.id.uuid;
  const { lineItems } = transaction.attributes.metadata;

  const bookingEnd = findEndTimeFromLineItems(lineItems).format(ISO_OFFSET_FORMAT);
  const bookingStart = moment(bookingEnd)
    .clone()
    .subtract(1, 'hours')
    .format(ISO_OFFSET_FORMAT);

  // TODO: Remove comments
  try {
    await integrationSdk.transactions.transition({
      id: txId,
      transition: 'transition/start',
      params: {
        // bookingStart,
        // bookingEnd,
      },
    });
  } catch (e) {
    log.error(e?.data?.errors, 'update-booking-end-failed', {});
  }
};

const findNextWeekStartTime = (lineItems, bookingSchedule, exceptions, attemptNum = 1) => {
  if (attemptNum > 4) return null;

  // Find start and end of next week
  // Unlike cron you can use lineItems here because they haven't been updated yet
  const nextWeekLineItemStart = moment.parseZone(lineItems[0].date).add(7 * attemptNum, 'days');
  const nextWeekStart = nextWeekLineItemStart.clone().startOf('week');
  const nextWeekEnd = nextWeekLineItemStart.clone().endOf('week');

  // Filter exceptions for those within next week
  const insideExceptions = Object.values(exceptions)
    .flat()
    .filter(e => moment(e.date).isBetween(nextWeekStart, nextWeekEnd, null, '[]'));

  // Create new booking schedule with exceptions
  const newBookingSchedule = WEEKDAYS.reduce((acc, day) => {
    const removeDay = insideExceptions.find(e => e.day === day && e.type === 'removeDate');
    if (removeDay) return acc;

    const addOrChangeDay = insideExceptions.find(
      e => e.day === day && (e.type === 'addDate' || e.type === 'changeDate')
    );

    if (addOrChangeDay) {
      return [
        ...acc,
        {
          dayOfWeek: day,
          startTime: addOrChangeDay.startTime,
          endTime: addOrChangeDay.endTime,
        },
      ];
    }

    const daySchedule = bookingSchedule.find(b => b.dayOfWeek === day);
    if (!daySchedule) return acc;

    return [...acc, daySchedule];
  }, []);

  if (newBookingSchedule.length === 0) {
    return findNextWeekStartTime(lineItems, bookingSchedule, exceptions, attemptNum + 1);
  }

  const firstDay = newBookingSchedule[0] || {};

  const firstTime = firstDay.startTime;
  const startTime = addTimeToStartOfDay(
    nextWeekStart
      .clone()
      .weekday(WEEKDAYS.indexOf(firstDay.dayOfWeek))
      .startOf('day'),
    firstTime
  );

  return moment(startTime);
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

    // Check if a previous transaction has already been made reviewable
    const reviews = await transactionResponse.data.data.filter(
      tx => tx.relationships.reviews.data.length > 0
    );

    // If previous transaction has already been made reviewable, do nothing
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

const updateBookingLedger = async transaction => {
  const {
    lineItems,
    paymentMethodType,
    bookingRate,
    paymentMethodId,
    paymentIntentId,
    refundAmount,
    ledger = [],
  } = transaction.attributes.metadata;

  const amount = parseFloat(
    lineItems.reduce((acc, item) => acc + parseFloat(item.amount), 0)
  ).toFixed(2);
  const bookingFee = parseInt(Math.round(amount * 0.05));
  const processingFee =
    paymentMethodType === 'Bank Account'
      ? parseFloat(Math.round(amount * 0.008)).toFixed(2)
      : parseFloat(Math.round(amount * 0.029) + 0.3).toFixed(2);

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
    lineItems: lineItems.map(item => ({
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
    })),
  };

  return [...ledger, ledgerEntry];
};

const updateNextWeek = async transaction => {
  const txId = transaction.id.uuid;
  const {
    bookingSchedule,
    bookingRate,
    endDate,
    paymentMethodType,
    exceptions,
    chargedLineItems = [],
    lineItems,
  } = transaction.attributes.metadata;

  const nextWeekStartTime = findNextWeekStartTime(lineItems, bookingSchedule, exceptions)?.format(
    ISO_OFFSET_FORMAT
  );
  const bookingEnd = moment(nextWeekStartTime)
    .clone()
    .add(1, 'hours')
    .format(ISO_OFFSET_FORMAT);

  console.log('nextWeekStartTime', nextWeekStartTime);

  // Update bookingStart to be next week start time
  try {
    if (!nextWeekStartTime) {
      throw new Error('No next week start time found');
    }

    await integrationSdk.transactions.transition({
      id: txId,
      transition: 'transition/update-next-week-start',
      params: {
        bookingStart: nextWeekStartTime,
        bookingEnd,
      },
    });
  } catch (e) {
    log.error(e?.data, 'update-next-week-start-failed', {});
  }

  const newMetadata = constructBookingMetadataRecurring(
    bookingSchedule,
    moment(nextWeekStartTime)
      .clone()
      .startOf('week')
      .format(ISO_OFFSET_FORMAT),
    endDate,
    bookingRate,
    paymentMethodType,
    exceptions
  );

  const newLedger = await updateBookingLedger(transaction);

  console.log('new', newMetadata);
  console.log('exceptions', exceptions);
  console.log('newLedger', newLedger);
  console.log('chargedLineItems', chargedLineItems);
  console.log(
    'newChargedLineItems',
    chargedLineItems.filter(
      chargedItem =>
        !chargedItem?.lineItems.some(c => lineItems.some(l => moment(l.date).isSame(c.date, 'day')))
    ) // Remove line items from past week from chargedLineItems
  );

  try {
    await integrationSdk.transactions.updateMetadata({
      id: transaction.id.uuid,
      metadata: {
        ...newMetadata,
        ledger: newLedger,
        chargedLineItems: chargedLineItems.filter(
          chargedItem =>
            !chargedItem?.lineItems.some(c =>
              lineItems.some(l => moment(l.date).isSame(c.date, 'day'))
            )
        ),
      },
    });
  } catch (e) {
    log.error(e, 'update-next-week-metadata-failed', {});
  }
};

const endRecurring = async transaction => {
  const txId = transaction.id.uuid;

  try {
    await integrationSdk.transactions.transition({
      id: txId,
      transition: 'transition/delivered-cancel',
    });
  } catch (e) {
    log.error(e?.data, 'end-recurring-failed', {});
  }
};

module.exports = {
  createBookingPayment,
  createCaregiverPayout,
  updateBookingEnd,
  updateNextWeek,
  makeReviewable,
  updateBookingLedger,
  endRecurring,
};
