import React from 'react';

import { Modal, SingleBookingSummaryCard, WeeklyBillingDetails } from '../../';

import css from './BookingCardModals.module.css';

const PaymentDetailsModal = props => {
  const {
    isOpen,
    onClose,
    bookingTimes,
    bookingRate,
    listing,
    onManageDisableScrolling,
    paymentMethodType,
    scheduleType,
    bookingSchedule,
    exceptions,
    startDate,
    endDate,
    provider,
  } = props;

  return isOpen ? (
    <Modal
      title="Payment Details"
      id="PaymentDetailsModal"
      isOpen={isOpen}
      onClose={onClose}
      containerClassName={css.modalContainer}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
    >
      <p className={css.modalTitle}>Payment Summary</p>
      {scheduleType === 'oneTime' ? (
        <SingleBookingSummaryCard
          className="mt-6 rounded-[var(--borderRadius)] border-anti pt-8 border"
          bookingTimes={bookingTimes}
          bookingRate={bookingRate}
          listing={listing}
          onManageDisableScrolling={onManageDisableScrolling}
          selectedPaymentMethod={paymentMethodType}
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
            bookingSchedule={bookingSchedule}
            exceptions={exceptions}
            startDate={startDate}
            endDate={endDate}
            currentAuthor={provider}
            bookingRate={bookingRate}
            listing={listing}
            onManageDisableScrolling={onManageDisableScrolling}
            selectedPaymentMethodType={paymentMethodType}
          />
        </>
      )}
    </Modal>
  ) : null;
};

export default PaymentDetailsModal;
