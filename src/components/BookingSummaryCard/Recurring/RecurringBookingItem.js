import React from 'react';

import { convertTimeFrom12to24 } from '../../../util/data';
import moment from 'moment';
import { WEEKDAY_MAP } from '../../../util/constants';
import classNames from 'classnames';

import css from '../BookingSummaryCard.module.css';

const calculateTimeBetween = (bookingStart, bookingEnd) => {
  const start = convertTimeFrom12to24(bookingStart).split(':')[0];
  const end = bookingEnd === '12:00am' ? 24 : convertTimeFrom12to24(bookingEnd).split(':')[0];

  return end - start;
};

const calculateCost = (bookingStart, bookingEnd, price) =>
  parseFloat(calculateTimeBetween(bookingStart, bookingEnd) * Number(price)).toFixed(2);

const RecurringBookingItem = props => {
  const { bookingRate, weekday, startDate, showWeekly, isException } = props;

  const { startTime, endTime, dayOfWeek } = weekday;

  const bookingDate = moment(startDate).weekday(WEEKDAY_MAP[dayOfWeek]);
  const dateFormat = showWeekly ? 'dddd' : 'ddd, MMM Do';
  const formattedBookingDate = bookingDate.format(dateFormat);

  return (
    <div className={classNames(css.bookingTime, isException && 'text-secondary')}>
      <div className={css.spread}>
        <h3 className={css.summaryDate}>{formattedBookingDate}</h3>
        <h3 className={css.summaryDate}>${calculateCost(startTime, endTime, bookingRate)} </h3>
      </div>
      <div className={css.summaryTimeContainer}>
        <span className={css.summaryTimes}>
          {startTime} - {endTime}
        </span>
        <div className="flex justify-between w-full">
          <p className={css.tinyNoMargin}>({calculateTimeBetween(startTime, endTime)} hours)</p>
          {isException ? <p className={css.tinyNoMargin}>Exception</p> : null}
        </div>
      </div>
    </div>
  );
};

export default RecurringBookingItem;
