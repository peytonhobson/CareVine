import React, { useCallback, useEffect, useState } from 'react';

import { Calendar } from 'react-calendar';
import classNames from 'classnames';
import moment from 'moment';
import { WEEKDAYS, WEEKDAY_MAP } from '../../util/constants';
import { checkIsBlockedDay, checkIsDateWithinBookingWindow } from '../../util/bookings';

import css from './UnavailableBookingCalendar.module.css';

const isDayHighlightedRecurring = (bookingSchedule, startDate, endDate, date, exceptions) =>
  (bookingSchedule.some(
    b =>
      WEEKDAY_MAP[b.dayOfWeek] === date.getDay() &&
      moment(startDate) <= date &&
      (!endDate || moment(endDate) >= date)
  ) ||
    exceptions?.addedDays?.some(d => moment(d.date).isSame(date))) &&
  !exceptions?.removedDays?.some(d => moment(d.date).isSame(date));

const isDayDisabled = date => moment(date).isBefore(moment(), 'day');

const isDayUnavailable = ({
  bookingSchedule,
  startDate,
  endDate,
  bookedDates,
  bookedDays,
  date,
  exceptions,
}) => {
  const isInBookingWindow = checkIsDateWithinBookingWindow({ startDate, endDate, date });
  const isBlockedDay = checkIsBlockedDay({ bookedDays, bookedDates, date });
  const isInBookingSchedule =
    bookingSchedule.some(d => WEEKDAYS.indexOf(d.dayOfWeek) === moment(date).weekday()) ||
    exceptions?.addedDays?.some(d => moment(d.date).isSame(date));

  return isInBookingWindow && isBlockedDay && isInBookingSchedule;
};

const formatDay = ({
  date,
  bookedDates,
  bookedDays,
  noDisabled,
  bookingSchedule,
  startDate,
  endDate,
  exceptions,
}) => {
  const day = date.getDate();
  const isHighlighted = isDayHighlightedRecurring(
    bookingSchedule,
    startDate,
    endDate,
    date,
    exceptions
  );
  const isDisabled = noDisabled ? false : isDayDisabled(date);
  const isUnavailable = isDayUnavailable({
    bookingSchedule,
    startDate,
    endDate,
    bookedDates,
    bookedDays,
    date,
    exceptions,
  });

  if (isUnavailable) {
    return (
      <div className={classNames(css.day, css.unavailable)}>
        <span>{day}</span>
      </div>
    );
  } else if (isHighlighted) {
    return (
      <div className={classNames(css.day, css.highlighted)}>
        <span>{day}</span>
      </div>
    );
  } else if (isDisabled) {
    return <span className={classNames(css.day, css.blocked)}>{day}</span>;
  } else {
    return <span className={css.day}>{day}</span>;
  }
};

export const BookingCalendar = props => {
  const [firstUnavailableDate, setFirstUnavailableDate] = useState(null);
  const {
    bookedDates = [],
    bookedDays = [],
    bookingSchedule = [],
    startDate,
    endDate,
    noDisabled,
    children,
    className,
    exceptions,
  } = props;

  const classes = classNames(className, css.root);
  const initialDate = moment();
  const [initialMonth, setInitialMonth] = useState(initialDate.startOf('month'));

  const findInitialUnavailableDate = useCallback(() => {
    const endOfMonth = moment(initialMonth).endOf('month');
    for (
      let date = moment(initialMonth).startOf('month');
      date.isSameOrBefore(endOfMonth, 'day');
      date.add(1, 'day')
    ) {
      const isUnavailable = isDayUnavailable({
        bookingSchedule,
        startDate,
        endDate,
        bookedDates,
        bookedDays,
        date: date.toDate(),
        exceptions,
      });

      if (isUnavailable) {
        const newDate = date.toDate();
        setFirstUnavailableDate(prevDate =>
          prevDate ? (moment(prevDate).isBefore(newDate) ? prevDate : newDate) : newDate
        );
      }
    }
  }, [initialDate, bookingSchedule, startDate, endDate, bookedDates, bookedDays, exceptions]);

  useEffect(() => {
    const m = moment(initialDate).startOf('month');

    if (!firstUnavailableDate && m.diff(initialMonth, 'months') < 4) {
      setInitialMonth(moment(initialMonth).add(1, 'month'));
      findInitialUnavailableDate();
    }
  }, [initialDate, firstUnavailableDate, initialMonth, findInitialUnavailableDate]);

  return (
    <div className={classes}>
      <Calendar
        formatDay={(locale, date) =>
          formatDay({
            locale,
            date,
            bookedDays,
            bookedDates,
            noDisabled,
            bookingSchedule,
            startDate,
            endDate,
            exceptions,
          })
        }
        value={firstUnavailableDate || initialDate}
        calendarType="Hebrew"
        showNeighboringMonth={false}
      />
      {children}
    </div>
  );
};

export default BookingCalendar;
