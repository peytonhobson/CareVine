import React, { useEffect, useState } from 'react';

import { Calendar } from 'react-calendar';
import classNames from 'classnames';
import moment from 'moment';
import { WEEKDAYS, WEEKDAY_MAP } from '../../util/constants';
import { Button, IconArrowHead, RecurringBookingSummaryCard } from '..';

import css from './WeeklyBillingDetails.module.css';

const isSameISOWeek = (date1, date2) => {
  return moment(date1).isSame(date2, 'week');
};

const isInBookingSchedule = (date, bookingSchedule, startDate, endDate, exceptions) => {
  const withinTimeFrame =
    moment(startDate).isSameOrBefore(date, 'day') &&
    (!endDate || moment(endDate).isSameOrAfter(date, 'day'));
  const inBookingSchedule = bookingSchedule.some(b => b.dayOfWeek === WEEKDAYS[date.getDay()]);
  const isAddedDay = exceptions?.addedDays?.some(d => moment(d.date).isSame(date, 'day'));
  const isRemovedDay = exceptions?.removedDays?.some(d => moment(d.date).isSame(date, 'day'));

  return ((inBookingSchedule && withinTimeFrame) || isAddedDay) && !isRemovedDay;
};

const formatDay = (
  date,
  bookingSchedule,
  startDate,
  endDate,
  exceptions,
  hoveredDate,
  setHoveredDate
) => {
  const inBookingSchedule = isInBookingSchedule(
    date,
    bookingSchedule,
    startDate,
    endDate,
    exceptions
  );

  const isHoveredWeek = isSameISOWeek(date, hoveredDate);

  const beforeStartDate = moment(date).isBefore(startDate, 'day');
  const afterEndDate = endDate ? moment(date).isAfter(endDate, 'day') : false;
  const beforeStartWeek = moment(date).isBefore(startDate, 'week');
  const afterEndWeek = endDate ? moment(date).isAfter(endDate, 'week') : false;
  const isSunday = moment(date).day() === 0;
  const isSaturday = moment(date).day() === 6;
  const day = date.getDate();

  return (
    <div
      className={classNames(css.day, {
        [css.highlighted]: isHoveredWeek && !beforeStartWeek && !afterEndWeek,
        [css.highlightable]: !beforeStartWeek && !afterEndWeek,
        [css.inBookingSchedule]: inBookingSchedule && !beforeStartDate && !afterEndDate,
        [css.disabled]: beforeStartWeek || afterEndWeek,
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

export const WeeklyBillingDetails = props => {
  const {
    booking,
    className,
    currentAuthor,
    listing,
    onManageDisableScrolling,
    hideFees,
    isPayment,
  } = props;

  const {
    startDate,
    endDate,
    exceptions,
    bookingSchedule = [],
    refundItems,
  } = booking.attributes.metadata;

  const classes = classNames(className, css.root);

  const [hoveredDate, setHoveredDate] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(false);
  const [initialDate, setInitialDate] = useState(startDate ? new Date(startDate) : new Date());

  useEffect(() => {
    if (selectedWeek) {
      setInitialDate(selectedWeek);
    }
  }, [selectedWeek]);

  const handleClickDay = date => {
    const beforeStartWeek = moment(date).isBefore(startDate, 'week');
    const afterEndWeek = endDate ? moment(date).isAfter(endDate, 'week') : false;

    if (!beforeStartWeek && !afterEndWeek) {
      setSelectedWeek(
        moment(date)
          .startOf('week')
          .toDate()
      );
    }
  };

  return (
    <div className={classes}>
      {selectedWeek ? (
        <>
          <Button
            onClick={() => setSelectedWeek(null)}
            rootClassName={css.goBackButton}
            type="button"
          >
            <IconArrowHead rootClassName={css.arrowIcon} direction="left" size="small" />
            <span className={css.goBackText}>Go Back</span>
          </Button>
          <RecurringBookingSummaryCard
            currentAuthor={currentAuthor}
            listing={listing}
            booking={booking}
            onManageDisableScrolling={onManageDisableScrolling}
            subHeading={isPayment ? 'Payment Details' : 'Billing Details'}
            startOfWeek={moment(selectedWeek).isBefore(startDate) ? startDate : selectedWeek}
            hideWeeklyBillingDetails
            className={css.summaryCard}
            hideRatesButton
            hideAvatar
            hideFees={hideFees}
            hideFullSchedule
          />
        </>
      ) : (
        <Calendar
          formatDay={(_, date) =>
            formatDay(
              date,
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
