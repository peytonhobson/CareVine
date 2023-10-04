import React, { useState } from 'react';

import { Modal, PrimaryButton, Button } from '../..';
import { useMediaQuery } from '@mui/material';
import { manageDisableScrolling } from '../../../ducks/UI.duck';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { updateBookingMetadata } from '../../../containers/BookingsPage/BookingsPage.duck';

import css from './BookingCardModals.module.css';
import { SectionPayment } from '../../../forms/EditBookingForm/sections';

const ChangePaymentMethodModal = props => {
  const {
    isOpen,
    onClose,
    onManageDisableScrolling,
    booking,
    onGoBack,
    updateBookingMetadataInProgress,
    updateBookingMetadataError,
    updateBookingMetadataSuccess,
    onUpdateBooking,
  } = props;

  const [paymentMethod, setPaymentMethod] = useState(null);

  const isLarge = useMediaQuery('(min-width:1024px)');

  const handleUpdatePaymentMethod = () => {
    onUpdateBooking(booking, { paymentMethodId: paymentMethod.id });
  };

  const submitInProgress = updateBookingMetadataInProgress;
  const submitDisabled = updateBookingMetadataInProgress || updateBookingMetadataSuccess;
  const submitReady = updateBookingMetadataSuccess;

  return isOpen ? (
    <Modal
      title="Change Payment Method"
      id="ChangePaymentMethodModal"
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
    >
      <p className={css.modalTitle}>Change Your Payment Method for this Booking</p>
      <p className={css.modalMessage}>
        All future payments will be charged to the new payment method. Previous charges and refunds
        will not be affected.
      </p>
      <SectionPayment
        className={css.sectionPayment}
        isLarge={isLarge}
        onManageDisableScrolling={onManageDisableScrolling}
        hideDisclaimer
        onChangePaymentMethod={setPaymentMethod}
        booking={booking}
      />
      {updateBookingMetadataError ? (
        <p className="text-error">Failed to update payment method. Please try again.</p>
      ) : null}
      <div className={css.modalButtonContainer}>
        <Button onClick={onGoBack} className={css.modalButton} type="button">
          Back
        </Button>
        <PrimaryButton
          inProgress={submitInProgress}
          onClick={handleUpdatePaymentMethod}
          className="w-auto ml-4 px-6 min-w-[10rem]"
          ready={submitReady}
          disabled={submitDisabled}
          type="button"
        >
          Change Payment
        </PrimaryButton>
      </div>
    </Modal>
  ) : null;
};

const mapStateToProps = state => {
  const {
    updateBookingMetadataInProgress,
    updateBookingMetadataError,
    updateBookingMetadataSuccess,
  } = state.BookingsPage;

  return {
    updateBookingMetadataInProgress,
    updateBookingMetadataError,
    updateBookingMetadataSuccess,
  };
};

const mapDispatchToProps = {
  onManageDisableScrolling: manageDisableScrolling,
  onUpdateBooking: updateBookingMetadata,
};

export default compose(connect(mapStateToProps, mapDispatchToProps))(ChangePaymentMethodModal);
