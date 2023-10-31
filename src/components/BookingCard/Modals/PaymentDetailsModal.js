import React from 'react';

import { Modal, SingleBookingSummaryCard, WeeklyBillingDetails } from '../..';

import css from './BookingCardModals.module.css';

const PaymentDetailsModal = props => {
  const { isOpen, onClose, booking, onManageDisableScrolling } = props;

  const { provider, listing } = booking;

  const { type: scheduleType } = booking.attributes.metadata;

  return isOpen ? (
    <Modal
      title="Payment Details"
      id="PaymentDetailsModal"
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
      containerClassName={css.modalContainer}
    >
      <p className={css.modalTitle}>Payment Summary</p>
      {scheduleType === 'oneTime' ? (
        <SingleBookingSummaryCard
          className="mt-6 rounded-[var(--borderRadius)] border-anti pt-8 border"
          listing={listing}
          onManageDisableScrolling={onManageDisableScrolling}
          booking={booking}
          hideRatesButton
          hideAvatar
        />
      ) : (
        <>
          <p className={css.modalMessage}>
            Click any week in your booking to view the payment details for that week.
          </p>
          <WeeklyBillingDetails
            className="mt-6"
            booking={booking}
            currentAuthor={provider}
            listing={listing}
            onManageDisableScrolling={onManageDisableScrolling}
          />
        </>
      )}
    </Modal>
  ) : null;
};

export default PaymentDetailsModal;
