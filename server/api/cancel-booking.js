const { apiBaseUrl, integrationSdk } = require('../api-util/sdk');
const { addTimeToStartOfDay } = require('../bookingHelpers');
const moment = require('moment');
const axios = require('axios');
const log = require('../log');
const ISO_OFFSET_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSZ';

// Map of last transitions to cancel transitions
// Does not include transition/complete because that should move immediately to next week start
const cancelTransitionMap = {
  'transition/request-booking': 'transition/cancel-request',
  'transition/accept': 'transition/accepted-cancel',
  'transition/charge': 'transition/charged-cancel',
  'transition/start': 'transition/active-cancel',
  'transition/update-next-week-start': 'transition/wfnw-cancel',
};

const nonPaidTransitions = ['transition/request-booking', 'transition/accept'];

const activeTransitions = ['transition/start', 'transition/update-next-week-start'];

const createRefund = async params => {
  return await axios.post(
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

module.exports = async (req, res) => {
  const { txId, listingId, cancelingUserType } = req.body;

  try {
    const transaction = (await integrationSdk.transactions.show({ id: txId })).data.data;

    const { chargedLineItems = [], paymentIntentId } = transaction.attributes.metadata;

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

    // Employer has refund if there are any future charged line items
    const hasRefund = chargedLineItems.some(cl =>
      cl.lineItems.some(l => addTimeToStartOfDay(l.date, l.startTime).isBefore())
    );

    let metadata;
    if (hasRefund) {
      metadata = (await createRefund({ txId, cancelingUserType })).data.metadata;
    }

    const isActive = activeTransitions.includes(lastTransition);
    const newBookingEnd = isActive
      ? moment()
          .add(5 - (moment().minute() % 5), 'minutes')
          .set({ second: 0, millisecond: 0 })
          .format(ISO_OFFSET_FORMAT)
      : null;
    const newBookingStart = isActive
      ? moment(newBookingEnd)
          .subtract(5, 'minutes')
          .format(ISO_OFFSET_FORMAT)
      : null;

    const response = await integrationSdk.transactions.transition({
      id: txId,
      transition: cancelTransitionMap[lastTransition],
      params: {
        bookingStart: newBookingStart,
        bookingEnd: newBookingEnd,
        metadata,
      },
    });

    // Update listing metadata to remove cancelled booking dates/days
    if (lastTransition !== 'transition/request-booking') {
      updateListing({ listingId, transaction });
    }

    return res.status(200).json(response.data.data);
  } catch (e) {
    log.error(e, 'cancel-booking-failed', {});
    console.log(e?.data);
    return res.status(e.status || 500).json(e.data);
  }
};
