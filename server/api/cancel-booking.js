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

const mapLineItemsForCancellationCustomer = lineItems => {
  // Half the amount of the line item if it is within 48 hours of the start time.
  // Remove line items that are more than 48 hours away.
  // This is to create the correct amount for caregiver payout
  return lineItems
    .map(lineItem => {
      const startTime = addTimeToStartOfDay(lineItem.date, lineItem.startTime);
      const isWithin48Hours =
        moment()
          .add(2, 'days')
          .isAfter(startTime) && moment().isBefore(startTime);
      if (isWithin48Hours) {
        return {
          ...lineItem,
          amount: parseFloat(lineItem.amount / 2).toFixed(2),
          isFifty: true,
        };
      }

      return lineItem;
    })
    .filter(lineItem => {
      const startTime = addTimeToStartOfDay(lineItem.date, lineItem.startTime);
      return (
        moment()
          .add(2, 'days')
          .isAfter(startTime) && moment().isBefore(startTime)
      );
    });
};

const mapLineItemsForCancellationProvider = lineItems => {
  // Filter out all line items that occur after now.
  return lineItems.filter(lineItem => {
    const startTime = addTimeToStartOfDay(lineItem.date, lineItem.startTime);
    return moment().isAfter(startTime);
  });
};

// Determine items to refund based on time in future
// If within 48 hours, refund 50% of base
// If more than 48 hours, refund 100% of base
const mapRefundItems = (chargedLineItems, isCaregiver) => {
  return chargedLineItems.map(({ lineItems, paymentIntentId }) => {
    const refundedLineItems = lineItems
      .filter(l => {
        const startTime = addTimeToStartOfDay(l.date, l.startTime);
        return moment().isBefore(startTime);
      })
      .map(lineItem => {
        const startTime = addTimeToStartOfDay(lineItem.date, lineItem.startTime);
        const isWithin48Hours = moment()
          .add(2, 'days')
          .isAfter(startTime);

        const isFifty = isWithin48Hours && !isCaregiver;

        const base = isFifty
          ? parseFloat(lineItem.amount / 2).toFixed(2)
          : parseFloat(lineItem.amount).toFixed(2);
        const bookingFee = parseFloat(base * 0.05).toFixed(2);
        return {
          isFifty,
          base,
          bookingFee,
          amount: parseFloat(Number(base) + Number(bookingFee)).toFixed(2),
          date: moment(lineItem.date).format('MM/DD'),
        };
      });

    return {
      lineItems: refundedLineItems,
      paymentIntentId,
    };
  });
};

const stripeCreateRefund = async ({ paymentIntentId, amount, applicationFeeRefund }) => {
  return await axios.post(
    `${apiBaseUrl()}/api/stripe-create-refund`,
    {
      paymentIntentId,
      amount,
      applicationFeeRefund,
    },
    {
      headers: {
        'Content-Type': 'application/transit+json',
      },
    }
  );
};

module.exports = async (req, res) => {
  const { txId, listingId, cancelingUserType } = req.body;

  try {
    const transaction = (await integrationSdk.transactions.show({ id: txId })).data.data;

    const {
      chargedLineItems = [],
      paymentIntentId,
      type: bookingType,
      lineItems: bookingLineItems,
    } = transaction.attributes.metadata;

    const allLineItems = chargedLineItems.reduce((acc, curr) => [...acc, ...curr.lineItems], []);
    const refundItems = mapRefundItems(chargedLineItems, cancelingUserType === 'caregiver');
    const allRefundItems = refundItems.reduce((acc, curr) => [...acc, ...curr.lineItems], []);
    const totalRefundAmount = parseInt(
      allRefundItems.reduce((acc, curr) => acc + parseFloat(curr.base), 0) * 100
    );
    const totalApplicationFeeRefund = parseInt((parseFloat(totalRefundAmount) * 0.05).toFixed(2));

    console.log('allLineItems', allLineItems);
    console.log('allRefundItems', allRefundItems);

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

    let metadataToUpdate;

    console.log('refundItems', refundItems);

    if (totalRefundAmount > 0) {
      await Promise.all(
        refundItems.map(async ({ lineItems, paymentIntentId }) => {
          const refundAmount = parseInt(
            lineItems.reduce((acc, curr) => acc + parseFloat(curr.base), 0) * 100
          );
          const applicationFeeRefund = parseInt(parseFloat(refundAmount * 0.05).toFixed(2));

          console.log('refundAmount', refundAmount);
          console.log('applicationFeeRefund', applicationFeeRefund);

          await stripeCreateRefund({
            paymentIntentId,
            amount: refundAmount,
            applicationFeeRefund,
          });
        })
      );

      const newLineItems =
        cancelingUserType === 'caregiver'
          ? mapLineItemsForCancellationProvider(allLineItems)
          : mapLineItemsForCancellationCustomer(allLineItems);
      const payout = newLineItems.reduce((acc, item) => acc + parseFloat(item.amount), 0);

      // Update line items so caregiver is paid out correct amount after refund
      metadataToUpdate = {
        lineItems: newLineItems,
        refundAmount: parseFloat(totalRefundAmount / 100).toFixed(2),
        payout: parseInt(payout) === 0 ? 0 : parseFloat(payout).toFixed(2),
        refundItems: allRefundItems,
        bookingFeeRefundAmount: parseFloat(totalApplicationFeeRefund / 100).toFixed(2),
        totalRefund: parseFloat(totalRefundAmount / 100 + totalApplicationFeeRefund / 100).toFixed(
          2
        ),
      };
    } else {
      metadataToUpdate = {
        lineItems: [],
        refundAmount: 0,
        payout: 0,
        refundItems: [],
      };
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

    console.log('updateParams', {
      id: txId,
      transition: cancelTransitionMap[lastTransition],
      params: {
        bookingStart: newBookingStart,
        bookingEnd: newBookingEnd,
        metadata: metadataToUpdate,
      },
    });

    const response = await integrationSdk.transactions.transition({
      id: txId,
      transition: cancelTransitionMap[lastTransition],
      params: {
        bookingStart: newBookingStart,
        bookingEnd: newBookingEnd,
        metadata: metadataToUpdate,
      },
    });

    // Update listing metadata to remove cancelled booking dates/days
    if (lastTransition !== 'transition/request-booking') {
      let updateListingMetadata;
      let listing;

      try {
        listing = (await integrationSdk.listings.show({ id: listingId })).data.data;
      } catch (e) {
        log.error(e, 'update-remove-listing-days-failed', {
          txId,
          listingId,
          lastTransition,
          metadataToUpdate,
        });
      }

      if (bookingType === 'oneTime' && listing) {
        const bookedDates = listing.attributes.metadata.bookedDates ?? [];
        const bookingDates = bookingLineItems.map(lineItem => lineItem.date);
        const newBookedDates = bookedDates.filter(
          date => !bookingDates.some(d => moment(d).isSame(date, 'day')) && moment(date).isAfter()
        );

        console.log('bookingDates', bookingDates);
        console.log('bookedDates', bookedDates);
        console.log('newBookedDates', newBookedDates);

        updateListingMetadata = {
          bookedDates: newBookedDates,
        };
      } else if (listing) {
        const bookedDays = listing.attributes.metadata.bookedDays ?? [];
        const newBookedDays = bookedDays.filter(day => day.txId !== txId);

        console.log('newBookedDays', newBookedDays);

        updateListingMetadata = {
          bookedDays: newBookedDays,
        };
      }

      if (listing && updateListingMetadata) {
        try {
          await integrationSdk.listings.update({
            id: listingId,
            metadata: updateListingMetadata,
          });
        } catch (e) {
          log.error(e, 'update-remove-listing-days-failed', { listingId });
        }
      }
    }

    return res.status(200).json(response.data.data);
  } catch (e) {
    log.error(e, 'cancel-booking-failed', {});
    console.log(e?.data);
    return res.status(e.status || 500).json(e.data);
  }
};
