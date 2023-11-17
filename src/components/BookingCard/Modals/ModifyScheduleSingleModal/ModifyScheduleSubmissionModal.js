import React from 'react';

import { Button, PrimaryButton, Modal, SingleBookingSummaryCard } from '../../..';
import { constructBookingMetadataOneTime } from '../../../../util/bookings';
import css from '../BookingCardModals.module.css';
import classNames from 'classnames';

const ModifyScheduleSubmissionModal = props => {
  const {
    isOpen,
    onClose,
    onManageDisableScrolling,
    submitInProgress,
    submitReady,
    submitDisabled,
    listing,
    onSubmit,
    error,
    onCloseFully,
    booking,
    values,
  } = props;

  const { bookingRate, paymentMethodType } = booking.attributes.metadata;

  const newBooking = {
    ...booking,
    attributes: {
      ...booking.attributes,
      metadata: {
        ...booking.attributes.metadata,
        ...constructBookingMetadataOneTime(
          values.bookingDates,
          values.dateTimes,
          bookingRate,
          paymentMethodType
        ),
      },
    },
  };

  return (
    <Modal
      title="Submit Booking Schedule Change"
      id="SubmitBookingScheduleChangeModal"
      isOpen={isOpen}
      onClose={submitReady ? onCloseFully : onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
      key={isOpen}
    >
      <p className={classNames(css.modalTitle, 'mt-16 md:mt-0')}>Booking Change Summary</p>
      <SingleBookingSummaryCard
        className="mt-6 rounded-[var(--borderRadius)] border-anti pt-8 border"
        listing={listing}
        onManageDisableScrolling={onManageDisableScrolling}
        booking={newBooking}
        hideRatesButton
        hideAvatar
      />
      <div className="mt-10">
        <p className={classNames(css.modalMessage, 'text-primary')}>
          By clicking 'Submit', you are changing your booking schedule to what's listed above. You
          are also agreeing to the new billing details.
        </p>
      </div>
      {error ? (
        <p className="text-error text-center">Failed to update booking. Please try again.</p>
      ) : null}
      <div className={css.modalButtonContainer}>
        {submitReady ? (
          <Button
            onClick={onCloseFully}
            className={classNames(css.dropAnimation, css.modalButton)}
            type="button"
          >
            Close
          </Button>
        ) : (
          <Button onClick={onClose} className={css.modalButton} type="button">
            Back
          </Button>
        )}
        <PrimaryButton
          inProgress={submitInProgress}
          className="w-auto ml-4 px-6 min-w-[10rem]"
          ready={submitReady}
          disabled={submitDisabled}
          onClick={onSubmit}
        >
          Submit
        </PrimaryButton>
      </div>
    </Modal>
  );
};

export default ModifyScheduleSubmissionModal;
