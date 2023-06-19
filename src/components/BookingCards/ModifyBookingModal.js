import React, { useState } from 'react';

import { Modal, BookingSummaryCard, Button } from '..';
import { ModifyBookingForm } from '../../forms';

import css from './BookingCards.module.css';

const convertBookingTimes = bookingTimes =>
  Object.keys(bookingTimes).map(date => ({
    date,
    startTime: bookingTimes[date].startTime,
    endTime: bookingTimes[date].endTime,
  }));

const ModifyBookingModal = props => {
  const [showForm, setShowForm] = useState(true);
  const [formValues, setFormValues] = useState({});

  const {
    isOpen,
    onClose,
    onManageDisableScrolling,
    bookingDates,
    provider,
    providerDisplayName,
    listing,
    bookingRate,
    isLarge,
    bookingTimes,
    onSubmitRequest,
  } = props;

  const handleClose = () => {
    setShowForm(true);
    onClose();
  };

  const handleFormSubmit = values => {
    setFormValues(values);
    setShowForm(false);
  };

  const initialDateTimes = bookingTimes.reduce(
    (acc, time) => ({
      ...acc,
      [time.date]: {
        startTime: time.startTime,
        endTime: time.endTime,
      },
    }),
    {}
  );

  return (
    <Modal
      id={`ModifyBooking.${listing.id.uuid}`}
      title="Modify Booking"
      isOpen={isOpen}
      onClose={handleClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
    >
      {showForm ? (
        <ModifyBookingForm
          onSubmit={handleFormSubmit}
          onManageDisableScrolling={onManageDisableScrolling}
          bookingDates={bookingDates}
          authorDisplayName={providerDisplayName}
          currentListing={listing}
          initialValues={{ bookingRate: [bookingRate], bookingDates, dateTimes: initialDateTimes }}
        />
      ) : (
        <>
          <p>
            The provider will be notified of your request to modify the booking. You will be
            notified when the provider accepts or declines your request. If the provider declines or
            the request expires in 72 hours from now, the booking will remain as is.
          </p>
          <BookingSummaryCard
            className={css.changeSummaryCard}
            authorDisplayName={providerDisplayName}
            currentAuthor={provider}
            selectedBookingTimes={convertBookingTimes(formValues.dateTimes)}
            bookingRate={bookingRate}
            bookingDates={formValues.bookingDates}
            onManageDisableScrolling={onManageDisableScrolling}
            displayOnMobile={!isLarge}
            hideAvatar
            subHeading={<span className={css.bookingWith}>Modified Booking Summary</span>}
            hideRatesButton
          />
          <Button onClick={onSubmitRequest}>Request Booking Change</Button>
        </>
      )}
    </Modal>
  );
};

export default ModifyBookingModal;
