import React from 'react';

import { compose } from 'redux';
import { connect } from 'react-redux';
import { Modal, CancelButton, PrimaryButton } from '../../';
import { declineBooking, acceptBooking } from '../../../ducks/transactions.duck';
import { manageDisableScrolling } from '../../../ducks/UI.duck';

import css from './BookingCardModals.module.css';

const ResponseModal = props => {
  const {
    isOpen,
    onClose,
    onManageDisableScrolling,
    exceptions,
    acceptBookingError,
    customerDisplayName,
    booking,
    hasSameDayBooking,
    declineBookingError,
    declineBookingInProgress,
    declineBookingSuccess,
    acceptBookingSuccess,
    acceptBookingInProgress,
    onDeclineBooking,
    onAcceptBooking,
  } = props;

  return isOpen ? (
    <Modal
      title="Respond to Booking"
      id="RespondModal"
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
      containerClassName={css.modalContainer}
    >
      <p className={css.modalTitle}>Accept or Decline Booking with {customerDisplayName}</p>
      {exceptions.length ? (
        <p className={classNames(css.modalMessage, 'text-error')}>
          This schedule contains exceptions. Please review the full schedule and exceptions before
          accepting.
        </p>
      ) : null}
      {/* <BookingSummaryCard
            className={css.bookingSummaryCard}
            authorDisplayName={customerDisplayName}
            currentAuthor={customer}
            selectedBookingTimes={bookingTimes}
            bookingRate={bookingRate}
            bookingDates={bookingDates}
            onManageDisableScrolling={onManageDisableScrolling}
            selectedPaymentMethod={selectedPaymentMethod}
            hideAvatar
            subHeading={<span className={css.bookingWith}>Payment Details</span>}
            refundAmount={refundAmount}
            hideRatesButton
            hideFees
          /> */}
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
