import React, { useState, useRef } from 'react';

import classNames from 'classnames';
import { useMediaQuery } from '@material-ui/core';
import { useIsScrollable } from '../../util/hooks';
import { convertTimeFrom12to24 } from '../../util/data';
import { Avatar, BookingSummaryCard } from '..';

import css from './BookingConfirmationCard.module.css';

const BANK_ACCOUNT = 'Bank Account';
const CREDIT_CARD = 'Payment Card';

const BookingConfirmationCard = props => {
  const {
    authorDisplayName,
    currentAuthor,
    className,
    transaction,
    listing,
    onManageDisableScrolling,
  } = props;

  const { lineItems, bookingRate, paymentMethodType } = transaction.attributes.metadata;

  const bookingTimes = lineItems.map(l => ({
    date: `${new Date(l.date).getMonth() + 1}/${new Date(l.date).getDate()}`,
    startTime: l.startTime,
    endTime: l.endTime,
  }));
  const bookingDates = lineItems.map(l => new Date(l.date));
  const selectedPaymentMethod =
    paymentMethodType === 'us_bank_account' ? BANK_ACCOUNT : CREDIT_CARD;
  const isLarge = useMediaQuery('(min-width:1024px)');

  return (
    <div className={css.root}>
      <h2 className={css.newBookingRequested}>New Booking Requested!</h2>
      <h3 style={{ textAlign: 'center', maxWidth: '100%' }}>
        A notification has been sent to {authorDisplayName}. They have 72 hours or until the start
        of the booking to accept the request or it will expire.
      </h3>
      {/* <BookingSummaryCard
        className={css.summaryCard}
        authorDisplayName={authorDisplayName}
        currentAuthor={currentAuthor}
        selectedBookingTimes={bookingTimes}
        bookingRate={bookingRate}
        bookingDates={bookingDates.map(bookingDate => new Date(bookingDate))}
        listing={listing}
        onManageDisableScrolling={onManageDisableScrolling}
        selectedPaymentMethod={selectedPaymentMethod}
        displayOnMobile={!isLarge}
        hideAvatar
        subHeading={
          <div className={css.subHeading}>
            <Avatar user={currentAuthor} disableProfileLink className={css.avatar} />
            <span className={css.bookingWith}>
              Booking with <span style={{ whiteSpace: 'nowrap' }}>{authorDisplayName}</span>
            </span>
          </div>
        }
        hideRatesButton
      /> */}
    </div>
  );
};

export default BookingConfirmationCard;
