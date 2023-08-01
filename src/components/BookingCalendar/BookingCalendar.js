import React, { useEffect, useState } from 'react';

import { Calendar } from 'react-calendar';
import classNames from 'classnames';
import moment from 'moment';

import css from './BookingCalendar.module.css';

const weekdayMap = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

const isDayHighlightedSingle = (bookedDates, date) =>
  bookedDates.map(d => d.getTime()).includes(date.getTime());

const isDayHighlightedRecurring = (bookingSchedule, startDate, endDate, date) =>
  Object.keys(bookingSchedule).some(
    weekday =>
      weekdayMap[weekday] === date.getDay() &&
      bookingSchedule[weekday]?.length > 0 &&
      moment(startDate) <= date &&
      (!endDate || moment(endDate) >= date)
  );

const isDayDisabled = date => date.getTime() < new Date().getTime();

const formatDay = (locale, date, bookedDates, noDisabled, bookingSchedule, startDate, endDate) => {
  const day = date.getDate();
  const isHighlighted =
    Object.keys(bookingSchedule)?.length > 0
      ? isDayHighlightedRecurring(bookingSchedule, startDate, endDate, date)
      : isDayHighlightedSingle(bookedDates, date);
  const isDisabled = noDisabled ? false : isDayDisabled(date);

  console.log(moment(startDate) <= date && (!endDate || moment(endDate) >= date));

  if (isHighlighted) {
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
    children,
    className,
  } = props;

  const classes = classNames(css.root, className);
  const initialDate = bookedDates?.[0] || new Date();

  return (
    <div className={classes}>
      <Calendar
        formatDay={(locale, date) =>
          formatDay(locale, date, bookedDates, noDisabled, bookingSchedule, startDate, endDate)
        }
        value={initialDate}
        calendarType="Hebrew"
      />
      {children}
    </div>
  );
};

export default BookingCalendar;
