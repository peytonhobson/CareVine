import React from 'react';

import { Calendar } from 'react-calendar';
import classNames from 'classnames';
import moment from 'moment';

import css from './SingleBookingCalendar.module.css';
import { checkIsBlockedDay } from '../../util/bookings';

const isDayHighlightedSingle = (bookingDates, date) =>
  bookingDates.some(d => moment(d).isSame(date, 'day'));

const isDayDisabled = date => moment(date).isBefore(moment(), 'day');

const formatDay = ({ date, bookingDates, noDisabled }) => {
  const day = date.getDate();
  const isHighlighted = isDayHighlightedSingle(bookingDates, date);
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

export const SingleBookingCalendar = props => {
  const { bookingDates, noDisabled, className, children } = props;

  const classes = classNames(className, css.root);
  const initialDate = bookingDates?.[0] || new Date();

  return (
    <div className={classes}>
      <Calendar
        formatDay={(_, date) =>
          formatDay({
            date,
            bookingDates,
            noDisabled,
          })
        }
        value={initialDate}
        calendarType="Hebrew"
      />
      {children}
    </div>
  );
};

export default SingleBookingCalendar;
