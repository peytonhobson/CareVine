import React from 'react';

import moment from 'moment';
import { calculateTimeBetween } from '../../../util/dates';

import css from '../BookingSummaryCard.module.css';

const RefundBookingItem = props => {
  const { lineItem } = props;

  const { startTime, endTime, date, amount, isFifty } = lineItem;
  const formattedDate = moment(date).format('ddd, MM/DD');

  return (
    <div className={css.bookingTime}>
      <div className={css.spread}>
        <h3 className={css.summaryDate}>{formattedDate}</h3>
        <h3 className={css.summaryDate}>
          ${parseFloat(amount).toFixed(2)} {isFifty ? '(50%)' : '(100%)'}
        </h3>
      </div>
      <div className={css.summaryTimeContainer}>
        <span className={css.summaryTimes}>
          {startTime} - {endTime}
        </span>
        <p className={css.tinyNoMargin}>({calculateTimeBetween(startTime, endTime)} hours)</p>
      </div>
    </div>
  );
};

export default RefundBookingItem;
