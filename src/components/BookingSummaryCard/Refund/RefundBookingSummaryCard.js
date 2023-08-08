import React from 'react';

import { convertTimeFrom12to24 } from '../../util/data';
import moment from 'moment';
import { addTimeToStartOfDay } from '../../util/dates';
import RefundBookingItem from './RefundBookingItem';
import BookingSummaryCard from '../BookingSummaryCard';

import css from './BookingSummaryCard.module.css';

const TRANSACTION_FEE = 0.05;

const calculateTimeBetween = (bookingStart, bookingEnd) => {
  const start = convertTimeFrom12to24(bookingStart).split(':')[0];
  const end = bookingEnd === '12:00am' ? 24 : convertTimeFrom12to24(bookingEnd).split(':')[0];

  return end - start;
};

const calculateTotalHours = bookingTimes =>
  bookingTimes?.reduce(
    (acc, curr) =>
      acc +
      (curr.startTime && curr.endTime ? calculateTimeBetween(curr.startTime, curr.endTime) : 0),
    0
  );

const calculateBookingFee = subTotal => parseFloat(Number(subTotal) * TRANSACTION_FEE).toFixed(2);

const calculateSubTotal = (totalHours, bookingRate, lineItems) => {
  if (lineItems?.length > 0) {
    return parseFloat(
      lineItems.reduce((acc, lineItem) => {
        const { startTime, date, amount } = lineItem;

        const differenceInHours = addTimeToStartOfDay(date, startTime) - moment().toDate();
        const isInFuture = differenceInHours > 0;
        const isFifty = differenceInHours < 48 * 36e5 && isInFuture;
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
  const {
    authorDisplayName,
    currentAuthor,
    bookingRate,
    className,
    hideAvatar,
    subHeading,
    hideFees,
    refundAmount,
    lineItems: allLineItems,
  } = props;

  const lineItems = allLineItems?.filter(lineItem => {
    const { startTime, date } = lineItem;

    const differenceInHours = addTimeToStartOfDay(date, startTime) - moment().toDate();
    const isInFuture = differenceInHours > 0;

    return isInFuture;
  });

  const totalHours = calculateTotalHours(lineItems);

  const subTotal = calculateSubTotal(totalHours, bookingRate, lineItems);
  const bookingFee = hideFees ? 0 : calculateBookingFee(subTotal);
  const total = hideFees ? subTotal : calculateTotalCost(subTotal, bookingFee, refundAmount);

  return (
    <BookingSummaryCard
      currentAuthor={currentAuthor}
      className={className}
      hideAvatar={hideAvatar}
      subHeading={subHeading}
    >
      <div className={css.bookingTimes}>
        {lineItems.map((lineItem, index) => (
          <RefundBookingItem lineItem={lineItem} key={index} />
        ))}
      </div>
      <div className={css.totalContainer}>
        {totalHours ? (
          <div className={css.totalCalc}>
            {!hideFees ? (
              <>
                <div className={css.spread}>
                  <h4 className={css.paymentCalc}>CareVine Service Fee Refund</h4>
                  <h4 className={css.paymentCalc}>${bookingFee}</h4>
                </div>
                {refundAmount && refundAmount > 0 ? (
                  <div className={css.spread}>
                    <h4 className={css.paymentCalc} style={{ color: 'var(--failColor)' }}>
                      Refunded
                    </h4>
                    <h4 className={css.paymentCalc} style={{ color: 'var(--failColor)' }}>
                      ${refundAmount}
                    </h4>
                  </div>
                ) : null}
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
