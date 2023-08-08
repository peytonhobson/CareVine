import React, { useState } from 'react';

import { Calendar } from 'react-calendar';
import classNames from 'classnames';
import moment from 'moment';
import { WEEKDAYS, WEEKDAY_MAP } from '../../util/constants';
import RecurringBookingSummaryCard from '../BookingSummaryCard/Recurring/RecurringBookingSummaryCard';

import css from './WeeklyBillingDetails.module.css';

const isSameISOWeek = (date1, date2) => {
  return moment(date1).isSame(date2, 'week');
};

const isInBookingSchedule = (
  date,
  bookedDates,
  bookedDays,
  bookingSchedule,
  startDate,
  endDate,
  exceptions
) => {
  const isBookedDate = bookedDates.some(bookingDate => moment(bookingDate).isSame(date));
  const isBookedDay = bookedDays.some(
    booking =>
      booking.days.includes(WEEKDAYS[date.getDay()]) &&
      moment(booking.startDate).isSameOrBefore(date) &&
      (!booking.endDate || moment(booking.endDate).isSameOrAfter(date))
  );

  if (isBookedDate || isBookedDay) return false;

  const inBookingSchedule = Object.keys(bookingSchedule).some(
    weekday =>
      WEEKDAY_MAP[weekday] === date.getDay() &&
      moment(startDate).isSameOrBefore(date) &&
      (!endDate || moment(endDate).isSameOrAfter(date))
  );
  const isAddedDay = exceptions?.addedDays?.some(d => moment(d.date).isSame(date));
  const isRemovedDay = exceptions?.removedDays?.some(d => moment(d.date).isSame(date));

  return (inBookingSchedule || isAddedDay) && !isRemovedDay;
};

const formatDay = (
  date,
  bookedDates,
  bookedDays,
  bookingSchedule,
  startDate,
  endDate,
  exceptions,
  hoveredDate,
  setHoveredDate
) => {
  const inBookingSchedule = isInBookingSchedule(
    date,
    bookedDates,
    bookedDays,
    bookingSchedule,
    startDate,
    endDate,
    exceptions
  );

  const isHoveredWeek = isSameISOWeek(date, hoveredDate);

  const beforeStartWeek = moment(date).isBefore(startDate, 'week');
  const isSunday = moment(date).day() === 0;
  const isSaturday = moment(date).day() === 6;
  const day = date.getDate();

  return (
    <div
      className={classNames(css.day, {
        [css.highlighted]: isHoveredWeek && !beforeStartWeek,
        [css.highlightable]: !beforeStartWeek,
        [css.inBookingSchedule]: inBookingSchedule,
        [css.disabled]: beforeStartWeek,
        [css.sunday]: isSunday,
        [css.saturday]: isSaturday,
      })}
      onMouseEnter={() => setHoveredDate(date)}
      onMouseLeave={() => setHoveredDate(null)}
    >
      <span>{day}</span>
    </div>
  );
};

// Bookeddays and dates should be those that were there when booking was created
export const WeeklyBillingDetails = props => {
  const {
    bookedDates = [],
    bookedDays = [],
    bookingSchedule = {},
    exceptions,
    startDate,
    endDate,
    className,
    currentAuthor,
    bookingRate,
    listing,
    onManageDisableScrolling,
    selectedPaymentMethodType,
  } = props;

  const classes = classNames(className, css.root);
  const initialDate = startDate ? new Date(startDate) : new Date();

  const [hoveredDate, setHoveredDate] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(false);

  const handleClickDay = date => {
    setSelectedWeek(moment(date).startOf('week'));
  };

  return (
    <div className={classes}>
      {selectedWeek ? (
        <RecurringBookingSummaryCard
          currentAuthor={currentAuthor}
          bookingRate={bookingRate}
          listing={listing}
          onManageDisableScrolling={onManageDisableScrolling}
          selectedPaymentMethod={selectedPaymentMethodType}
          subHeading="Weekly Billing Summary"
          weekdays={bookingSchedule}
          startDate={selectedWeek}
          endDate={moment(selectedWeek).endOf('week')}
          exceptions={exceptions}
          bookedDays={bookedDays}
          bookedDates={bookedDates}
          hideWeeklyBillingDetails
          className={css.summaryCard}
        />
      ) : (
        <Calendar
          formatDay={(_, date) =>
            formatDay(
              date,
              bookedDates,
              bookedDays,
              bookingSchedule,
              startDate,
              endDate,
              exceptions,
              hoveredDate,
              setHoveredDate
            )
          }
          value={initialDate}
          calendarType="Hebrew"
          view="month"
          onClickDay={handleClickDay}
        />
      )}
    </div>
  );
};

export default WeeklyBillingDetails;
