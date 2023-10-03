import React, { useMemo } from 'react';

import moment from 'moment';
import { addTimeToStartOfDay, calculateTimeBetween } from '../../../util/dates';
import RefundBookingItem from './RefundBookingItem';
import BookingSummaryCard from '../BookingSummaryCard';

import css from '../BookingSummaryCard.module.css';

const TRANSACTION_FEE = 0.05;

const calculateTotalHours = bookingTimes =>
  bookingTimes?.reduce((acc, curr) => calculateTimeBetween(curr.startTime, curr.endTime) + acc, 0);

const calculateBookingFee = subTotal => parseFloat(Number(subTotal) * TRANSACTION_FEE).toFixed(2);

const mapRefundItems = chargedLineItems => {
  return chargedLineItems.reduce((acc, curr) => {
    const refundedLineItems = curr.lineItems
      .filter(l => {
        const startTime = addTimeToStartOfDay(l.date, l.startTime);
        return moment().isBefore(startTime);
      })
      .map(lineItem => {
        const startTime = addTimeToStartOfDay(lineItem.date, lineItem.startTime);
        const isWithin48Hours = moment()
          .add(2, 'days')
          .isAfter(startTime);

        const amount = isWithin48Hours
          ? parseFloat(lineItem.amount / 2).toFixed(2)
          : parseFloat(lineItem.amount).toFixed(2);
        return {
          ...lineItem,
          isFifty: isWithin48Hours,
          amount,
        };
      });

    return [...acc, ...refundedLineItems];
  }, []);
};

const calculateSubTotal = (totalHours, bookingRate, lineItems) => {
  if (lineItems?.length > 0) {
    return parseFloat(
      lineItems.reduce((acc, lineItem) => {
        const { startTime, date, amount } = lineItem;

        const start = addTimeToStartOfDay(date, startTime);
        const isInFuture = start.isAfter(moment());
        const isFifty =
          moment()
            .add(2, 'days')
            .isAfter(start) && isInFuture;
        const refund = isFifty ? 0.5 : 1;

        return acc + refund * amount;
      }, 0)
    ).toFixed(2);
  }

  return parseFloat(totalHours * Number(bookingRate)).toFixed(2);
};

const calculateTotalCost = (subTotal, bookingFee, refundAmount = 0) =>
  parseFloat(Number(subTotal) + Number(bookingFee) - Number(refundAmount)).toFixed(2);

const RefundBookingSummaryCard = props => {
  const { currentAuthor, className, hideAvatar, subHeading, hideFees, booking } = props;

  const { chargedLineItems = [], bookingRate } = booking.attributes.metadata;

  const refundItems = useMemo(() => mapRefundItems(chargedLineItems), [chargedLineItems]);

  const totalHours = calculateTotalHours(refundItems);

  const refundAmount = refundItems.reduce((acc, curr) => acc + Number(curr.amount), 0);

  const subTotal = calculateSubTotal(totalHours, bookingRate, refundItems);
  const bookingFee = hideFees ? 0 : calculateBookingFee(subTotal);
  const total = hideFees ? subTotal : calculateTotalCost(subTotal, bookingFee);

  return (
    <BookingSummaryCard
      currentAuthor={currentAuthor}
      className={className}
      hideAvatar={hideAvatar}
      subHeading={subHeading}
    >
      <div className={css.bookingTimes}>
        {refundItems.map((lineItem, index) => (
          <RefundBookingItem lineItem={lineItem} key={index} />
        ))}
      </div>
      <div className={css.totalContainer}>
        {totalHours ? (
          <div className={css.totalCalc}>
            {!hideFees ? (
              <>
                <div className={css.spread}>
                  <h4 className={css.paymentCalc}>Service Fee Refund</h4>
                  <h4 className={css.paymentCalc}>${bookingFee}</h4>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
        <div className={css.spread}>
          <h3 className={css.total}>Total Refund:</h3>
          <h3 className={css.total}>${total}</h3>
        </div>
      </div>
    </BookingSummaryCard>
  );
};

export default RefundBookingSummaryCard;
