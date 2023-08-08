import React from 'react';

import { convertTimeFrom12to24 } from '../../util/data';
import moment from 'moment';
import { addTimeToStartOfDay } from '../../util/dates';

import css from '../BookingSummaryCard.module.css';

const calculateTimeBetween = (bookingStart, bookingEnd) => {
  const start = convertTimeFrom12to24(bookingStart).split(':')[0];
  const end = bookingEnd === '12:00am' ? 24 : convertTimeFrom12to24(bookingEnd).split(':')[0];

  return end - start;
};

const RefundBookingItem = props => {
  const { lineItem } = props;

  const { startTime, endTime, date, amount } = lineItem;
  const formattedDate = moment(date).format('ddd, MM/DD');

  const differenceInHours = addTimeToStartOfDay(date, startTime) - moment().toDate();
  const isInFuture = differenceInHours > 0;
  const isFifty = differenceInHours < 48 * 36e5 && isInFuture;
  const refund = isFifty ? 0.5 : 1;

  return startTime && endTime && isInFuture ? (
    <div className={css.bookingTime}>
      <div className={css.spread}>
        <h3 className={css.summaryDate}>{formattedDate}</h3>
        <h3 className={css.summaryDate}>
          ${parseFloat(amount * refund).toFixed(2)} {isFifty ? '(50%)' : '(100%)'}
        </h3>
      </div>
      <div className={css.summaryTimeContainer}>
        <span className={css.summaryTimes}>
          {startTime} - {endTime}
        </span>
        <p className={css.tinyNoMargin}>({calculateTimeBetween(startTime, endTime)} hours)</p>
      </div>
    </div>
  ) : null;
};

export default RefundBookingItem;
