import React from 'react';

import { calculateTimeBetween } from '../../../util/dates';
import moment from 'moment';

import css from '../BookingSummaryCard.module.css';

const calculateCost = (bookingStart, bookingEnd, price) =>
  parseFloat(calculateTimeBetween(bookingStart, bookingEnd) * Number(price)).toFixed(2);

const SingleBookingItem = props => {
  const { bookingTime, bookingRate } = props;

  const { date, startTime, endTime } = bookingTime;
  const formattedDate = moment(date).format('ddd, MM/DD');

  return startTime && endTime ? (
    <div className={css.bookingTime}>
      <div className={css.spread}>
        <h3 className={css.summaryDate}>{formattedDate}</h3>
        <h3 className={css.summaryDate}>${calculateCost(startTime, endTime, bookingRate)}</h3>
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

export default SingleBookingItem;
