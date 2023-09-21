const axios = require('axios');
const log = require('./log');
const rootUrl = process.env.REACT_APP_CANONICAL_ROOT_URL;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sgMail = require('@sendgrid/mail');
const moment = require('moment');
const { integrationSdk } = require('./api-util/sdk');
const { WEEKDAYS } = require('../src/util/constants');

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

const weekdayMap = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
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

const findStartTimeFromLineItems = lineItems => {
  if (!lineItems || lineItems.length === 0) return null;
  const sortedLineItems = lineItems.sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });

  const firstDay = sortedLineItems[0] ?? { startTime: '12:00am' };
  const additionalTime = convertTimeFrom12to24(firstDay.startTime).split(':')[0];
  const startTime = moment(sortedLineItems[0].date)
    .add(additionalTime, 'hours')
    .toDate();

  return startTime;
};

// TODO: Double check this function
const findNextWeekStartTime = (lineItems, bookingSchedule, exceptions) => {
  // Find start and end of next week
  const lineItemsStart = moment(findStartTimeFromLineItems(lineItems));
  const nextWeekStart = nextWeekLineItemStart.startOf('week').toDate();
  const nextWeekEnd = nextWeekLineItemStart.endOf('week').toDate();

  // Filter exceptions for those within next week
  const insideExceptions = Object.keys(exceptions)
    .flat()
    .filter(e => moment(e.date).isBetween(nextWeekStart, nextWeekEnd, null, '[]'));

  // Create new booking schedule with exceptions
  const newBookingSchedule = WEEKDAYS.reduce((acc, day) => {
    const removeDay = insideExceptions.find(e => e.day === day && e.type === 'removeDate');
    if (removeDay) return acc;

    const daySchedule = bookingSchedule[day];
    if (!daySchedule) return acc;

    const addOrChangeDay = insideExceptions.find(
      e => e.day === day && (e.type === 'addDate' || e.type === 'changeDate')
    );
    if (addOrChangeDay) {
      return {
        ...acc,
        [day]: {
          startTime: addOrChangeDay.startTime,
          endTime: addOrChangeDay.endTime,
        },
      };
    }

    return {
      ...acc,
      [day]: daySchedule,
    };
  }, {});

  const firstDay = Object.keys(newBookingSchedule)[0];
  const firstTime = newBookingSchedule[firstDay].startTime;
  const startTime = addTimeToStartOfDay(nextWeekStart.weekday(firstDay), firstTime);

  return startTime;
};

// TODO: Double check this function
const updateNextWeekStart = async transaction => {
  const { lineItems, bookingSchedule, exceptions } = transaction.attributes.metadata;

  const nextWeekStartTime = findNextWeekStartTime(lineItems, bookingSchedule, exceptions);
  const bookingEnd = moment(nextWeekStartTime)
    .add(1, 'hours')
    .toDate();

  try {
    await integrationSdk.transactions.transition({
      id: txId,
      transition: 'transition/update-next-week-start',
      params: {
        bookingStart: nextWeekStartTime,
        bookingEnd,
      },
    });
  } catch (e) {
    log.error(e?.data?.errors, 'update-next-week-start-failed', {});
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
    chargedLineItems,
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
      bookingSessions: lineItems.map(item => ({
        date: item.date,
        startTime: item.startTime,
        endTime: item.endTime,
      })),
    };

    await integrationSdk.transactions.updateMetadata({
      id: txId,
      metadata: {
        ledger: [...bookingLedger, ledgerEntry],

        // Remove current line items from charged ones because they are now in ledger
        chargedLineItems: chargedLineItems.filter(
          chargedItem => !chargedItem.lineItems.find(c => lineItems.find(l => l.date === c.date))
        ),
      },
    });
  } catch (e) {
    log.error(e?.data?.errors, 'update-booking-ledger-failed', {});
  }
};

const constructBookingMetadataRecurring = (
  weekdays,
  startDate,
  endDate,
  bookingRate,
  paymentMethodType
) => {
  const filteredWeekdays = Object.keys(weekdays)?.reduce((acc, weekdayKey) => {
    const bookingDate = moment(startDate).weekday(weekdayMap[weekdayKey]);

    return bookingDate >= startDate && bookingDate <= endDate
      ? [...acc, { weekday: weekdayKey, ...weekdays[weekdayKey] }]
      : acc;
  }, []);

  const lineItems = filteredWeekdays.map(day => {
    const { weekday, startTime, endTime } = day;

    const hours = calculateTimeBetween(startTime, endTime);
    const amount = parseFloat(hours * bookingRate).toFixed(2);
    const isoDate = moment(startDate)
      .weekday(weekdayMap[weekday])
      .toISOString();

    return {
      code: 'line-item/booking',
      startTime,
      endTime,
      seats: 1,
      date: isoDate,
      shortDate: moment(isoDate).format('MM/DD'),
      hours,
      amount,
      bookingFee: parseFloat(amount * 0.05).toFixed(2),
    };
  });

  const payout = lineItems.reduce((acc, item) => acc + parseFloat(item.amount), 0);

  const bookingFee = parseFloat(payout * BOOKING_FEE_PERCENTAGE).toFixed(2);
  const processingFee = calculateProcessingFee(payout, bookingFee, paymentMethodType);

  const endOfWeek = moment(startDate)
    .weekday(6)
    .toISOString();

  return {
    lineItems,
    bookingFee,
    processingFee,
    totalPayment: parseFloat(Number(bookingFee) + Number(processingFee) + Number(payout)).toFixed(
      2
    ),
    payout: parseFloat(payout).toFixed(2),
    cancelAtPeriodEnd: endDate <= endOfWeek,
  };
};

const updateNextWeekMetadata = async transaction => {
  const {
    bookingSchedule,
    startDate,
    bookingRate,
    endDate,
    paymentMethodType,
  } = transaction.attributes.metadata;

  const newMetadata = constructBookingMetadataRecurring(
    bookingSchedule,
    startDate,
    endDate,
    bookingRate,
    paymentMethodType
  );

  try {
    await integrationSdk.transactions.updateMetadata({
      id: transaction.id.uuid,
      metadata: {
        ...newMetadata,
      },
    });
  } catch (e) {
    log.error(e, 'update-next-week-line-items-failed', {});
  }
};

module.exports = {
  createBookingPayment,
  createCaregiverPayout,
  updateBookingEnd,
  updateNextWeekStart,
  makeReviewable,
  updateBookingLedger,
};
