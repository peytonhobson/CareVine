import React from 'react';

import { Modal, CancelButton, Button } from '../../';
import { cancelBooking } from '../../../containers/BookingsPage/BookingsPage.duck';
import { manageDisableScrolling } from '../../../ducks/UI.duck';
import { compose } from 'redux';
import { connect } from 'react-redux';

import css from './BookingCardModals.module.css';

const nonPaidTransitions = ['transition/request-booking', 'transition/accept'];

const CancelModal = props => {
  const {
    isOpen,
    onClose,
    lastTransition,
    otherUserDisplayName,
    onManageDisableScrolling,
    onCancelBooking,
    cancelBookingInProgress,
    cancelBookingError,
    cancelBookingSuccess,
    isCaregiver,
    booking,
  } = props;

  const showCancellationPolicy = !nonPaidTransitions.includes(lastTransition);

  let policy;

  if (isCaregiver) {
    policy = (
      <p className={css.modalMessage}>
        If you cancel the booking now, {otherUserDisplayName} will be fully refunded for any booking
        times not completed. Your search ranking may also be affected.
      </p>
    );
  } else {
    policy = showCancellationPolicy ? (
      <>
        <p className={css.modalMessageRefund}>Cancellation Policy</p>
        <ul className={css.refundList}>
          <li className={css.refundListItem}>
            100% refund for booked times canceled more than 48 hours in advance
          </li>
          <li className={css.refundListItem}>
            50% refund for booked times canceled less than 48 hours in advance
          </li>
          <li className={css.refundListItem}>
            Service fees will be refunded in proportion to the refunded base booking amount.
            Processing fees are non-refundable under all circumstances.
          </li>
        </ul>
        <div>
          {/* TODO: Add refund cards */}
          {/* <BookingSummaryCard
                  className={css.bookingSummaryCard}
                  lineItems={lineItems}
                  onManageDisableScrolling={onManageDisableScrolling}
                /> */}
        </div>
      </>
    ) : (
      <p className={css.modalMessage}>
        You have not been charged for this booking and will therefore not receive a refund.
      </p>
    );
  }

  return isOpen ? (
    <Modal
      title="Cancel Booking"
      id="CancelBookingModal"
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
      containerClassName={css.modalContainer}
    >
      <p className={css.modalTitle}>Cancel Booking with {otherUserDisplayName}</p>
      {policy}
      {cancelBookingError ? (
        <p className={css.modalError}>
          There was an error cancelling your booking. Please try again.
        </p>
      ) : null}
      <div className={css.modalButtonContainer}>
        <Button onClick={onClose} className={css.modalButton}>
          Back
        </Button>
        <CancelButton
          inProgress={cancelBookingInProgress}
          onClick={() => onCancelBooking(booking)}
          className={css.modalButton}
          ready={cancelBookingSuccess}
          disabled={cancelBookingSuccess || cancelBookingInProgress}
        >
          Cancel
        </CancelButton>
      </div>
    </Modal>
  ) : null;
};

const mapStateToProps = state => {
  const { cancelBookingInProgress, cancelBookingError, cancelBookingSuccess } = state.BookingsPage;

  return {
    cancelBookingInProgress,
    cancelBookingError,
    cancelBookingSuccess,
  };
};

const mapDispatchToProps = {
  onManageDisableScrolling: manageDisableScrolling,
  onCancelBooking: cancelBooking,
};

export default compose(connect(mapStateToProps, mapDispatchToProps))(CancelModal);
