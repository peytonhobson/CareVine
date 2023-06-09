import React, { useState } from 'react';

import classNames from 'classnames';
import { useMediaQuery } from '@mui/material';
import { InitialBookingForm } from '../../forms';
import { Button, Modal, Avatar } from '../../components';

import css from './ListingPage.module.css';

const BookingContainer = props => {
  const {
    listing,
    onSubmit,
    monthlyTimeSlots,
    onManageDisableScrolling,
    authorDisplayName,
  } = props;

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const isLarge = useMediaQuery('(min-width:1024px)');
  const minPrice = listing.attributes.publicData.minPrice;

  return isLarge ? (
    <div className={css.bookingContainer}>
      <InitialBookingForm
        className={css.bookingForm}
        listing={listing}
        onSubmit={onSubmit}
        monthlyTimeSlots={monthlyTimeSlots}
        // inProgress={bookingInProgress}
      />
    </div>
  ) : (
    <>
      <div className={css.fixedAvailability}>
        <div className={css.startingRateContainer}>
          <p className={css.startingRateText}>Starting Rate</p>
          <p className={css.startingRate}>${minPrice / 100}</p>
        </div>
        <Button className={css.availabilityButton} onClick={() => setIsBookingModalOpen(true)}>
          Check Availability
        </Button>
      </div>
      <Modal
        className={css.bookingModal}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onManageDisableScrolling={onManageDisableScrolling}
        usePortal
        id="BookingModal"
      >
        <div className={css.bookingModalHeader}>
          <h1 className={css.modalTitle}>Book {authorDisplayName}</h1>
          <Avatar className={css.bookingAvatar} user={listing.author} />
        </div>
        <InitialBookingForm
          className={css.bookingForm}
          listing={listing}
          onSubmit={onSubmit}
          monthlyTimeSlots={monthlyTimeSlots}
          // inProgress={bookingInProgress}
        />
      </Modal>
    </>
  );
};

export default BookingContainer;
