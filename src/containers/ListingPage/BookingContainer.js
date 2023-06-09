import React, { useState } from 'react';

import classNames from 'classnames';
import { useMediaQuery } from '@mui/material';
import { InitialBookingForm } from '../../forms';
import { Button } from '../../components';

import css from './ListingPage.module.css';

const BookingContainer = props => {
  const { listing, onSubmit, monthlyTimeSlots } = props;

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
        <Button className={css.availabilityButton}>Check Availability</Button>
      </div>
    </>
  );
};

export default BookingContainer;
