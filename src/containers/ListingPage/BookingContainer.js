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
    monthlyTimeSlots,
    onManageDisableScrolling,
    authorDisplayName,
    hasStripeAccount,
    hasStripeAccountInProgress,
    hasStripeAccountError,
  } = props;

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const isLarge = useMediaQuery('(min-width:1024px)');
  const minPrice = listing.attributes.publicData.minPrice;
  const authorId = listing.author?.id.uuid;
  const authorHasStripeAccount = hasStripeAccount.userId === authorId && hasStripeAccount.data;

  return isLarge ? (
    <div className={css.bookingContainer}>
      {authorHasStripeAccount ? (
        <InitialBookingForm
          className={css.bookingForm}
          listing={listing}
          onSubmit={onSubmit}
          monthlyTimeSlots={monthlyTimeSlots}
          // inProgress={bookingInProgress}
        />
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
              Error loading caregiver's booking details.
            </p>
          ) : (
            <h3 style={{ color: 'var(--marketplaceColor)', textAlign: 'center' }}>
              Caregiver has not set up their payment details and cannot be booked directly.
            </h3>
          )}
        </div>
      )}
    </div>
  ) : (
    <>
      <div className={css.fixedAvailability}>
        <div className={css.startingRateContainer}>
          <p className={css.startingRateText}>Starting Rate</p>
          <p className={css.startingRate}>${minPrice / 100}</p>
        </div>
        {authorHasStripeAccount ? (
          <Button className={css.availabilityButton} onClick={() => setIsBookingModalOpen(true)}>
            Check Availability
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
        />
      </Modal>
    </>
  );
};

export default BookingContainer;
