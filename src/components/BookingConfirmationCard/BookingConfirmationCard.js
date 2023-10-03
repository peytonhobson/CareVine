import React from 'react';

import { Avatar, SingleBookingSummaryCard, RecurringBookingSummaryCard } from '..';

import css from './BookingConfirmationCard.module.css';
import { getFirstWeekEndDate } from '../../util/bookings';

const BookingConfirmationCard = props => {
  const {
    authorDisplayName,
    currentAuthor,
    className,
    transaction,
    listing,
    onManageDisableScrolling,
  } = props;

  const {
    bookingRate,
    paymentMethodType,
    bookingSchedule,
    exceptions,
    startDate,
    type,
  } = transaction.attributes.metadata;

  const endOfFirstWeek =
    type === 'recurring' ? getFirstWeekEndDate(startDate, bookingSchedule, exceptions) : null;

  return (
    <div className={css.root}>
      <h2 className={css.newBookingRequested}>New Booking Requested!</h2>
      <h3 style={{ textAlign: 'center', maxWidth: '100%' }}>
        A notification has been sent to {authorDisplayName}. They have 72 hours or until the start
        of the booking to accept the request or it will expire.
      </h3>
      {type === 'recurring' ? (
        <RecurringBookingSummaryCard
          authorDisplayName={authorDisplayName}
          currentAuthor={currentAuthor}
          listing={listing}
          onManageDisableScrolling={onManageDisableScrolling}
          selectedPaymentMethod={paymentMethodType}
          subHeading=""
          booking={transaction}
          startOfWeek={startDate}
          avatarText={
            <h2 className={css.bookingWith}>
              First Week with <span style={{ whiteSpace: 'nowrap' }}>{authorDisplayName}</span>
            </h2>
          }
          hideRatesButton
        />
      ) : (
        <SingleBookingSummaryCard
          className={css.summaryCard}
          authorDisplayName={authorDisplayName}
          currentAuthor={currentAuthor}
          listing={listing}
          onManageDisableScrolling={onManageDisableScrolling}
          booking={transaction}
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
        />
      )}
    </div>
  );
};

export default BookingConfirmationCard;
