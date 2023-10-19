import React, { useMemo, useState, useEffect } from 'react';

import { Button, Form, PrimaryButton, DailyPlan, FieldDateInput, BookingException } from '../../..';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import { WEEKDAYS } from '../../../../util/constants';
import {
  getUnavailableDays,
  mapWeekdays,
  checkIsBlockedDay,
  findNextWeekStartTime,
  checkIsDateInBookingSchedule,
} from '../../../../util/bookings';
import arrayMutators from 'final-form-arrays';
import moment from 'moment';
import css from '../BookingCardModals.module.css';
import { useCheckMobileScreen } from '../../../../util/hooks';
import classNames from 'classnames';
import { formatFieldDateInput, parseFieldDateInput } from '../../../../util/dates';
import WarningIcon from '@mui/icons-material/Warning';
import ModifyScheduleSubmissionModal from './ModifyScheduleSubmissionModal';
import {
  TRANSITION_ACCEPT_BOOKING,
  TRANSITION_REQUEST_BOOKING,
  TRANSITION_ACCEPT_UPDATE_START,
} from '../../../../util/transaction';

const MODIFY_SCHEDULE_ACTIONS = 'modifyScheduleActions';

const FULL_BOOKING_SCHEDULE = [
  {
    dayOfWeek: 'sun',
  },
  {
    dayOfWeek: 'mon',
  },
  {
    dayOfWeek: 'tue',
  },
  {
    dayOfWeek: 'wed',
  },
  {
    dayOfWeek: 'thu',
  },
  {
    dayOfWeek: 'fri',
  },
  {
    dayOfWeek: 'sat',
  },
];

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
}) => date => {
  const isInBookingSchedule = checkIsDateInBookingSchedule(date, bookingSchedule, exceptions);
  const isBeforeApplied = moment(date).isBefore(appliedDate, 'day');
  const isDayBlocked = checkIsBlockedDay({ date, bookedDays, bookedDates });
  const afterFirstBlockedDate = moment(date).isAfter(firstBlockedDay, 'day');

  return isDayBlocked || !isInBookingSchedule || isBeforeApplied || afterFirstBlockedDate;
};

const renderDayContents = ({
  isMobile,
  bookingSchedule,
  exceptions,
  bookedDates,
  bookedDays,
  appliedDate,
  firstBlockedDay,
}) => (date, classes) => {
  const available = !filterAvailableBookingEndDates({
    bookingSchedule,
    exceptions,
    bookedDates,
    bookedDays,
    appliedDate,
    firstBlockedDay,
  })(date);

  if (classes.has('selected') && isMobile) {
    return <div className={css.mobileSelectedDay}>{date.format('D')}</div>;
  }

  return (
    <span
      className={classNames(
        available ? 'text-light cursor-pointer hover:bg-light hover:text-primary px-3 py-1' : null
      )}
    >
      {date.format('D')}
    </span>
  );
};

const needsNewEndDate = (weekdays = [], exceptions, endDate, appliedDate) => {
  if (!endDate || !weekdays.length) return false;

  const isDateInBookingSchedule = checkIsDateInBookingSchedule(endDate, weekdays, exceptions);

  return !isDateInBookingSchedule || moment(endDate).isBefore(appliedDate, 'day');
};

const sortByDate = (a, b) => moment(a.date).diff(b.date);

const findLastLineItems = (acc, curr) => {
  const currLineItems = curr.lineItems;

  const sortedLineItems = currLineItems.sort(sortByDate);

  if (acc.length === 0) return sortedLineItems;

  const lastCurrentDate = sortedLineItems[sortedLineItems.length - 1].date;
  const lastAccDate = acc[acc.length - 1].date;

  return moment(lastCurrentDate).isAfter(lastAccDate) ? sortedLineItems : acc;
};

const findChangeAppliedDate = (
  chargedLineItems = [],
  weekdays,
  exceptions,
  startDate,
  ledger = []
) => {
  if (chargedLineItems.length === 0 && ledger.length === 0) moment(startDate);

  const combinedItems = [...chargedLineItems, ...ledger];
  const lastLineItems = combinedItems.reduce(findLastLineItems, []);
  const nextWeekStartTime = findNextWeekStartTime(lastLineItems, weekdays, exceptions);

  return nextWeekStartTime.startOf('day');
};

const findNewExceptions = (unapplicableExceptions, exceptions) => {
  return Object.keys(exceptions).reduce((acc, key) => {
    const newExceptions = exceptions[key].filter(
      e => !unapplicableExceptions.some(u => moment(u.date).isSame(e.date, 'day'))
    );

    return {
      ...acc,
      [key]: newExceptions,
    };
  }, {});
};

const findUnapplicableExceptions = (exceptions, weekdays, endDate, appliedDate) =>
  Object.values(exceptions)
    .flat()
    .filter(e => {
      const isDateInBookingSchedule = checkIsDateInBookingSchedule(e.date, weekdays);
      const isAfterEndDate = endDate ? moment(e.date).isAfter(endDate, 'day') : false;
      const isAfterAppliedDate = appliedDate ? moment(e.date).isAfter(appliedDate, 'day') : false;

      if (e.type === 'removeDate' || e.type === 'changeDate') {
        return (!isDateInBookingSchedule || isAfterEndDate) && isAfterAppliedDate;
      }

      if (e.type === 'addDate') {
        return (isDateInBookingSchedule || isAfterEndDate) && isAfterAppliedDate;
      }

      return false;
    });

const ModifyScheduleRecurringForm = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={formRenderProps => {
      const [showSelectDaysError, setShowSelectDaysError] = useState(false);
      const [showEndDateError, setShowEndDateError] = useState(false);
      const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
      const [currentEndDateMonth, setCurrentEndDateMonth] = useState(moment().startOf('month'));
      const [firstBlockedDay, setFirstBlockedDay] = useState(null);
      const {
        handleSubmit,
        onGoBack,
        values,
        booking,
        intl,
        onManageDisableScrolling,
        updateBookingScheduleInProgress,
        updateBookingScheduleError,
        updateBookingScheduleSuccess,
        requestBookingScheduleChangeInProgress,
        requestBookingScheduleChangeError,
        requestBookingScheduleChangeSuccess,
        form,
      } = formRenderProps;

      const weekdays = mapWeekdays(values);
      const isMobile = useCheckMobileScreen();

      const txId = booking.id.uuid;
      const {
        endDate,
        exceptions,
        chargedLineItems = [],
        startDate,
        ledger = [],
      } = booking.attributes.metadata;
      const { listing, provider } = booking;
      const { bookedDates = [], bookedDays = [] } = listing.attributes.metadata;
      const filteredBookedDays = bookedDays.filter(d => d.txId !== txId);
      const timezone = listing.attributes.publicData.availabilityPlan?.timezone;

      useEffect(() => {
        const firstBlockedDayInMonth = findFirstBlockedDateInSchedule(
          weekdays,
          exceptions,
          bookedDates,
          filteredBookedDays,
          currentEndDateMonth
        );

        if (!firstBlockedDay || moment(firstBlockedDayInMonth).isBefore(firstBlockedDay, 'day')) {
          setFirstBlockedDay(firstBlockedDayInMonth);
        }
      }, [
        JSON.stringify(weekdays),
        JSON.stringify(exceptions),
        JSON.stringify(bookedDates),
        JSON.stringify(filteredBookedDays),
        currentEndDateMonth,
      ]);

      useEffect(() => {
        setFirstBlockedDay(null);
      }, [JSON.stringify(weekdays)]);

      const appliedDate = useMemo(
        () =>
          weekdays.length
            ? findChangeAppliedDate(chargedLineItems, weekdays, exceptions, startDate, ledger)
            : null,
        [chargedLineItems, weekdays, exceptions, startDate, ledger]
      );
      const showEndDate = needsNewEndDate(weekdays, exceptions, endDate, appliedDate);
      const startDateWeekday = moment(startDate)
        .format('ddd')
        .toLowerCase();
      const startDateWeekdayLong = moment(startDate).format('dddd');
      const lastChargedDate = useMemo(
        () =>
          chargedLineItems
            .map(c => c.lineItems)
            .flat()
            .sort(sortByDate)
            .pop()?.date,
        [chargedLineItems]
      );
      const unapplicableExceptions = findUnapplicableExceptions(
        exceptions,
        weekdays,
        values.endDate?.date || endDate,
        appliedDate
      );

      useEffect(() => {
        form.change('unapplicableExceptions', unapplicableExceptions);
      }, [JSON.stringify(unapplicableExceptions)]);

      const firstPossibleDate = moment(lastChargedDate)
        .endOf('week')
        .add(1, 'day');
      const unavailableDays = useMemo(
        () =>
          getUnavailableDays({
            bookedDays: filteredBookedDays,
            startDate: appliedDate || firstPossibleDate,
            endDate: values.endDate?.date || endDate,
            bookedDates,
            weekdays: FULL_BOOKING_SCHEDULE,
          }),
        [filteredBookedDays, appliedDate, endDate, bookedDates, firstPossibleDate, values.endDate]
      );

      const lastTransition = booking.attributes.lastTransition;
      const isRequest = lastTransition === TRANSITION_REQUEST_BOOKING;
      const notYetCharged =
        isRequest ||
        lastTransition === TRANSITION_ACCEPT_BOOKING ||
        lastTransition === TRANSITION_ACCEPT_UPDATE_START;
      const usedStates = isRequest
        ? {
            inProgress: updateBookingScheduleInProgress,
            error: updateBookingScheduleError,
            success: updateBookingScheduleSuccess,
          }
        : {
            inProgress: requestBookingScheduleChangeInProgress,
            error: requestBookingScheduleChangeError,
            success: requestBookingScheduleChangeSuccess,
          };

      const submitInProgress = usedStates.inProgress;
      const submitDisabled = submitInProgress || usedStates.success;
      const submitReady = usedStates.success;

      const handleOpenSubmissionModal = () => {
        if (!weekdays.length) {
          setShowSelectDaysError(true);
          return;
        }

        if (showEndDate && !values.endDate?.date) {
          setShowEndDateError(true);
          return;
        }

        setIsSubmissionModalOpen(true);
      };

      const handleChange = () => {
        setShowSelectDaysError(false);
        setShowEndDateError(false);
      };

      const newExceptions = findNewExceptions(unapplicableExceptions, exceptions);
      const newBooking = {
        ...booking,
        attributes: {
          ...booking.attributes,
          metadata: {
            ...booking.attributes.metadata,
            bookingSchedule: weekdays,
            exceptions: newExceptions,
            endDate: values.endDate?.date || endDate,
            startDate: appliedDate,
          },
        },
      };

      return (
        <Form>
          <FormSpy subscription={{ values: true }} onChange={handleChange} />

          {unavailableDays.length ? (
            <p className={classNames(css.modalMessage, 'text-sm')}>
              Days with the <WarningIcon color="warning" fontSize="small" /> icon are unavailable.
              You will not be able to book these days.
            </p>
          ) : null}
          {notYetCharged ? (
            <p className={classNames(css.modalMessage, 'text-sm')}>
              You will be unable to remove {startDateWeekdayLong} from your schedule because it
              falls on your start date. If you wish to change this, please cancel this request and
              create a new one.
            </p>
          ) : null}
          <div className={css.week}>
            {WEEKDAYS.map(w => {
              return (
                <DailyPlan
                  dayOfWeek={w}
                  key={w}
                  values={values}
                  intl={intl}
                  multipleTimesDisabled
                  disabled={unavailableDays?.includes(w)}
                  className={css.dailyPlan}
                  noClose={startDateWeekday === w && notYetCharged}
                />
              );
            })}
          </div>
          {showEndDate ? (
            <div className={classNames(css.dropAnimation, 'mb-16')}>
              <h2 className="text-center">Change Your End Date</h2>
              {moment(endDate).isBefore(appliedDate, 'day') ? (
                <p className="text-sm">
                  You have already been charged for your current end date, (
                  {moment(endDate).format('MMMM Do')}). Please change your end date to a later date
                  to continue.
                </p>
              ) : (
                <p className="text-sm">
                  Your current end date ({moment(endDate).format('MMMM Do')}) no longer falls within
                  your selected schedule. Please select a new end date.
                </p>
              )}
              <FieldDateInput
                name="endDate"
                id="endDate"
                className={css.fieldDateInput}
                label="New End Date"
                placeholderText={intl.formatDate(TODAY, dateFormattingOptions)}
                format={formatFieldDateInput(timezone)}
                parse={parseFieldDateInput(timezone)}
                isDayBlocked={filterAvailableBookingEndDates({
                  bookingSchedule: weekdays,
                  exceptions,
                  bookedDates,
                  bookedDays: filteredBookedDays,
                  appliedDate,
                  firstBlockedDay,
                })}
                useMobileMargins
                showErrorMessage={false}
                renderDayContents={renderDayContents({
                  isMobile,
                  bookingSchedule: weekdays,
                  exceptions,
                  bookedDates,
                  bookedDays: filteredBookedDays,
                  appliedDate,
                  firstBlockedDay,
                })}
                withPortal={isMobile}
                onPrevMonthClick={m => setCurrentEndDateMonth(m.startOf('month'))}
                onNextMonthClick={m => setCurrentEndDateMonth(m.startOf('month'))}
              />
            </div>
          ) : null}
          {unapplicableExceptions.length && weekdays.length ? (
            <div className={css.dropAnimation}>
              <p className="text-sm">
                Based on your new schedule, the following exceptions are no longer applicable and
                will be removed from the booking:
              </p>
              <div className={classNames(css.exceptions, 'border-error')}>
                {unapplicableExceptions.map(exception => {
                  return (
                    <BookingException
                      {...exception}
                      key={exception.date}
                      className={classNames(css.exception, '!border-error')}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}
          {showSelectDaysError ? (
            <p className="text-error text-center">Please select at least one day.</p>
          ) : null}
          {showEndDateError ? (
            <p className="text-error text-center">Please select an end date.</p>
          ) : null}
          <div className={css.modalButtonContainer}>
            <Button
              onClick={() => onGoBack(MODIFY_SCHEDULE_ACTIONS)}
              className={css.modalButton}
              type="button"
            >
              Back
            </Button>
            <PrimaryButton
              className="w-auto ml-4 px-6 min-w-[10rem]"
              type="button"
              onClick={handleOpenSubmissionModal}
            >
              Continue
            </PrimaryButton>
          </div>
          <ModifyScheduleSubmissionModal
            isOpen={isSubmissionModalOpen}
            onClose={() => setIsSubmissionModalOpen(false)}
            onManageDisableScrolling={onManageDisableScrolling}
            weekdays={weekdays}
            values={values}
            setIsSubmissionModalOpen={setIsSubmissionModalOpen}
            submitInProgress={submitInProgress}
            submitReady={submitReady}
            submitDisabled={submitDisabled}
            provider={provider}
            listing={listing}
            newBooking={newBooking}
            appliedDate={appliedDate}
            lastChargedDate={lastChargedDate}
            onSubmit={handleSubmit}
            error={usedStates.error}
          />
        </Form>
      );
    }}
  />
);

export default ModifyScheduleRecurringForm;
