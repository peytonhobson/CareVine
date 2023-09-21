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
    lineItems,
    bookingRate,
    paymentMethodType,
    bookingSchedule,
    exceptions,
    startDate,
    type,
  } = transaction.attributes.metadata;

  const bookingTimes = lineItems.map(l => ({
    date: `${new Date(l.date).getMonth() + 1}/${new Date(l.date).getDate()}`,
    startTime: l.startTime,
    endTime: l.endTime,
  }));

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
          bookingRate={bookingRate}
          listing={listing}
          onManageDisableScrolling={onManageDisableScrolling}
          selectedPaymentMethod={paymentMethodType}
          subHeading=""
          weekdays={bookingSchedule}
          startDate={startDate}
          weekEndDate={endOfFirstWeek}
          exceptions={exceptions}
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
          bookingTimes={bookingTimes}
          bookingRate={bookingRate}
          listing={listing}
          onManageDisableScrolling={onManageDisableScrolling}
          selectedPaymentMethod={paymentMethodType}
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
