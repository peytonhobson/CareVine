import React, { useEffect, useState } from 'react';

import { Calendar } from 'react-calendar';
import classNames from 'classnames';
import moment from 'moment';
import { WEEKDAYS, WEEKDAY_MAP } from '../../util/constants';

import css from './BookingCalendar.module.css';

const isDayHighlightedSingle = (bookedDates, date) =>
  bookedDates.map(d => d.getTime()).includes(date.getTime());

const isDayHighlightedRecurring = (bookingSchedule, startDate, endDate, date) =>
  Object.keys(bookingSchedule).some(
    weekday =>
      WEEKDAY_MAP[weekday] === date.getDay() &&
      bookingSchedule[weekday]?.length > 0 &&
      moment(startDate) <= date &&
      (!endDate || moment(endDate) >= date)
  );

const isDayDisabled = date => date.getTime() < new Date().getTime();

const isDayUnavailable = (bookingSchedule, startDate, endDate, unavailableDates, date) => {
  const { bookedDates = [], bookedDays = [] } = unavailableDates;

  const isAfterStartDate = moment(startDate).isSameOrBefore(date);
  const isBeforeEndDate = !endDate || moment(endDate).isSameOrAfter(date);
  const isInBookingSchedule = bookingSchedule[WEEKDAYS[date.getDay()]];

  const bookedDay = bookedDays.some(booking => {
    return (
      booking.days.includes(WEEKDAYS[date.getDay()]) &&
      moment(booking.startDate).isSameOrBefore(date) &&
      moment(booking.endDate).isSameOrAfter(date)
    );
  });

  if (bookedDay && isAfterStartDate && isBeforeEndDate && isInBookingSchedule) return true;

  const bookedDate = bookedDates.some(bookingDate => {
    return moment(bookingDate).isSame(date);
  });

  return bookedDate && isAfterStartDate && isBeforeEndDate && isInBookingSchedule;
};

const formatDay = (
  locale,
  date,
  bookedDates,
  noDisabled,
  bookingSchedule,
  startDate,
  endDate,
  unavailableDates
) => {
  const day = date.getDate();
  const isHighlighted =
    Object.keys(bookingSchedule)?.length > 0
      ? isDayHighlightedRecurring(bookingSchedule, startDate, endDate, date)
      : isDayHighlightedSingle(bookedDates, date);
  const isDisabled = noDisabled ? false : isDayDisabled(date);
  const isUnavailable = isDayUnavailable(
    bookingSchedule,
    startDate,
    endDate,
    unavailableDates,
    date
  );

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
  const {
    bookedDates = [],
    bookingSchedule = {},
    startDate,
    endDate,
    noDisabled,
    unavailableDates = {},
    children,
    className,
  } = props;

  const classes = classNames(css.root, className);
  const initialDate = bookedDates?.[0] || new Date();

  return (
    <div className={classes}>
      <Calendar
        formatDay={(locale, date) =>
          formatDay(
            locale,
            date,
            bookedDates,
            noDisabled,
            bookingSchedule,
            startDate,
            endDate,
            unavailableDates
          )
        }
        value={initialDate}
        calendarType="Hebrew"
      />
      {children}
    </div>
  );
};

export default BookingCalendar;
