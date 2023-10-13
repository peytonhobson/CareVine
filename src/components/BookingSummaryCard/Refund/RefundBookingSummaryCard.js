import React, { useMemo } from 'react';

import moment from 'moment';
import { addTimeToStartOfDay, calculateTimeBetween } from '../../../util/dates';
import RefundBookingItem from './RefundBookingItem';
import BookingSummaryCard from '../BookingSummaryCard';
import { BOOKING_FEE_PERCENTAGE } from '../../../util/constants';

import css from '../BookingSummaryCard.module.css';

const calculateTotalHours = bookingTimes =>
  bookingTimes?.reduce((acc, curr) => calculateTimeBetween(curr.startTime, curr.endTime) + acc, 0);

const calculateBookingFee = subTotal =>
  parseFloat(Number(subTotal) * BOOKING_FEE_PERCENTAGE).toFixed(2);

const mapRefundItems = (chargedLineItems, cancelDate) => {
  return chargedLineItems.reduce((acc, curr) => {
    const refundedLineItems = curr.lineItems
      .filter(l => {
        const startTime = addTimeToStartOfDay(l.date, l.startTime);
        return moment(cancelDate).isBefore(startTime);
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

const calculateTotalCost = (subTotal, bookingFee, refundAmount = 0) =>
  parseFloat(Number(subTotal) + Number(bookingFee) - Number(refundAmount)).toFixed(2);

const RefundBookingSummaryCard = props => {
  const { currentAuthor, className, hideAvatar, subHeading, hideFees, booking, cancelDate } = props;

  const { chargedLineItems = [] } = booking.attributes.metadata;

  const dateOfCancellation = moment(cancelDate).endOf('day') ?? moment();

  const refundItems = useMemo(() => mapRefundItems(chargedLineItems, dateOfCancellation), [
    chargedLineItems,
    dateOfCancellation,
  ]);

  const totalHours = calculateTotalHours(refundItems);
  const subTotal = useMemo(() => refundItems.reduce((acc, curr) => Number(curr.amount) + acc, 0), [
    refundItems,
  ]);
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
