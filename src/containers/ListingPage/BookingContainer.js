import React, { useState } from 'react';

import classNames from 'classnames';
import { TextareaAutosize, useMediaQuery } from '@mui/material';
import { InitialBookingForm } from '../../forms';
import { Button, Modal, Avatar, IconSpinner } from '../../components';

import css from './ListingPage.module.css';

const BookingContainer = props => {
  const {
    listing,
    onSubmit,
    onManageDisableScrolling,
    authorDisplayName,
    hasStripeAccount,
    hasStripeAccountInProgress,
    hasStripeAccountError,
    isBookingModalOpen,
    onBookingModalClose,
    onBookingModalOpen,
    authorWhiteListed,
  } = props;

  const isLarge = useMediaQuery('(min-width:1024px)');
  const minPrice = listing.attributes.publicData.minPrice;
  const authorId = listing.author?.id.uuid;
  const authorHasStripeAccount =
    (hasStripeAccount.userId === authorId && hasStripeAccount.data) || authorWhiteListed;

  return (
    <>
      {!isLarge ? (
        <div className={css.fixedAvailability}>
          <div className={css.startingRateContainer}>
            <p className={css.startingRateText}>Starting Rate</p>
            <p className={css.startingRate}>${minPrice / 100}</p>
          </div>
          {authorHasStripeAccount ? (
            <Button className={css.availabilityButton} onClick={onBookingModalOpen}>
              Book Now
            </Button>
          ) : (
            <div className={css.noStripeAccountContainer}>
              {hasStripeAccountInProgress ? (
                <>
                  <IconSpinner className={css.spinner} />
                  <p style={{ color: 'var(--marketplaceColor)', textAlign: 'center' }}>
                    Loading caregiver's booking details...
                  </p>
                </>
              ) : hasStripeAccountError ? (
                <p style={{ color: 'var(--failColor)', textAlign: 'center' }}>
                  Error loading booking details.
                </p>
              ) : (
                <h3 style={{ color: 'var(--marketplaceColor)', textAlign: 'center' }}>
                  Booking Not Available
                </h3>
              )}
            </div>
          )}
        </div>
      ) : null}
      <Modal
        className={css.bookingModal}
        isOpen={isBookingModalOpen}
        onClose={onBookingModalClose}
        onManageDisableScrolling={onManageDisableScrolling}
        usePortal
        id="BookingModal"
      >
        <div className={css.bookingModalHeader}>
          <Avatar
            className={css.bookingAvatar}
            initialsClassName={css.bookingAvatarInitials}
            user={listing.author}
          />
          <h1 className={css.modalTitle}>Book {authorDisplayName}</h1>
        </div>
        <InitialBookingForm className={css.bookingForm} listing={listing} onSubmit={onSubmit} />
      </Modal>
    </>
  );
};

export default BookingContainer;
