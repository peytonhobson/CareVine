import React from 'react';

import { Modal, CancelButton, Button, PrimaryButton } from '../..';
import classNames from 'classnames';
import { useCheckMobileScreen } from '../../../util/hooks';

import css from './BookingCardModals.module.css';

const BookingDetailsModal = props => {
  const {
    isOpen,
    onClose,
    onManageDisableScrolling,
    onModalOpen,
    booking,
    modalTypes,
    allExceptions,
  } = props;

  const isMobile = useCheckMobileScreen();

  const { type: bookingType } = booking.attributes.metadata;

  const buttonClass = classNames(css.dropAnimation, 'w-auto py-2 px-4 mt-4');

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
      <p className={css.modalTitle}>Booking Details</p>
      <div className="flex flex-col gap-4 pt-6">
        <Button className={buttonClass} onClick={() => onModalOpen(modalTypes.PAYMENT_DETAILS)}>
          Payment Details
        </Button>
        {bookingType === 'oneTime' ? (
          <PrimaryButton className={buttonClass} onClick={() => onModalOpen(modalTypes.CALENDAR)}>
            Booking Calendar
          </PrimaryButton>
        ) : allExceptions.length ? (
          <CancelButton className={buttonClass} onClick={() => onModalOpen(modalTypes.EXCEPTIONS)}>
            Schedule Exceptions
          </CancelButton>
        ) : null}
        {isMobile && bookingType === 'recurring' ? (
          <PrimaryButton
            className={buttonClass}
            onClick={() => onModalOpen(modalTypes.FULL_WEEKLY_SCHEDULE)}
          >
            Booking Schedule
          </PrimaryButton>
        ) : null}
      </div>
    </Modal>
  ) : null;
};

export default BookingDetailsModal;
