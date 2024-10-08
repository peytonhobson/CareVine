import React, { useEffect, useState } from 'react';

import { Calendar } from 'react-calendar';
import classNames from 'classnames';
import moment from 'moment';

import css from './BookingCalendar.module.css';

const isDayHighlighted = (bookedDates, date) =>
  bookedDates.map(d => d.getTime()).includes(date.getTime());

const isDayDisabled = date => date.getTime() < new Date().getTime();

const formatDay = (locale, date, bookedDates, noDisabled) => {
  const day = date.getDate();
  const isHighlighted = isDayHighlighted(bookedDates, date);
  const isDisabled = noDisabled ? false : isDayDisabled(date);

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
  const { bookedDates = [], noDisabled, children, className } = props;

  const classes = classNames(css.root, className);
  const initialDate = bookedDates?.[0] || new Date();

  return (
    <div className={classes}>
      <Calendar
        formatDay={(locale, date) => formatDay(locale, date, bookedDates, noDisabled)}
        value={initialDate}
      />
      {children}
    </div>
  );
};

export default BookingCalendar;
