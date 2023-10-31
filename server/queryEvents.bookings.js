const axios = require('axios');
const log = require('./log');
const rootUrl = process.env.REACT_APP_CANONICAL_ROOT_URL;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sgMail = require('@sendgrid/mail');
const moment = require('moment');
const { integrationSdk } = require('./api-util/sdk');
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const {
  constructBookingMetadataRecurring,
  findNextWeekStartTime,
  updateBookedDays,
  updateBookingLedger,
} = require('./bookingHelpers');
// Time
const ISO_OFFSET_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSZ';
const BOOKING_FEE_PERCENTAGE = 0.02;

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

    await stripe.paymentIntents.confirm(paymentIntentId, { payment_method: paymentMethodId });

    await integrationSdk.transactions.updateMetadata({
      id: txId,
      metadata: {
        paymentIntentId,
        chargedLineItems: [{ paymentIntentId, lineItems }],
      },
    });
  } catch (e) {
    try {
      await integrationSdk.transactions.transition({
        id: txId,
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
      const newBookedDays = listingBookedDays.filter(b => b.txId !== txId);

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

    log.error(e?.data?.errors || e, 'create-booking-payment-failed', {});
  }
};

// TODO: Double check this isnt getting called twice when cancelling delivered booking
const createCaregiverPayout = async transaction => {
  const { lineItems, paymentIntentId, stripeAccountId } = transaction.attributes.metadata;

  const amount = lineItems?.reduce((acc, item) => acc + Number(item.amount), 0) * 100;

  if (!amount || !paymentIntentId) return;

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

  console.log('additionalTime', additionalTime);

  const endTime = moment
    .parseZone(sortedLineItems[sortedLineItems.length - 1].date)
    .add(additionalTime, 'hours');

  console.log('endTime', endTime);

  return endTime;
};

const updateBookingEnd = async transaction => {
  const txId = transaction.id.uuid;
  const { lineItems, dontUpdateBookingEnd } = transaction.attributes.metadata;

  const bookingEnd = findEndTimeFromLineItems(lineItems).format(ISO_OFFSET_FORMAT);

  const bookingStart = moment(bookingEnd)
    .subtract(5, 'minutes')
    .format(ISO_OFFSET_FORMAT);

  const bookingTimesMaybe = dontUpdateBookingEnd ? {} : { bookingStart, bookingEnd };

  try {
    await integrationSdk.transactions.transition({
      id: txId,
      transition: 'transition/start',
      params: {
        ...bookingTimesMaybe,
        metadata: {
          flags: {
            sentPaymentReminder: false,
            sentBookingReminder: false,
          },
        },
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

const updateNextWeek = async transaction => {
  const txId = transaction.id.uuid;
  const {
    bookingSchedule: oldBookingSchedule,
    bookingRate,
    endDate,
    paymentMethodType,
    exceptions,
    chargedLineItems = [],
    lineItems,
    bookingScheduleChange,
  } = transaction.attributes.metadata;

  const lastTransition = transaction.attributes.lastTransition;

  if (lastTransition !== 'transition/complete') return;

  let appliedDateWithinWeek = false;
  if (bookingScheduleChange) {
    const nextWeekStart = moment()
      .add(1, 'weeks')
      .startOf('week');
    const nextWeekEnd = moment(nextWeekStart)
      .add(1, 'weeks')
      .endOf('week');
    appliedDateWithinWeek = moment(bookingScheduleChange?.appliedDate).isBetween(
      nextWeekStart,
      nextWeekEnd,
      'day',
      []
    );
  }

  const bookingSchedule = appliedDateWithinWeek
    ? bookingScheduleChange?.bookingSchedule
    : oldBookingSchedule;

  const nextWeekStartTime = findNextWeekStartTime(lineItems, bookingSchedule, exceptions)?.format(
    ISO_OFFSET_FORMAT
  );

  const bookingEnd = moment(nextWeekStartTime)
    .add(5, 'minutes')
    .format(ISO_OFFSET_FORMAT);

  const newMetadata = constructBookingMetadataRecurring(
    bookingSchedule,
    moment(nextWeekStartTime)
      .startOf('week')
      .format(ISO_OFFSET_FORMAT),
    endDate,
    bookingRate,
    paymentMethodType,
    exceptions
  );

  const newLedger = updateBookingLedger(transaction);

  // Update bookingStart to be next week start time
  try {
    if (!nextWeekStartTime) {
      throw new Error('No next week start time found');
    }

    console.log('nextWeekStartTime', nextWeekStartTime);

    const bookingStart = moment()
      .add(5 - (moment().minute() % 5), 'minutes')
      .set({ second: 0, millisecond: 0 })
      .format(ISO_OFFSET_FORMAT);
    const newBookingEnd = moment(bookingStart)
      .add(5, 'minutes')
      .format(ISO_OFFSET_FORMAT);

    await integrationSdk.transactions.transition({
      id: txId,
      transition: 'transition/update-next-week-start',
      params: {
        bookingStart,
        bookingEnd: newBookingEnd,
        metadata: {
          ...newMetadata,
          ledger: newLedger,
          chargedLineItems: chargedLineItems.filter(
            chargedItem =>
              !chargedItem?.lineItems.some(c =>
                lineItems.some(l => moment(l.date).isSame(c.date, 'day'))
              )
          ),
          bookingScheduleChange: appliedDateWithinWeek ? null : bookingScheduleChange,
        },
      },
    });

    if (appliedDateWithinWeek) {
      await updateBookedDays({
        txId,
        bookingSchedule,
      });
    }
  } catch (e) {
    log.error(e, 'update-next-week-start-failed', { errors: e?.data?.errors });
  }
};

const endRecurring = async transaction => {
  const txId = transaction.id.uuid;

  try {
    // Update metadata for refunding if any
    const refundMetadata = (
      await axios.post(
        `${apiBaseUrl()}/api/refund-booking`,
        {
          txId,
        },
        {
          headers: {
            'Content-Type': 'application/transit+json',
          },
        }
      )
    )?.data?.metadata;

    await integrationSdk.transactions.transition({
      id: txId,
      transition: 'transition/delivered-cancel',
      params: {
        metadata: {
          ...refundMetadata,
          endDate: moment()
            .startOf('day')
            .format(ISO_OFFSET_FORMAT),
        },
      },
    });
  } catch (e) {
    log.error(e?.data?.errors, 'end-recurring-failed', {});
    console.log(e?.data?.errors?.[0].source);
  }
};

module.exports = {
  createBookingPayment,
  createCaregiverPayout,
  updateBookingEnd,
  updateNextWeek,
  makeReviewable,
  endRecurring,
};
