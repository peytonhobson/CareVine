import React, { useMemo, useState } from 'react';

import { Button, Form, PrimaryButton, FieldDateInput } from '../../..';
import moment from 'moment';
import RefundBookingSummaryCard from '../../../BookingSummaryCard/Refund/RefundBookingSummaryCard';
import { formatFieldDateInput, parseFieldDateInput } from '../../../../util/dates';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import { useCheckMobileScreen } from '../../../../util/hooks';
import classNames from 'classnames';
import { TRANSITION_REQUEST_BOOKING } from '../../../../util/transaction';
import { ISO_OFFSET_FORMAT, WEEKDAYS } from '../../../../util/constants';
import { checkIsBlockedDay, checkIsDateInBookingSchedule } from '../../../../util/bookings';

import css from '../BookingCardModals.module.css';

const MODIFY_SCHEDULE_ACTIONS = 'modifyScheduleActions';

const filterAvailableBookingEndDates = ({
  bookingSchedule,
  exceptions,
  bookedDates,
  bookedDays,
  oldEndDate,
  endDateCharged,
}) => date => {
  // If current end date is in charged line items, all dates after should be unavailable.
  // This ensures if a user extends the end date that we don't have to deal with the additional
  // charges that finish out their charged line items.
  const isCharged = endDateCharged && moment(date).isAfter(oldEndDate, 'day');
  const isDayBlocked = checkIsBlockedDay({ date, bookedDays, bookedDates });
  const isInScheduledDays = checkIsDateInBookingSchedule(date, bookingSchedule, exceptions);
  const isInPast = moment(date).isBefore(TODAY, 'day');
  const isCurrentEndDate = moment(date).isSame(oldEndDate, 'day');

  return isDayBlocked || !isInScheduledDays || isInPast || isCurrentEndDate || isCharged;
};

const TODAY = new Date();
// Date formatting used for placeholder texts:
const dateFormattingOptions = { month: 'short', day: 'numeric', weekday: 'short' };

const renderDayContents = ({
  isMobile,
  bookingSchedule,
  exceptions,
  bookedDates,
  bookedDays,
  oldEndDate,
  endDateCharged,
}) => (date, classes) => {
  const isCharged = endDateCharged && moment(date).isAfter(oldEndDate, 'day');
  const isInBookingSchedule = checkIsDateInBookingSchedule(date, bookingSchedule, exceptions);
  const isInPast = moment(date).isBefore(TODAY, 'day');
  const isDayBlocked = checkIsBlockedDay({ date, bookedDays, bookedDates });
  const isCurrentEndDate = moment(date).isSame(oldEndDate, 'day');

  if (classes.has('selected') && isMobile) {
    return <div className={css.mobileSelectedDay}>{date.format('D')}</div>;
  }

  const available =
    isInBookingSchedule && !isInPast && !isDayBlocked && !isCurrentEndDate && !isCharged;

  return (
    <span
      className={classNames(
        available ? 'text-light cursor-pointer hover:bg-light hover:text-primary px-3 py-1' : null,
        isCurrentEndDate ? 'text-success' : null
      )}
    >
      {date.format('D')}
    </span>
  );
};

const ChangeEndDateForm = props => (
  <FinalForm
    {...props}
    render={formRenderProps => {
      const [showInvalidError, setShowInvalidError] = useState(false);
      const {
        handleSubmit,
        intl,
        booking,
        updateBookingEndDateInProgress,
        updateBookingEndDateError,
        updateBookingEndDateSuccess,
        onGoBack,
        values,
        pristine,
      } = formRenderProps;
      const selectedEndDate = values.endDate?.date;
      const formattedEndDate = moment(selectedEndDate).format('MMMM Do');

      const onSubmit = e => {
        e.preventDefault();
        if (!values.endDate?.date) {
          setShowInvalidError(true);
          return;
        }

        handleSubmit(e);
      };

      const txId = booking.id.uuid;
      const {
        chargedLineItems = [],
        endDate: oldEndDate = moment()
          .add(10, 'years')
          .format(ISO_OFFSET_FORMAT),
        bookingSchedule,
        exceptions,
        awaitingModification = {},
      } = booking.attributes.metadata;
      const providerDisplayName = booking?.provider?.attributes?.profile?.displayName;

      const { listing } = booking;
      const timezone = listing.attributes.publicData.availabilityPlan?.timezone;
      const { bookedDates = [], bookedDays = [] } = booking.listing.attributes.metadata;
      const filteredBookedDays = useMemo(() => bookedDays.filter(d => d.txId !== txId), [
        bookedDays,
      ]);

      const isMobile = useCheckMobileScreen();

      const submitInProgress = updateBookingEndDateInProgress;
      const submitDisabled = updateBookingEndDateInProgress || updateBookingEndDateSuccess;
      const submitReady = updateBookingEndDateSuccess;

      const awaitingModificationTypes = Object.keys(awaitingModification);
      const requestedEndDate = awaitingModification?.endDate;

      const lastTransition = booking.attributes.lastTransition;
      const isRequest = lastTransition === TRANSITION_REQUEST_BOOKING;

      const hasRefund = useMemo(
        () =>
          selectedEndDate
            ? chargedLineItems.some(item =>
                item.lineItems?.some(i => moment(i.date).isAfter(moment(selectedEndDate)))
              )
            : false,
        [selectedEndDate, chargedLineItems]
      );

      // Used to determine if the user can select future end dates to change to
      const endDateCharged = useMemo(() =>
        oldEndDate
          ? chargedLineItems
              .map(item => item.lineItems?.map(i => i.date))
              .flat()
              .some(d => moment(d).isSame(oldEndDate, 'day'))
          : false[(chargedLineItems, oldEndDate)]
      );

      const startOfSelectedDay = moment(selectedEndDate).startOf('day');
      const threeDaysFromNow = moment().add(3, 'days');
      const expiration = moment(startOfSelectedDay).isAfter(threeDaysFromNow)
        ? threeDaysFromNow.format('MMMM Do')
        : startOfSelectedDay.format('MMMM Do');
      const expirationTime = moment(startOfSelectedDay).isAfter(threeDaysFromNow)
        ? moment(expiration).format('h:mm a')
        : startOfSelectedDay.format('h:mm a');
      const futureDateSelected =
        selectedEndDate && moment(selectedEndDate).isAfter(oldEndDate, 'day');

      const hasPendingRequest = awaitingModificationTypes.length > 0;
      const hasPendingEndDatesRequest =
        awaitingModificationTypes.length === 1 && awaitingModificationTypes[0] === 'endDate';

      return (
        <Form onSubmit={onSubmit}>
          <FieldDateInput
            name="endDate"
            id="endDate"
            className={css.fieldDateInput}
            label="New End Date"
            placeholderText={intl.formatDate(TODAY, dateFormattingOptions)}
            format={formatFieldDateInput(timezone)}
            parse={parseFieldDateInput(timezone)}
            isDayBlocked={filterAvailableBookingEndDates({
              bookingSchedule,
              exceptions,
              bookedDates,
              bookedDays: filteredBookedDays,
              oldEndDate,
              endDateCharged,
            })}
            useMobileMargins
            showErrorMessage={false}
            renderDayContents={renderDayContents({
              isMobile,
              bookingSchedule,
              exceptions,
              bookedDates,
              bookedDays: filteredBookedDays,
              oldEndDate,
              endDateCharged,
            })}
            withPortal={isMobile}
            disabled={
              awaitingModificationTypes.length > 1 && awaitingModificationTypes[0] !== 'endDate'
            }
          />
          {selectedEndDate ? (
            <>
              {futureDateSelected && !isRequest ? (
                <p className={classNames(css.dropAnimation, css.modalMessage, 'text-primary')}>
                  When you click 'Submit', a request to change your booking end date to{' '}
                  {formattedEndDate} will be sent to {providerDisplayName}. They have until{' '}
                  {expiration} at {expirationTime} to accept or decline. If they respond or the
                  request expires, you will be notified.
                </p>
              ) : (
                <p className={classNames(css.dropAnimation, css.modalMessage, 'text-primary')}>
                  By clicking 'Submit', the end date of your booking will be changed to{' '}
                  {formattedEndDate}. You will not be charged for any time after this date.
                </p>
              )}
              {hasRefund ? (
                <div className={css.dropAnimation}>
                  <p className={css.modalMessage}>
                    Once your booking is complete, you will be refunded according to the table
                    below:
                  </p>
                  <RefundBookingSummaryCard
                    booking={booking}
                    className="mt-6 rounded-[var(--borderRadius)] border-anti pt-8 border"
                    hideAvatar
                    subHeading="Refund Summary"
                    cancelDate={selectedEndDate}
                  />
                </div>
              ) : null}
            </>
          ) : null}
          {updateBookingEndDateError ? (
            <p className="text-error">Failed to update booking schedule. Please try again.</p>
          ) : null}
          {endDateCharged ? (
            <p className="text-error text-center text-xs">
              *Please Note: You cannot select a future date because your current end date has
              already been charged.
            </p>
          ) : null}
          {hasPendingEndDatesRequest && !selectedEndDate ? (
            <p className={classNames(css.dropAnimation, 'text-primary')}>
              You already have a pending request to change your booking end date to{' '}
              {moment(requestedEndDate).format('MMMM Do')}. By clicking 'Submit', you will cancel
              that request and create a new one.
            </p>
          ) : null}
          {hasPendingRequest ? (
            <p className="text-error text-center">
              You cannot change your end date because you have a pending request to modify your
              booking schedule. Please allow the caregiver to accept or decline that request before
              changing your end date.
            </p>
          ) : null}
          {showInvalidError ? (
            <p className="text-error text-center">Please select a date.</p>
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
              inProgress={submitInProgress}
              className="w-auto ml-4 px-6 min-w-[10rem]"
              ready={submitReady}
              disabled={submitDisabled}
              type="submit"
            >
              Submit
            </PrimaryButton>
          </div>
        </Form>
      );
    }}
  />
);

export default ChangeEndDateForm;
