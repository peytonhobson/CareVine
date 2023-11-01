const { apiBaseUrl, integrationSdk, handleError } = require('../api-util/sdk');
const { updateBookingLedger } = require('../bookingHelpers');
const moment = require('moment');
const axios = require('axios');
const log = require('../log');
const ISO_OFFSET_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSZ';

// Map of last transitions to cancel transitions
// Does not include transition/complete because that should move immediately to next week start
const cancelTransitionMap = {
  'transition/request-booking': 'transition/cancel-request',
  'transition/request-update-start': 'transition/cancel-request',
  'transition/accept': 'transition/accepted-cancel',
  'transition/accept-update-start': 'transition/accepted-cancel',
  'transition/charge': 'transition/charged-cancel',
  'transition/start': 'transition/active-cancel',
  'transition/active-update-booking-end': 'transition/active-cancel',
  'transition/update-next-week-start': 'transition/wfnw-cancel',
  'transition/wfnw-update-start': 'transition/wfnw-cancel',
};

const nonPaidTransitions = [
  'transition/request-booking',
  'transition/accept',
  'transition/accept-update-start',
  'transition/request-update-start',
];

const requestTransitions = ['transition/request-booking', 'transition/request-update-start'];

const createRefund = async params => {
  const response = await axios.post(
    `${apiBaseUrl()}/api/refund-booking`,
    {
      ...params,
    },
    {
      headers: {
        'Content-Type': 'application/transit+json',
      },
    }
  );

  return response;
};

const updateListing = async ({ listingId, transaction }) => {
  const lastTransition = transaction.attributes.lastTransition;
  const txId = transaction.id.uuid;
  const { type: bookingType, lineItems } = transaction.attributes.metadata;

  try {
    const listing = (await integrationSdk.listings.show({ id: listingId })).data.data;

    let updateListingMetadata;
    if (bookingType === 'oneTime') {
      const bookedDates = listing.attributes.metadata.bookedDates ?? [];
      const bookingDates = lineItems.map(lineItem => lineItem.date);
      const newBookedDates = bookedDates.filter(
        date => !bookingDates.some(d => moment(d).isSame(date, 'day')) && moment(date).isAfter()
      );

      updateListingMetadata = {
        bookedDates: newBookedDates,
      };
    } else {
      const bookedDays = listing.attributes.metadata.bookedDays ?? [];
      const newBookedDays = bookedDays.filter(day => day.txId !== txId);

      updateListingMetadata = {
        bookedDays: newBookedDays,
      };
    }

    if (updateListingMetadata) {
      await integrationSdk.listings.update({
        id: listingId,
        metadata: updateListingMetadata,
      });
    }
  } catch (e) {
    log.error(e, 'cancel-booking-update-listing-failed', {
      txId,
      listingId,
      lastTransition,
    });
  }
};

const transitionBooking = async ({
  txId,
  lastTransition,
  metadata = {},
  cancelingUserType,
  newBookingEnd,
}) => {
  try {
    const newBookingStart = moment(newBookingEnd)
      .subtract(5, 'minutes')
      .set({ second: 0, millisecond: 0 })
      .format(ISO_OFFSET_FORMAT);
    const utcOffset = moment(newBookingStart).utcOffset();
    const newBookingEndUtc = moment()
      .startOf('day')
      .utcOffset(utcOffset)
      .format(ISO_OFFSET_FORMAT);

    const response = await integrationSdk.transactions.transition({
      id: txId,
      transition: cancelTransitionMap[lastTransition],
      params: {
        bookingStart: newBookingStart,
        bookingEnd: newBookingEnd,
        metadata: {
          ...metadata,
          employerCancel: cancelingUserType === 'employer',
          // TODO: This can cause end date to be set as past day
          endDate: newBookingEndUtc,
        },
      },
    });

    return response;
  } catch (e) {
    // Add another five minutes to booking end if not available
    if (e?.data?.errors?.[0]?.code === 'transaction-booking-time-not-available') {
      const bookingEnd = moment(newBookingEnd)
        .add(5 - (moment(newBookingEnd).minute() % 5), 'minutes')
        .set({ second: 0, millisecond: 0 })
        .format(ISO_OFFSET_FORMAT);

      return transitionBooking({
        txId,
        lastTransition,
        metadata,
        cancelingUserType,
        newBookingEnd: bookingEnd,
      });
    } else {
      throw e;
    }
  }
};

module.exports = async (req, res) => {
  const { txId, listingId, cancelingUserType } = req.body;

  try {
    const transaction = (await integrationSdk.transactions.show({ id: txId })).data.data;

    const { paymentIntentId } = transaction.attributes.metadata;

    const lastTransition = transaction.attributes.lastTransition;

    if (!nonPaidTransitions.includes(lastTransition) && !paymentIntentId) {
      throw {
        status: 400,
        statusText: 'Bad Request',
        data: {
          errors: [
            {
              code: 'no-payment-intent',
            },
          ],
        },
      };
    }

    const refundMetadata = (await createRefund({ txId, cancelingUserType }))?.data?.metadata;
    const ledgerMaybe = !nonPaidTransitions.includes(lastTransition)
      ? { ledger: updateBookingLedger(transaction) }
      : {};

    const newBookingEnd = moment()
      .add(5 - (moment().minute() % 5), 'minutes')
      .set({ second: 0, millisecond: 0 })
      .format(ISO_OFFSET_FORMAT);

    const response = await transitionBooking({
      txId,
      lastTransition,
      metadata: {
        ...refundMetadata,
        ...ledgerMaybe,
      },
      cancelingUserType,
      newBookingEnd,
    });

    // Update listing metadata to remove cancelled booking dates/days
    if (!requestTransitions.includes(lastTransition)) {
      updateListing({ listingId, transaction });
    }

    return res.status(200).json(response.data.data);
  } catch (e) {
    handleError(res, e);
  }
};
