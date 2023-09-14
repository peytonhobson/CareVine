import React from 'react';

import { Avatar, SingleBookingSummaryCard, RecurringBookingSummaryCard } from '..';
import moment from 'moment';
import { WEEKDAY_MAP } from '../../util/constants';

import css from './BookingConfirmationCard.module.css';

const BANK_ACCOUNT = 'Bank Account';
const CREDIT_CARD = 'Payment Card';

const getEndOfFirstWeek = (startDate, weekdays) => {
  if (!startDate) return null;

  const lastDay = Object.keys(weekdays).reduce((acc, curr) => {
    const day = WEEKDAY_MAP[curr];

    const date = moment(startDate).weekday(day);

    if (date.isAfter(acc)) {
      return date;
    }
    return acc;
  }, startDate);

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
    blockedDays,
    blockedDates,
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
          subHeading=""
          weekdays={bookingSchedule}
          startDate={startDate}
          weekEndDate={endOfFirstWeek}
          exceptions={exceptions}
          blockedDays={blockedDays}
          blockedDates={blockedDates}
          avatarText={
            <h2 className={css.bookingWith}>
              First Week with <span style={{ whiteSpace: 'nowrap' }}>{authorDisplayName}</span>
            </h2>
          }
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
