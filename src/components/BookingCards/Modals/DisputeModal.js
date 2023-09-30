import React from 'react';

import { Modal } from '../../';
import { DisputeForm } from '../../../forms';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { manageDisableScrolling } from '../../../ducks/UI.duck';
import { disputeBooking } from '../../../containers/BookingsPage/BookingsPage.duck';

import css from './BookingCardModals.module.css';

const DisputeModal = props => {
  const {
    isOpen,
    onClose,
    onManageDisableScrolling,
    disputeBookingInProgress,
    disputeBookingError,
    disputeBookingSuccess,
    onDisputeBooking,
  } = props;

  const handleDisputeBooking = values => {
    const { disputeReason } = values;
    onDisputeBooking(booking, disputeReason);
  };

  return isOpen ? (
    <Modal
      title="Dispute Booking"
      id="DisputeBookingModal"
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
      containerClassName={css.modalContainer}
    >
      <p className={css.modalTitle}>Submit Dispute</p>
      <p className={css.modalMessage}>
        Any dispute submitted will be reviewed by CareVine. You will be notified of the outcome once
        we have reviewed the case.
      </p>
      <DisputeForm
        onSubmit={handleDisputeBooking}
        inProgress={disputeBookingInProgress}
        disputeBookingError={disputeBookingError}
        disputeBookingSuccess={disputeBookingSuccess}
      />
    </Modal>
  ) : null;
};

const mapStateToProps = state => {
  const {
    disputeBookingInProgress,
    disputeBookingError,
    disputeBookingSuccess,
  } = state.BookingsPage;

  return {
    disputeBookingInProgress,
    disputeBookingError,
    disputeBookingSuccess,
  };
};

const mapDispatchToProps = {
  onManageDisableScrolling: manageDisableScrolling,
  onDisputeBooking: disputeBooking,
};

export default compose(connect(mapStateToProps, mapDispatchToProps))(DisputeModal);
