import React, { useEffect, useState } from 'react';

import { FormattedMessage } from '../../util/reactIntl';
import {
  Modal,
  InfoTooltip,
  Button,
  FieldDateInput,
  DailyPlan,
  PrimaryButton,
  FieldDatePicker,
  BookingException,
} from '..';
import classNames from 'classnames';
import { formatFieldDateInput, parseFieldDateInput } from '../../util/dates';
import { ISO_OFFSET_FORMAT, WEEKDAYS } from '../../util/constants';
import moment from 'moment';
import { pick } from 'lodash';
import { useCheckMobileScreen } from '../../util/hooks';
import {
  sortExceptionsByDate,
  mapWeekdays,
  checkIsBlockedDay,
  checkIsDateWithinBookingWindow,
  checkIsDateInBookingSchedule,
} from '../../util/bookings';

import css from './BookingExceptions.module.css';

const TODAY = new Date();
// Date formatting used for placeholder texts:
const dateFormattingOptions = { month: 'short', day: 'numeric', weekday: 'short' };

const MAX_EXCEPTIONS_COUNT = 100;

const filterAvailableAddExceptionDays = ({
  bookedDays,
  bookedDates,
  endDate,
  weekdays,
  exceptions,
  firstAvailableDate,
}) => date => {
  const day = date.day();
  const isBlockedDay = checkIsBlockedDay({ bookedDays, bookedDates, date });
  const isAlreadySelected = weekdays.some(w => w.dayOfWeek === WEEKDAYS[day]);
  const isAlreadyException = Object.values(exceptions)
    .flat()
    .some(e => moment(e.date).isSame(date, 'day'));
  const isWithinBookingWindow = checkIsDateWithinBookingWindow({
    startDate: firstAvailableDate,
    endDate,
    date,
  });

  return isBlockedDay || isAlreadySelected || isAlreadyException || !isWithinBookingWindow;
};

const filterAvailableChangeExceptionDays = (
  endDate,
  weekdays = [],
  exceptions,
  firstAvailableDate
) => date => {
  const day = moment(date).weekday();
  const isAlreadyException = Object.values(exceptions)
    .flat()
    .some(e => moment(date).isSame(e.date, 'day'));
  const isInBookingSchedule = weekdays.some(w => w.dayOfWeek === WEEKDAYS[day]);
  const isDateWithinBooking = checkIsDateWithinBookingWindow({
    startDate: firstAvailableDate || TODAY,
    endDate,
    date,
  });

  return isAlreadyException || !isInBookingSchedule || !isDateWithinBooking;
};

const filterRemoveExceptionsDays = ({
  endDate,
  weekdays = [],
  firstAvailableDate,
  exceptions,
  bookedDates,
  bookedDays,
}) => ({ date }) => {
  const isWithinBookingWindow = checkIsDateWithinBookingWindow({
    startDate: moment(firstAvailableDate).add(1, 'day'),
    endDate,
    date,
  });
  const isSelectedWeekday = checkIsDateInBookingSchedule(date, weekdays);
  const isException = Object.values(exceptions)
    .flat()
    .some(e => moment(e.date).isSame(date, 'day'));
  const isBlocked = checkIsBlockedDay({ bookedDays, date, bookedDates });

  return !isWithinBookingWindow || !isSelectedWeekday || isException || isBlocked;
};

const BookingExceptions = props => {
  const {
    bookedDates,
    bookedDays,
    values,
    onManageDisableScrolling,
    intl,
    timezone,
    form,
    booking,
    firstAvailableDate: firstAvailableDateProp,
    disabled,
  } = props;

  const isMobile = useCheckMobileScreen();

  const dateSource = booking ? booking.attributes.metadata : values;

  const {
    exceptions = {
      removedDays: [],
      addedDays: [],
      changedDays: [],
    },
  } = values;

  const { startDate, endDate, bookingSchedule } = dateSource;

  let firstAvailableDate;
  if (firstAvailableDateProp) {
    firstAvailableDate = firstAvailableDateProp;
  } else if (startDate?.date) {
    firstAvailableDate = moment(startDate.date).isBefore()
      ? moment(TODAY).add(1, 'day')
      : startDate.date;
  } else if (startDate) {
    firstAvailableDate = moment(startDate).isBefore() ? moment(TODAY).add(1, 'day') : startDate;
  } else {
    firstAvailableDate = moment(TODAY).add(1, 'day');
  }

  const sortedExceptions = Object.values(exceptions)
    .flat()
    .sort(sortExceptionsByDate);

  const weekdays = bookingSchedule || mapWeekdays(pick(values, WEEKDAYS));

  useEffect(() => {
    //Remove all exceptions that fall outside of start and end date
    const filterExceptions = e =>
      new Date(e.date) >= startDate?.date && (!endDate?.date || new Date(e.date) <= endDate?.date);
    const newExceptions = {
      ...exceptions,
      removedDays: exceptions.removedDays.filter(filterExceptions),
      addedDays: exceptions.addedDays.filter(filterExceptions),
      changedDays: exceptions.changedDays.filter(filterExceptions),
    };

    form.change('exceptions', newExceptions);
  }, [values.startDate?.date, values.endDate?.date]);

  useEffect(() => {
    //Remove all exceptions that interfere with weekdays
    const newExceptions = {
      ...exceptions,
      removedDays: exceptions.removedDays.filter(d =>
        weekdays.find(w => w.dayOfWeek === WEEKDAYS[moment(d.date).day()])
      ),
      addedDays: exceptions.addedDays.filter(
        d => !weekdays.find(w => w.dayOfWeek === WEEKDAYS[moment(d.date).day()])
      ),
      changedDays: exceptions.changedDays.filter(d =>
        weekdays.find(w => w.dayOfWeek === WEEKDAYS[moment(d.date).day()])
      ),
    };

    form.change('exceptions', newExceptions);
  }, [Object.keys(weekdays).length]);

  const [isAddDayModalOpen, setIsAddDayModalOpen] = useState(false);
  const [isRemoveDayModalOpen, setIsRemoveDayModalOpen] = useState(false);
  const [isChangeDayModalOpen, setIsChangeDayModalOpen] = useState(false);
  const [isDateInputFocused, setIsDateInputFocused] = useState(false);

  const handleAddDate = () => {
    const newAddDateException = {
      date: moment(values.addDate?.date).format(ISO_OFFSET_FORMAT),
      startTime: values.addDateTime?.[0]?.startTime,
      endTime: values.addDateTime?.[0]?.endTime,
      type: 'addDate',
      day: WEEKDAYS[moment(values.addDate?.date).weekday()],
    };

    const newExceptions = {
      ...exceptions,
      addedDays: [...exceptions.addedDays, newAddDateException],
    };

    form.change('addDate', null);
    form.change('addDateTime', null);
    form.change('exceptions', newExceptions);

    setIsAddDayModalOpen(false);
  };

  const handleChangeDate = () => {
    const newChangeDateException = {
      date: moment(values.changeDate?.date).format(ISO_OFFSET_FORMAT),
      startTime: values.changeDateTime?.[0]?.startTime,
      endTime: values.changeDateTime?.[0]?.endTime,
      type: 'changeDate',
      day: WEEKDAYS[moment(values.changeDate?.date).weekday()],
    };

    const newExceptions = {
      ...exceptions,
      changedDays: [...exceptions.changedDays, newChangeDateException],
    };

    form.change('changeDate', null);
    form.change('changeDateTime', null);
    form.change('exceptions', newExceptions);

    setIsChangeDayModalOpen(false);
  };

  const handleRemoveDays = () => {
    const newRemoveDateExceptions = values.removeDates.map(date => ({
      date: moment(date).format(ISO_OFFSET_FORMAT),
      type: 'removeDate',
      day: WEEKDAYS[moment(date).weekday()],
    }));

    const newExceptions = {
      ...exceptions,
      removedDays: [...exceptions.removedDays, ...newRemoveDateExceptions],
    };

    form.change('removeDates', []);
    form.change('exceptions', newExceptions);

    setIsRemoveDayModalOpen(false);
  };

  const handleRemoveException = exception => {
    const { type, date } = exception;

    let exceptionKey = null;
    switch (type) {
      case 'addDate':
        exceptionKey = 'addedDays';
        break;
      case 'removeDate':
        exceptionKey = 'removedDays';
        break;
      case 'changeDate':
        exceptionKey = 'changedDays';
        break;
      default:
        break;
    }

    const newExceptions = {
      ...exceptions,
      [exceptionKey]: exceptions[exceptionKey].filter(e => e.date !== date),
    };

    form.change('exceptions', newExceptions);
  };

  const exceptionCount = Object.values(exceptions).reduce((acc, curr) => {
    return acc + curr.length;
  }, 0);
  const exceptionsTooltipText = (
    <div>
      <p>
        <FormattedMessage id="CareScheduleExceptions.exceptionTooltip" />
      </p>
    </div>
  );

  return (
    <section className={css.section}>
      <h2 className="mb-6">Add, change, or remove a date.</h2>
      <div className={css.exceptionButtonContainer}>
        {exceptionCount <= MAX_EXCEPTIONS_COUNT ? (
          <PrimaryButton
            className={css.addExceptionButton}
            onClick={() => setIsAddDayModalOpen(true)}
            type="button"
            disabled={!startDate || disabled}
          >
            Add
          </PrimaryButton>
        ) : null}
        <Button
          className={css.addExceptionButton}
          onClick={() => setIsChangeDayModalOpen(true)}
          type="button"
          disabled={!startDate || disabled}
        >
          Change
        </Button>
        <Button
          className={classNames(css.addExceptionButton, css.removeButton)}
          onClick={() => setIsRemoveDayModalOpen(true)}
          type="button"
          disabled={!startDate || disabled}
        >
          Remove
        </Button>
      </div>
      <header className={css.sectionHeader}>
        <h2 className={css.sectionTitle}>
          <FormattedMessage
            id="AvailabilityPlanExceptions.availabilityExceptionsTitle"
            values={{ count: exceptionCount }}
          />
          <InfoTooltip title={exceptionsTooltipText} />
        </h2>
      </header>
      <div className={css.exceptions}>
        {sortedExceptions.map(exception => {
          const onRemoveException = () => handleRemoveException(exception);

          const isDisabled = disabled || moment(firstAvailableDate).isAfter(exception.date);

          return (
            <BookingException
              {...exception}
              onRemoveException={isDisabled ? null : onRemoveException}
              key={exception.date}
              className={css.exception}
            />
          );
        })}
      </div>
      {onManageDisableScrolling && isAddDayModalOpen ? (
        <Modal
          id="AddDayException"
          isOpen={isAddDayModalOpen}
          onClose={() => {
            form.change('addDate', null);
            form.change('addDateTime', null);
            setIsAddDayModalOpen(false);
          }}
          onManageDisableScrolling={onManageDisableScrolling}
          containerClassName={css.modalContent}
          usePortal
        >
          <p className={css.modalTitle}>Add a day to your booking</p>
          <FieldDateInput
            name="addDate"
            id="addDate"
            className={css.fieldDateInput}
            label="What is the date you want to add?"
            placeholderText={intl.formatDate(TODAY, dateFormattingOptions)}
            format={formatFieldDateInput(timezone)}
            parse={parseFieldDateInput(timezone)}
            isDayBlocked={filterAvailableAddExceptionDays({
              bookedDays,
              bookedDates,
              endDate: endDate?.date || endDate,
              weekdays,
              exceptions,
              firstAvailableDate,
            })}
            useMobileMargins
            showErrorMessage={false}
            onFocus={() => setIsDateInputFocused(true)}
            onBlur={() => setIsDateInputFocused(false)}
            initialVisibleMonth={() => moment(firstAvailableDate)}
          />
          {values.addDate && !isDateInputFocused ? (
            <div className={css.selectAddTimes}>
              <label>For what times?</label>
              <DailyPlan
                dayOfWeek="addDateTime"
                values={values}
                intl={intl}
                multipleTimesDisabled
                customName={moment(values.addDate.date).format(
                  isMobile ? 'ddd, MMM Do' : 'dddd, MMMM Do'
                )}
                className={css.addedDailyPlan}
              />
            </div>
          ) : null}
          <Button
            className={css.modalButton}
            onClick={handleAddDate}
            type="button"
            disabled={!values.addDate || !values.addDateTime}
          >
            Add Date
          </Button>
        </Modal>
      ) : null}
      {onManageDisableScrolling && isChangeDayModalOpen ? (
        <Modal
          id="ChangeDayException"
          isOpen={isChangeDayModalOpen}
          onClose={() => {
            form.change('changeDate', null);
            form.change('changeDateTime', null);
            setIsChangeDayModalOpen(false);
          }}
          onManageDisableScrolling={onManageDisableScrolling}
          usePortal
          containerClassName={css.modalContent}
        >
          <p className={css.modalTitle}>Change a day in your booking</p>
          <FieldDateInput
            name="changeDate"
            id="changeDate"
            className={css.fieldDateInput}
            label="Which date do you want to change?"
            placeholderText={intl.formatDate(TODAY, dateFormattingOptions)}
            format={formatFieldDateInput(timezone)}
            parse={parseFieldDateInput(timezone)}
            isDayBlocked={filterAvailableChangeExceptionDays(
              endDate?.date || endDate,
              weekdays,
              exceptions,
              firstAvailableDate
            )}
            useMobileMargins
            showErrorMessage={false}
            onFocus={() => setIsDateInputFocused(true)}
            onBlur={() => setIsDateInputFocused(false)}
            initialVisibleMonth={() => moment(firstAvailableDate)}
          />
          {values.changeDate && !isDateInputFocused ? (
            <div className={css.selectAddTimes}>
              <label>To what times?</label>
              <DailyPlan
                dayOfWeek="changeDateTime"
                values={values}
                intl={intl}
                multipleTimesDisabled
                customName={moment(values.changeDate.date).format(
                  isMobile ? 'ddd, MMM Do' : 'dddd, MMMM Do'
                )}
                className={css.addedDailyPlan}
              />
            </div>
          ) : null}
          <Button
            className={css.modalButton}
            onClick={handleChangeDate}
            type="button"
            disabled={!values.changeDate || !values.changeDateTime}
          >
            Add Date
          </Button>
        </Modal>
      ) : null}
      {onManageDisableScrolling && isRemoveDayModalOpen ? (
        <Modal
          id="RemoveDayException"
          isOpen={isRemoveDayModalOpen}
          onClose={() => {
            form.change('removeDates', null);
            setIsRemoveDayModalOpen(false);
          }}
          onManageDisableScrolling={onManageDisableScrolling}
          usePortal
          contentClassName={css.modalContent}
        >
          <p className={css.modalTitle}>Remove day(s) from your booking</p>
          <FieldDatePicker
            className={css.datePicker}
            name="removeDates"
            id="removeDates"
            highlightedClassName={css.highlightedRemoveDay}
            isDayDisabled={filterRemoveExceptionsDays({
              endDate: endDate?.date || endDate,
              weekdays,
              firstAvailableDate,
              exceptions,
              bookedDates,
              bookedDays,
            })}
            initialMonth={moment(firstAvailableDate)}
          />
          <p className={css.daysToRemove}>Days To Remove From Booking</p>
          <ul className={css.removeDateList}>
            {values.removeDates?.map(date => (
              <li key={date}>{moment(date).format('dddd, MMM DD')}</li>
            ))}
          </ul>
          <Button
            className={css.modalButton}
            onClick={handleRemoveDays}
            type="button"
            disabled={!values.removeDates || values.removeDates?.length === 0}
          >
            Remove Dates
          </Button>
        </Modal>
      ) : null}
    </section>
  );
};

export default BookingExceptions;
