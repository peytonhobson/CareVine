import React, { useState } from 'react';

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
    moment(startDate).isSameOrBefore(date) && (!endDate || moment(endDate).isSameOrAfter(date));
  const inBookingSchedule = bookingSchedule.some(b => b.dayOfWeek === date.getDay());
  const isAddedDay = exceptions?.addedDays?.some(d => moment(d.date).isSame(date));
  const isRemovedDay = exceptions?.removedDays?.some(d => moment(d.date).isSame(date));

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
        [css.inBookingSchedule]: inBookingSchedule,
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
    hideFees,
    isPayment,
  } = props;

  const classes = classNames(className, css.root);
  const initialDate = startDate ? new Date(startDate) : new Date();

  const [hoveredDate, setHoveredDate] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(false);

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
            bookingRate={bookingRate}
            listing={listing}
            onManageDisableScrolling={onManageDisableScrolling}
            selectedPaymentMethod={selectedPaymentMethodType}
            subHeading={isPayment ? 'Payment Details' : 'Billing Details'}
            weekdays={bookingSchedule}
            startDate={new Date(startDate) > selectedWeek ? startDate : selectedWeek}
            weekEndDate={moment(selectedWeek).endOf('week')}
            exceptions={exceptions}
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
