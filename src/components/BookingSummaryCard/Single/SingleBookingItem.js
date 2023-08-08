import React from 'react';

import { convertTimeFrom12to24 } from '../../../util/data';

import css from '../BookingSummaryCard.module.css';

const calculateTimeBetween = (bookingStart, bookingEnd) => {
  const start = convertTimeFrom12to24(bookingStart).split(':')[0];
  const end = bookingEnd === '12:00am' ? 24 : convertTimeFrom12to24(bookingEnd).split(':')[0];

  return end - start;
};

const calculateCost = (bookingStart, bookingEnd, price) =>
  parseFloat(calculateTimeBetween(bookingStart, bookingEnd) * Number(price)).toFixed(2);

const SingleBookingItem = props => {
  const { bookingTime, bookingRate } = props;

  const { date, startTime, endTime } = bookingTime;

  return startTime && endTime ? (
    <div className={css.bookingTime}>
      <div className={css.spread}>
        <h3 className={css.summaryDate}>{date}</h3>
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
