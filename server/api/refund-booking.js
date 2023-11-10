const { apiBaseUrl, integrationSdk, handleStripeError } = require('../api-util/sdk');
const { addTimeToStartOfDay } = require('../booking-helpers');
const moment = require('moment');
const axios = require('axios');
const log = require('../log');

const BOOKING_FEE_PERCENTAGE = 0.02;

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
      return moment()
        .add(2, 'days')
        .isAfter(startTime);
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
        const bookingFee = parseFloat(base * BOOKING_FEE_PERCENTAGE).toFixed(2);
        return {
          shortDay: moment(lineItem.date).format('ddd'),
          isFifty,
          base,
          bookingFee,
          amount: parseFloat(Number(base) + Number(bookingFee)).toFixed(2),
          date: moment(lineItem.date).format('MM/DD'),
          fullDate: lineItem.date,
        };
      });

    return {
      lineItems: refundedLineItems,
      paymentIntentId,
    };
  });
};

const stripeCreateRefund = async params => {
  return await axios.post(
    `${apiBaseUrl()}/api/stripe-create-refund`,
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
  const { txId, cancelingUserType = 'employer' } = req.body;

  try {
    const transaction = (await integrationSdk.transactions.show({ id: txId })).data.data;

    const { chargedLineItems = [], lineItems } = transaction.attributes.metadata;

    const allLineItems = chargedLineItems.reduce((acc, curr) => [...acc, ...curr.lineItems], []);
    const refundItems = mapRefundItems(chargedLineItems, cancelingUserType === 'caregiver');
    const allRefundItems = refundItems.reduce((acc, curr) => [...acc, ...curr.lineItems], []);
    const totalRefundAmount = parseInt(
      allRefundItems.reduce((acc, curr) => acc + Number(curr.base), 0) * 100
    );
    const totalApplicationFeeRefund = parseInt(Number(totalRefundAmount) * BOOKING_FEE_PERCENTAGE);

    let metadataToUpdate;
    if (totalRefundAmount > 0) {
      await Promise.all(
        refundItems.map(async ({ lineItems, paymentIntentId }) => {
          const refundAmount = parseInt(
            lineItems.reduce((acc, curr) => acc + Number(curr.base), 0) * 100
          );
          const applicationFeeRefund = parseInt(refundAmount * BOOKING_FEE_PERCENTAGE);

          if (refundAmount > 0) {
            await stripeCreateRefund({
              paymentIntentId,
              amount: refundAmount,
              applicationFeeRefund,
            });
          }
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
        // Filter line items to past ones for caregiver payout
        lineItems: lineItems.filter(lineItem => {
          const startTime = addTimeToStartOfDay(lineItem.date, lineItem.startTime);
          return moment().isAfter(startTime);
        }),
        refundAmount: 0,
        payout: 0,
        refundItems: [],
      };
    }

    return res.status(200).json({ metadata: metadataToUpdate });
  } catch (e) {
    handleStripeError(res, e);
  }
};
