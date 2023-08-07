import React from 'react';

import { convertTimeFrom12to24 } from '../../util/data';
import moment from 'moment';
import { addTimeToStartOfDay } from '../../util/dates';
import { WEEKDAY_MAP, WEEKDAYS } from '../../util/constants';

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
  const { bookingRate, weekday, weekdayKey, startDate } = props;

  const bookingDate = moment(startDate).weekday(WEEKDAY_MAP[weekdayKey]);
  const formattedBookingDate = bookingDate.format('ddd, MMM Do');

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

// Start date should be within week you're looking at, not actual booking start date
const BookingItems = props => {
  const {
    bookingDates,
    selectedBookingTimes,
    bookingRate,
    weekdays,
    startDate,
    itemType,
    lineItems,
    exceptions,
    bookedDays,
    bookedDates,
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
      const addedDays =
        exceptions?.addedDays.filter(day =>
          moment(day.date).isBetween(
            moment(startDate).startOf('week'),
            moment(startDate).endOf('week'),
            'day',
            '[]'
          )
        ) ?? [];
      const removedDays =
        exceptions?.removedDays.filter(day =>
          moment(day.date).isBetween(
            moment(startDate).startOf('week'),
            moment(startDate).endOf('week'),
            'day',
            '[]'
          )
        ) ?? [];
      const changedDays =
        exceptions?.changedDays.filter(day =>
          moment(day.date).isBetween(
            moment(startDate).startOf('week'),
            moment(startDate).endOf('week'),
            'day',
            '[]'
          )
        ) ?? [];

      const weekdaysWithExceptions = Object.keys(weekdays).reduce((acc, weekdayKey) => {
        const removedDay = removedDays.find(
          day => WEEKDAYS[moment(day.date).weekday()] === weekdayKey
        );
        const isBookedDate = bookedDates.find(date =>
          moment(startDate)
            .weekday(WEEKDAY_MAP[weekdayKey])
            .isSame(date, 'day')
        );
        const realDate = moment(startDate)
          .weekday(WEEKDAY_MAP[weekdayKey])
          .toDate();
        const isBookedDay = bookedDays.some(
          d =>
            d.days.some(dd => WEEKDAY_MAP[dd] === moment(realDate).weekday()) &&
            (!d.endDate || realDate <= moment(d.endDate)) &&
            realDate >= moment(d.startDate)
        );
        if (removedDay || isBookedDate || isBookedDay) {
          return acc;
        }

        const changedDay = changedDays.find(
          day => WEEKDAYS[moment(day.date).weekday()] === weekdayKey
        );
        if (changedDay) {
          return {
            ...acc,
            [weekdayKey]: [
              {
                startTime: changedDay.startTime,
                endTime: changedDay.endTime,
              },
            ],
          };
        }

        return {
          ...acc,
          [weekdayKey]: weekdays[weekdayKey],
        };
      }, {});

      const weekdaysWithAddedDays = addedDays.reduce((acc, addedDay) => {
        const weekdayKey = WEEKDAYS[moment(addedDay.date).weekday()];

        return {
          ...acc,
          [weekdayKey]: [
            {
              startTime: addedDay.startTime,
              endTime: addedDay.endTime,
            },
          ],
        };
      }, weekdaysWithExceptions);

      return Object.keys(weekdaysWithAddedDays)?.map((weekdayKey, index) => {
        const weekday = weekdaysWithAddedDays[weekdayKey];

        return (
          <RecurringBookingItem
            weekday={weekday}
            weekdayKey={weekdayKey}
            bookingRate={bookingRate}
            startDate={startDate}
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

export default React.memo(BookingItems);
