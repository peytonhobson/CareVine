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
import { WEEKDAY_MAP, WEEKDAYS } from '../../util/constants';
import moment from 'moment';
import { pick } from 'lodash';
import { useCheckMobileScreen } from '../../util/hooks';
import { sortExceptionsByDate } from '../../util/bookings';

import css from './BookingExceptions.module.css';

const filterAvailableAddExceptionDays = (
  bookedDays,
  bookedDates,
  startDate,
  endDate,
  weekdays,
  exceptions
) => date => {
  const day = date.day();
  const realDate = date.startOf('day');
  const isBookedDay = bookedDays.some(
    d =>
      d.days.some(dd => WEEKDAY_MAP[dd] === day) &&
      (!d.endDate || realDate <= new Date(d.endDate)) &&
      realDate >= new Date(d.startDate)
  );
  const isBookedDate = bookedDates.some(d => d === realDate.toISOString());
  const isAlreadySelected = weekdays[WEEKDAYS[day]];
  const isAlreadyException = Object.values(exceptions)
    .flat()
    .some(e => e.date === realDate.toISOString());

  return (
    (endDate && date > endDate) ||
    isBookedDay ||
    isBookedDate ||
    realDate < startDate ||
    isAlreadySelected ||
    isAlreadyException
  );
};

const filterAvailableChangeExceptionDays = (
  startDate,
  endDate,
  weekdays,
  exceptions,
  bookedDays,
  bookedDates
) => date => {
  const realDate = date.startOf('day');
  const day = date.day();
  const isAlreadyException = Object.values(exceptions)
    .flat()
    .some(e => e.date === date.toISOString());
  const isAlreadySelected =
    weekdays[WEEKDAYS[date.day()]] &&
    startDate.date <= realDate &&
    (!endDate?.date || endDate.date >= realDate);

  const isBookedDay = bookedDays.some(
    d =>
      d.days.some(dd => WEEKDAY_MAP[dd] === day) &&
      (!d.endDate || realDate <= new Date(d.endDate)) &&
      realDate >= new Date(d.startDate)
  );
  const isBookedDate = bookedDates.some(d => d === realDate.toISOString());

  return isAlreadyException || !isAlreadySelected || isBookedDay || isBookedDate;
};

const renderChangeDayContents = (bookedDays, bookedDates) => (date, classes) => {
  const realDate = date.startOf('day');
  const day = date.day();
  const isBookedDay = bookedDays?.some(
    d =>
      d.days.some(dd => WEEKDAY_MAP[dd] === day) &&
      (!d.endDate || realDate <= new Date(d.endDate)) &&
      realDate >= new Date(d.startDate)
  );
  const isBookedDate = bookedDates?.some(d => d === realDate.toISOString());

  const isBlocked = classes.has('blocked');

  return isBookedDay || isBookedDate ? (
    <div style={{ color: 'var(--failColor)' }}>{date.format('D')}</div>
  ) : (
    <span className={!isBlocked && css.regularDay}>{date.format('D')}</span>
  );
};

const TODAY = new Date();
// Date formatting used for placeholder texts:
const dateFormattingOptions = { month: 'short', day: 'numeric', weekday: 'short' };

const MAX_EXCEPTIONS_COUNT = 100;

const BookingExceptions = props => {
  const { bookedDates, bookedDays, values, onManageDisableScrolling, intl, timezone, form } = props;

  const isMobile = useCheckMobileScreen();

  const {
    exceptions = {
      removedDays: [],
      addedDays: [],
      changedDays: [],
    },
    startDate,
    endDate,
  } = values;

  const sortedExceptions = Object.values(exceptions)
    .flat()
    .sort(sortExceptionsByDate);

  const weekdays = pick(values, WEEKDAYS);

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
  }, [startDate, endDate]);

  useEffect(() => {
    //Remove all exceptions that interfere with weekdays
    const weekdayKeys = Object.keys(weekdays);
    const newExceptions = {
      ...exceptions,
      removedDays: exceptions.removedDays.filter(d =>
        weekdayKeys.includes(WEEKDAYS[moment(d.date).day()])
      ),
      addedDays: exceptions.addedDays.filter(
        d => !weekdayKeys.includes(WEEKDAYS[moment(d.date).day()])
      ),
      changedDays: exceptions.changedDays.filter(d =>
        weekdayKeys.includes(WEEKDAYS[moment(d.date).day()])
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
      date: values.addDate?.date.toISOString(),
      startTime: values.addDateTime?.[0]?.startTime,
      endTime: values.addDateTime?.[0]?.endTime,
      type: 'addDate',
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
      date: values.changeDate?.date.toISOString(),
      startTime: values.changeDateTime?.[0]?.startTime,
      endTime: values.changeDateTime?.[0]?.endTime,
      type: 'changeDate',
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
      date: date.toISOString(),
      type: 'removeDate',
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

  const currentBookedDays = {
    days: Object.keys(weekdays),
    startDate: startDate?.date,
    endDate: endDate?.date,
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
      <div className={css.exceptionButtonContainer}>
        {exceptionCount <= MAX_EXCEPTIONS_COUNT ? (
          <PrimaryButton
            className={css.addExceptionButton}
            onClick={() => setIsAddDayModalOpen(true)}
            type="button"
            disabled={!values.startDate}
          >
            Add Day
          </PrimaryButton>
        ) : null}
        <Button
          className={css.addExceptionButton}
          onClick={() => setIsChangeDayModalOpen(true)}
          type="button"
          disabled={!values.startDate}
        >
          Change Day
        </Button>
        <Button
          className={classNames(css.addExceptionButton, css.removeButton)}
          onClick={() => setIsRemoveDayModalOpen(true)}
          type="button"
          disabled={!values.startDate}
        >
          Remove Day
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
          return (
            <BookingException
              {...exception}
              onRemoveException={() => handleRemoveException(exception)}
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
            isDayBlocked={filterAvailableAddExceptionDays(
              bookedDays,
              bookedDates,
              startDate?.date,
              endDate?.date,
              weekdays,
              exceptions
            )}
            useMobileMargins
            showErrorMessage={false}
            renderDayContents={renderChangeDayContents(bookedDays, bookedDates)}
            onFocus={() => setIsDateInputFocused(true)}
            onBlur={() => setIsDateInputFocused(false)}
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
              startDate,
              endDate,
              weekdays,
              exceptions,
              bookedDays,
              bookedDates
            )}
            useMobileMargins
            showErrorMessage={false}
            renderDayContents={renderChangeDayContents(bookedDays, bookedDates)}
            onFocus={() => setIsDateInputFocused(true)}
            onBlur={() => setIsDateInputFocused(false)}
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
            currentBookedDays={currentBookedDays}
            name="removeDates"
            id="removeDates"
            highlightedClassName={css.highlightedRemoveDay}
            bookedDates={sortedExceptions.map(exception => exception.date).concat(bookedDates)}
            bookedDays={bookedDays}
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
