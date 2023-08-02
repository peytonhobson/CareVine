import React from 'react';

import { convertTimeFrom12to24 } from '../../util/data';
import moment from 'moment';
import { addTimeToStartOfDay } from '../../util/dates';
import { WEEKDAY_MAP } from '../../util/constants';

import css from './BookingSummaryCard.module.css';

const calculateTimeBetween = (bookingStart, bookingEnd) => {
  const start = convertTimeFrom12to24(bookingStart).split(':')[0];
  const end = bookingEnd === '12:00am' ? 24 : convertTimeFrom12to24(bookingEnd).split(':')[0];

  return end - start;
};

const calculateCost = (bookingStart, bookingEnd, price) =>
  parseFloat(calculateTimeBetween(bookingStart, bookingEnd) * Number(price)).toFixed(2);

const BookingItem = props => {
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

const RecurringBookingItem = props => {
  const { bookingRate, weekday, weekdayKey, startDate, showFullWeek } = props;

  const bookingDate = moment(startDate).weekday(WEEKDAY_MAP[weekdayKey]);
  const format = showFullWeek ? 'dddd' : 'ddd, MMM Do';
  const formattedBookingDate = bookingDate.format(format);

  const { startTime, endTime } = weekday[0];

  return (
    <div className={css.bookingTime}>
      <div className={css.spread}>
        <h3 className={css.summaryDate}>{formattedBookingDate}</h3>
        <h3 className={css.summaryDate}>${calculateCost(startTime, endTime, bookingRate)} </h3>
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

const BookingItems = props => {
  const {
    bookingDates,
    selectedBookingTimes,
    bookingRate,
    weekdays,
    startDate,
    showFullWeek,
    itemType,
    lineItems,
  } = props;

  switch (itemType) {
    case 'single': {
      return bookingDates?.map((bookingDate, index) => {
        const month = new Date(bookingDate).getMonth() + 1;
        const day = new Date(bookingDate).getDate();
        const bookingTime = selectedBookingTimes.find(b => b.date === `${month}/${day}`) ?? {};

        return (
          <BookingItem
            bookingTime={bookingTime}
            selectedBookingTimes={selectedBookingTimes}
            bookingRate={bookingRate}
            key={bookingTime.date}
          />
        );
      });
    }
    case 'refund': {
      return lineItems.map((lineItem, index) => (
        <RefundBookingItem lineItem={lineItem} key={index} />
      ));
    }
    case 'recurring': {
      return Object.keys(weekdays)?.map((weekdayKey, index) => {
        const weekday = weekdays[weekdayKey];

        return (
          <RecurringBookingItem
            weekday={weekday}
            weekdayKey={weekdayKey}
            bookingRate={bookingRate}
            startDate={startDate}
            showFullWeek={showFullWeek}
            key={weekdayKey}
          />
        );
      });
    }
    default: {
      return null;
    }
  }
};

export default BookingItems;
