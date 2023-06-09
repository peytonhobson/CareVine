import React, { useState } from 'react';

import classNames from 'classnames';
import { useMediaQuery } from '@mui/material';
import { InitialBookingForm } from '../../forms';

import css from './ListingPage.module.css';

const BookingContainer = props => {
  const { listing, onSubmit, monthlyTimeSlots } = props;

  const isLarge = useMediaQuery('(min-width:1024px)');

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
  ) : null;
};

export default BookingContainer;
