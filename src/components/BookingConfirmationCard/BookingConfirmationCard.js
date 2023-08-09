import React from 'react';

import { Avatar, SingleBookingSummaryCard, RecurringBookingSummaryCard } from '..';
import moment from 'moment';
import { WEEKDAY_MAP } from '../../util/constants';

import css from './BookingConfirmationCard.module.css';

const BANK_ACCOUNT = 'Bank Account';
const CREDIT_CARD = 'Payment Card';

const getEndOfFirstWeek = (startDate, weekdays) => {
  if (!startDate) return null;

  const start = moment(startDate);

  const lastDay = Object.keys(weekdays).reduce((acc, curr) => {
    const day = WEEKDAY_MAP[curr];

    const date = start.weekday(day);

    if (date.isAfter(acc)) {
      return date;
    }
    return acc;
  }, start);

  return lastDay;
};

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
    providerBookedDays,
    providerBookedDates,
    startDate,
  } = transaction.attributes.metadata;

  const bookingTimes = lineItems.map(l => ({
    date: `${new Date(l.date).getMonth() + 1}/${new Date(l.date).getDate()}`,
    startTime: l.startTime,
    endTime: l.endTime,
  }));
  const selectedPaymentMethod =
    paymentMethodType === 'us_bank_account' ? BANK_ACCOUNT : CREDIT_CARD;

  const endOfFirstWeek = bookingSchedule ? getEndOfFirstWeek(startDate, bookingSchedule) : null;

  return (
    <div className={css.root}>
      <h2 className={css.newBookingRequested}>New Booking Requested!</h2>
      <h3 style={{ textAlign: 'center', maxWidth: '100%' }}>
        A notification has been sent to {authorDisplayName}. They have 72 hours or until the start
        of the booking to accept the request or it will expire.
      </h3>
      {bookingSchedule ? (
        <RecurringBookingSummaryCard
          authorDisplayName={authorDisplayName}
          currentAuthor={currentAuthor}
          bookingRate={bookingRate}
          listing={listing}
          onManageDisableScrolling={onManageDisableScrolling}
          selectedPaymentMethod={paymentMethodType}
          subHeading={
            <div className={css.subHeading}>
              <Avatar user={currentAuthor} disableProfileLink className={css.avatar} />
              <span className={css.bookingWith}>
                First Week with <span style={{ whiteSpace: 'nowrap' }}>{authorDisplayName}</span>
              </span>
            </div>
          }
          weekdays={bookingSchedule}
          startDate={startDate}
          weekEndDate={endOfFirstWeek}
          exceptions={exceptions}
          bookedDays={providerBookedDays}
          bookedDates={providerBookedDates}
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
          selectedPaymentMethod={selectedPaymentMethod}
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
