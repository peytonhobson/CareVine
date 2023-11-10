import React, { useMemo, useState } from 'react';

import { Button, Form, PrimaryButton, DailyPlan } from '../../..';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import { WEEKDAYS } from '../../../../util/constants';
import {
  getUnavailableDays,
  mapWeekdays,
  findNextWeekStartTime,
  checkIsDateInBookingSchedule,
} from '../../../../util/bookings';
import arrayMutators from 'final-form-arrays';
import moment from 'moment';
import css from '../BookingCardModals.module.css';
import classNames from 'classnames';
import WarningIcon from '@mui/icons-material/Warning';
import ModifyScheduleSubmissionModal from './ModifyScheduleSubmissionModal';
import {
  TRANSITION_ACCEPT_BOOKING,
  TRANSITION_REQUEST_BOOKING,
  TRANSITION_ACCEPT_UPDATE_START,
  TRANSITION_REQUEST_UPDATE_START,
} from '../../../../util/transaction';
import FieldChangeEndDate from '../FieldChangeEndDate/FieldChangeEndDate';
import UnapplicableExceptions from '../UnapplicableExceptions/UnapplicableExceptions';
import { isEqual } from 'lodash';

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
  if (chargedLineItems.length === 0 && ledger.length === 0) return moment(startDate);

  const combinedItems = [...chargedLineItems, ...ledger];
  const lastLineItems = combinedItems.reduce(findLastLineItems, []);
  const nextWeekStartTime = findNextWeekStartTime(lastLineItems, weekdays, exceptions);

  return nextWeekStartTime.startOf('day');
};

const findNewExceptions = (unapplicableExceptions, exceptions) => {
  return Object.keys(exceptions).reduce((acc, key) => {
    const newExceptions = exceptions[key].filter(
      e => !unapplicableExceptions?.some(u => moment(u.date).isSame(e.date, 'day'))
    );

    return {
      ...acc,
      [key]: newExceptions,
    };
  }, {});
};

const ModifyScheduleRecurringForm = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={formRenderProps => {
      const [showSelectDaysError, setShowSelectDaysError] = useState(false);
      const [showEndDateError, setShowEndDateError] = useState(false);
      const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
      const [showSameScheduleError, setShowSameScheduleError] = useState(false);
      const {
        handleSubmit,
        onGoBack,
        values,
        booking,
        intl,
        onManageDisableScrolling,
        updateRequestedBookingInProgress,
        updateRequestedBookingError,
        updateRequestedBookingSuccess,
        requestBookingScheduleChangeInProgress,
        requestBookingScheduleChangeError,
        requestBookingScheduleChangeSuccess,
        form,
        onCloseFully,
      } = formRenderProps;

      const weekdays = mapWeekdays(values);

      const txId = booking.id.uuid;
      const {
        endDate,
        exceptions,
        chargedLineItems = [],
        startDate,
        ledger = [],
        awaitingModification = {},
      } = booking.attributes.metadata;
      const { listing, provider } = booking;
      const { bookedDates = [], bookedDays = [] } = listing.attributes.metadata;
      const filteredBookedDays = bookedDays.filter(d => d.txId !== txId);

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

      const firstPossibleDate = lastChargedDate
        ? moment(lastChargedDate)
            .endOf('week')
            .add(1, 'day')
        : moment(startDate).isAfter()
        ? startDate
        : moment();

      const unavailableDays = useMemo(
        () =>
          getUnavailableDays({
            bookedDays: filteredBookedDays,
            startDate: firstPossibleDate,
            endDate: values.endDate?.date || endDate,
            bookedDates,
            weekdays: FULL_BOOKING_SCHEDULE,
          }),
        [filteredBookedDays, appliedDate, endDate, bookedDates, firstPossibleDate, values.endDate]
      );

      const lastTransition = booking.attributes.lastTransition;
      const isRequest =
        lastTransition === TRANSITION_REQUEST_BOOKING ||
        lastTransition === TRANSITION_REQUEST_UPDATE_START;
      const notYetCharged =
        isRequest ||
        lastTransition === TRANSITION_ACCEPT_BOOKING ||
        lastTransition === TRANSITION_ACCEPT_UPDATE_START;
      const usedStates = isRequest
        ? {
            inProgress: updateRequestedBookingInProgress,
            error: updateRequestedBookingError,
            success: updateRequestedBookingSuccess,
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

        if (isEqual(weekdays, booking.attributes.metadata.bookingSchedule)) {
          setShowSameScheduleError(true);
        }

        setIsSubmissionModalOpen(true);
      };

      const handleChange = () => {
        setShowSelectDaysError(false);
        setShowEndDateError(false);
      };

      const newExceptions = findNewExceptions(values.unapplicableExceptions, exceptions);
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

      const awaitingModificationType = awaitingModification?.type;
      const hasPendingBookingScheduleRequest = awaitingModificationType === 'bookingSchedule';
      const hasPendingRequest = awaitingModificationType;
      const requestDisabled = hasPendingRequest && !hasPendingBookingScheduleRequest;

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
                  disabled={
                    unavailableDays?.includes(w) ||
                    (hasPendingRequest && !hasPendingBookingScheduleRequest)
                  }
                  className={css.dailyPlan}
                  noClose={
                    (startDateWeekday === w && notYetCharged) ||
                    (hasPendingRequest && !hasPendingBookingScheduleRequest)
                  }
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
              <FieldChangeEndDate
                intl={intl}
                className={css.fieldDateInput}
                booking={booking}
                appliedDate={appliedDate}
                weekdays={weekdays}
              />
            </div>
          ) : null}
          <UnapplicableExceptions
            weekdays={weekdays}
            exceptions={exceptions}
            form={form}
            endDate={values.endDate?.date || endDate}
            appliedDate={appliedDate}
          />
          {showSelectDaysError ? (
            <p className="text-error text-center">Please select at least one day.</p>
          ) : null}
          {showEndDateError ? (
            <p className="text-error text-center">Please select an end date.</p>
          ) : null}
          {showSameScheduleError ? (
            <p className="text-error text-center">
              You have not made any changes to your schedule. Please make changes to continue.
            </p>
          ) : null}
          {requestDisabled ? (
            <p className="text-error">
              You cannot change your booking schedule because you have another pending request to
              modify your booking. Please allow the caregiver to accept or decline that request
              before changing your booking schedule.
            </p>
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
              disabled={requestDisabled || submitDisabled}
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
            submitDisabled={submitDisabled || requestDisabled}
            provider={provider}
            listing={listing}
            newBooking={newBooking}
            appliedDate={appliedDate}
            lastChargedDate={lastChargedDate}
            onSubmit={handleSubmit}
            error={usedStates.error}
            onCloseFully={onCloseFully}
          />
        </Form>
      );
    }}
  />
);

export default ModifyScheduleRecurringForm;
