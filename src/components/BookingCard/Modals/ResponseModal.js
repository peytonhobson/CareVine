import React, { useMemo } from 'react';

import { compose } from 'redux';
import { connect } from 'react-redux';
import {
  Modal,
  CancelButton,
  PrimaryButton,
  SingleBookingSummaryCard,
  RecurringBookingSummaryCard,
} from '../..';
import { declineBooking, acceptBooking } from '../../../ducks/transactions.duck';
import { manageDisableScrolling } from '../../../ducks/UI.duck';
import {
  checkIsBlockedOneTime,
  checkIsBlockedRecurring,
  sortExceptionsByDate,
} from '../../../util/bookings';

import css from './BookingCardModals.module.css';

const ResponseModal = props => {
  const {
    isOpen,
    onClose,
    onManageDisableScrolling,
    acceptBookingError,
    customerDisplayName,
    booking,
    declineBookingError,
    declineBookingInProgress,
    declineBookingSuccess,
    acceptBookingSuccess,
    acceptBookingInProgress,
    onDeclineBooking,
    onAcceptBooking,
    bookingDates,
    allExceptions,
  } = props;

  const { listing } = booking;

  const {
    bookingSchedule,
    type: scheduleType,
    startDate,
    endDate,
    exceptions = {
      addedDays: [],
      removedDays: [],
      changedDays: [],
    },
    lastModified,
  } = booking.attributes.metadata;

  const hasSameDayBooking = useMemo(
    () =>
      (scheduleType === 'oneTime'
        ? checkIsBlockedOneTime({ dates: bookingDates, listing })
        : checkIsBlockedRecurring({
            bookingSchedule,
            startDate,
            endDate,
            exceptions,
            listing,
          })) && !(acceptBookingSuccess || acceptBookingInProgress),
    [bookingDates, listing, startDate, endDate, exceptions, scheduleType]
  );

  return isOpen ? (
    <Modal
      title="Respond to Booking"
      id="RespondModal"
      isOpen={isOpen}
      onClose={declineBookingSuccess || acceptBookingSuccess ? () => onClose(true) : onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
      containerClassName={css.modalContainer}
    >
      <p className={css.modalTitle}>Accept or Decline Booking with {customerDisplayName}</p>
      {lastModified && (
        <p className="text-error mt-2 mb-0">
          The employer has modified this booking from its original request.
        </p>
      )}
      {exceptions.length ? (
        <p className={classNames(css.modalMessage, 'text-error')}>
          This schedule contains exceptions. Please review the full schedule and exceptions before
          accepting.
        </p>
      ) : null}
      {scheduleType === 'oneTime' ? (
        <SingleBookingSummaryCard
          className="mt-6 rounded-standard border-anti pt-8 border"
          listing={listing}
          onManageDisableScrolling={onManageDisableScrolling}
          booking={booking}
          hideRatesButton
          hideAvatar
          hideFees
        />
      ) : (
        <RecurringBookingSummaryCard
          className="mt-6 rounded-standard border-anti pt-8 border"
          listing={listing}
          onManageDisableScrolling={onManageDisableScrolling}
          startOfWeek={startDate}
          booking={booking}
          hideRatesButton
          hideAvatar
          hideFees
          showWeekly
          hideWeeklyBillingDetails
          showExceptions={allExceptions.length > 0}
        />
      )}
      {acceptBookingError ? (
        <p className="text-error">
          There was an issue accepting the booking request. Please try again.
        </p>
      ) : null}
      {declineBookingError ? (
        <p className="text-error">
          There was an issue declining the booking request. Please try again.
        </p>
      ) : null}
      {hasSameDayBooking ? (
        <div className={css.bookingDecisionContainer}>
          <h3 className="text-error text-md">
            You have an existing booking with dates that conflict with this request. Please decline
            this booking request.
          </h3>

          <CancelButton
            inProgress={declineBookingInProgress}
            ready={declineBookingSuccess}
            className={css.declineButton}
            // inProgress={transitionTransactionInProgress === TRANSITION_DECLINE_BOOKING}
            onClick={() => onDeclineBooking(booking)}
            disabled={
              acceptBookingSuccess ||
              acceptBookingInProgress ||
              declineBookingSuccess ||
              declineBookingInProgress
            }
          >
            Decline
          </CancelButton>
        </div>
      ) : (
        <div className={css.acceptDeclineButtons}>
          <PrimaryButton
            inProgress={acceptBookingInProgress}
            ready={acceptBookingSuccess}
            onClick={() => onAcceptBooking(booking)}
            disabled={
              declineBookingSuccess ||
              declineBookingInProgress ||
              acceptBookingSuccess ||
              acceptBookingInProgress
            }
          >
            Accept
          </PrimaryButton>
          <CancelButton
            inProgress={declineBookingInProgress}
            ready={declineBookingSuccess}
            className={css.declineButton}
            onClick={() => onDeclineBooking(booking)}
            disabled={
              acceptBookingSuccess ||
              acceptBookingInProgress ||
              declineBookingSuccess ||
              declineBookingInProgress
            }
          >
            Decline
          </CancelButton>
        </div>
      )}
    </Modal>
  ) : null;
};

const mapStateToProps = state => {
  const {
    declineBookingError,
    declineBookingInProgress,
    declineBookingSuccess,
    acceptBookingSuccess,
    acceptBookingInProgress,
  } = state.transactions;

  return {
    declineBookingError,
    declineBookingInProgress,
    declineBookingSuccess,
    acceptBookingSuccess,
    acceptBookingInProgress,
  };
};

const mapDispatchToProps = {
  onManageDisableScrolling: manageDisableScrolling,
  onDeclineBooking: declineBooking,
  onAcceptBooking: acceptBooking,
};

export default compose(connect(mapStateToProps, mapDispatchToProps))(ResponseModal);
