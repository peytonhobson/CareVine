import React, { useState, useEffect } from 'react';

import { FieldDateInput } from '../../..';
import { formatFieldDateInput, parseFieldDateInput } from '../../../../util/dates';
import { checkIsBlockedDay, checkIsDateInBookingSchedule } from '../../../../util/bookings';
import moment from 'moment';

const TODAY = new Date();
// Date formatting used for placeholder texts:
const dateFormattingOptions = { month: 'short', day: 'numeric', weekday: 'short' };

const findFirstBlockedDateInSchedule = (
  bookingSchedule,
  exceptions,
  bookedDates,
  bookedDays,
  currentMonth
) => {
  const endOfMonth = currentMonth.clone().endOf('month');

  for (
    let date = currentMonth.clone();
    date.isSameOrBefore(endOfMonth, 'day');
    date.add(1, 'day')
  ) {
    const isInBookingSchedule = checkIsDateInBookingSchedule(date, bookingSchedule, exceptions);
    const isDayBlocked = checkIsBlockedDay({ date, bookedDays, bookedDates });

    if (isDayBlocked && isInBookingSchedule && moment(date).isAfter(TODAY, 'day')) {
      return date.toDate();
    }
  }

  return null;
};

const filterAvailableBookingEndDates = ({
  bookingSchedule,
  exceptions,
  bookedDates,
  bookedDays,
  appliedDate,
  firstBlockedDay,
  lastAvailableDate,
}) => date => {
  const isInBookingSchedule = checkIsDateInBookingSchedule(date, bookingSchedule, exceptions);
  const isBeforeApplied = moment(date).isBefore(appliedDate, 'day');
  const isDayBlocked = checkIsBlockedDay({ date, bookedDays, bookedDates });
  const afterFirstBlockedDate = firstBlockedDay
    ? moment(date).isAfter(firstBlockedDay, 'day')
    : false;
  const afterLastAvailableDate = lastAvailableDate
    ? moment(date).isAfter(lastAvailableDate, 'day')
    : false;

  return (
    isDayBlocked ||
    !isInBookingSchedule ||
    isBeforeApplied ||
    afterFirstBlockedDate ||
    afterLastAvailableDate
  );
};

const FieldChangeEndDate = props => {
  const [currentEndDateMonth, setCurrentEndDateMonth] = useState(moment().startOf('month'));
  const [firstBlockedDay, setFirstBlockedDay] = useState(null);
  const { intl, disabled, className, booking, appliedDate, weekdays, lastAvailableDate } = props;

  const txId = booking.id.uuid;
  const { exceptions, bookingSchedule: oldBookingSchedule = [] } = booking.attributes.metadata;
  const bookingSchedule = weekdays || oldBookingSchedule;

  const { listing } = booking;
  const { bookedDays = [], bookedDates = [] } = listing.attributes.metadata || {};
  const filteredBookedDays = bookedDays.filter(b => b.txId !== txId);
  const timezone = listing.attributes.publicData.availabilityPlan?.timezone;

  useEffect(() => {
    const firstBlockedDayInMonth = findFirstBlockedDateInSchedule(
      bookingSchedule,
      exceptions,
      bookedDates,
      filteredBookedDays,
      currentEndDateMonth
    );

    if (!firstBlockedDay || moment(firstBlockedDayInMonth).isBefore(firstBlockedDay, 'day')) {
      setFirstBlockedDay(firstBlockedDayInMonth);
    }
  }, [
    JSON.stringify(bookingSchedule),
    JSON.stringify(exceptions),
    JSON.stringify(bookedDates),
    JSON.stringify(filteredBookedDays),
    currentEndDateMonth,
  ]);

  useEffect(() => {
    setFirstBlockedDay(null);
  }, [JSON.stringify(bookingSchedule)]);

  return (
    <FieldDateInput
      name="endDate"
      id="endDate"
      className={className}
      label="New End Date"
      placeholderText={intl.formatDate(TODAY, dateFormattingOptions)}
      format={formatFieldDateInput(timezone)}
      parse={parseFieldDateInput(timezone)}
      isDayBlocked={filterAvailableBookingEndDates({
        bookingSchedule,
        exceptions,
        bookedDates,
        bookedDays: filteredBookedDays,
        appliedDate,
        firstBlockedDay,
        lastAvailableDate,
      })}
      useMobileMargins
      showErrorMessage={false}
      onPrevMonthClick={m => setCurrentEndDateMonth(m.startOf('month'))}
      onNextMonthClick={m => setCurrentEndDateMonth(m.startOf('month'))}
      disabled={disabled}
    />
  );
};

export default FieldChangeEndDate;
