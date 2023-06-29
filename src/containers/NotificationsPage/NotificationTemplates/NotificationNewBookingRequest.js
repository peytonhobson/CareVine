import { useMediaQuery } from '@material-ui/core';
import moment from 'moment';
import React, { useEffect } from 'react';

import {
  Avatar,
  Button,
  SecondaryButton,
  NamedLink,
  BookingSummaryCard,
  IconSpinner,
} from '../../../components';
import {
  TRANSITION_ACCEPT_BOOKING,
  TRANSITION_DECLINE_BOOKING,
  TRANSITION_EXPIRE_BOOKING,
  TRANSITION_REQUEST_BOOKING,
  TRANSITION_DECLINE_PAYMENT,
  TRANSITION_DISPUTE,
} from '../../../util/transaction';
import { userDisplayNameAsString, findEndTimeFromLineItems } from '../../../util/data';

import css from './NotificationTemplates.module.css';

const BANK_ACCOUNT = 'Bank Account';
const CREDIT_CARD = 'Payment Card';

const NotificationNewBookingRequest = props => {
  const {
    notification,
    currentUser,
    onManageDisableScrolling,
    transitionTransactionInProgress,
    transitionTransactionError,
    currentTransaction,
    onTransitionTransaction,
    onFetchTransaction,
    fetchTransactionInProgress,
    fetchTransactionError,
  } = props;

  const { txId } = notification.metadata;

  const { lineItems, bookingRate, paymentMethodType, message, senderListingTitle, senderCity } =
    currentTransaction?.attributes.metadata || {};

  const { customer, listing } = currentTransaction || {};

  const senderName = userDisplayNameAsString(customer);

  const newBookingEnd = findEndTimeFromLineItems(lineItems);
  const newBookingStart = moment(newBookingEnd)
    .subtract(1, 'hours')
    .toDate();

  useEffect(() => {
    if (txId) {
      onFetchTransaction(txId);
    }
  }, [txId]);

  const bookingTimes = lineItems?.map(l => ({
    date: `${new Date(l.date).getMonth() + 1}/${new Date(l.date).getDate()}`,
    startTime: l.startTime,
    endTime: l.endTime,
  }));
  const bookingDates = lineItems?.map(l => new Date(l.date));
  const selectedPaymentMethod =
    paymentMethodType === 'us_bank_account' ? BANK_ACCOUNT : CREDIT_CARD;

  const isLarge = useMediaQuery('(min-width:1024px)');
  const isNotAcceptedOrDeclined =
    currentTransaction?.attributes.lastTransition === TRANSITION_REQUEST_BOOKING;
  const isDeclined = currentTransaction?.attributes.lastTransition === TRANSITION_DECLINE_BOOKING;
  const isAccepted = currentTransaction?.attributes.lastTransition === TRANSITION_ACCEPT_BOOKING;
  const isExpired = currentTransaction?.attributes.lastTransition === TRANSITION_EXPIRE_BOOKING;
  const isPaymentFailed =
    currentTransaction?.attributes.lastTransition === TRANSITION_DECLINE_PAYMENT;
  const hasSameDayBooking = listing?.attributes.metadata.bookedDates?.some(date =>
    lineItems?.some(l => new Date(date).getTime() === new Date(l.date).getTime())
  );

  return fetchTransactionInProgress ? (
    <div className={css.fullContainer}>
      <IconSpinner className={css.bookingRequestSpinner} />
    </div>
  ) : fetchTransactionError ? (
    <div className={css.fullContainer}>
      <p className={css.errorText}>
        Failed to fetch booking request. Please try refreshing the page.
      </p>
    </div>
  ) : (
    <div className={css.bookingRequestRoot}>
      <h1 className={css.requestTitle}>New Booking Request</h1>
      <div className={css.bookingRequestSubContainer}>
        <div className={css.leftColumn}>
          <div className={css.listingContainer}>
            <div className={css.userInfoContainer}>
              <Avatar
                user={customer}
                disableProfileLink
                className={css.avatar}
                initialsClassName={css.avatarInitials}
              />
              <div className={css.userInfo}>
                <h2 className={css.senderName}>{senderName}</h2>
                <p className={css.listingLocation}>{senderCity}</p>
              </div>
            </div>
            <h2 className={css.listingTitle}>{senderListingTitle}</h2>
          </div>
          {message && (
            <div className={css.messageContainer}>
              <h2 style={{ marginTop: 0 }}>Message</h2>
              <p className={css.requestMessage}>{message}</p>
            </div>
          )}
        </div>
        <div className={css.bookingInfo}>
          <BookingSummaryCard
            className={css.summaryCard}
            currentAuthor={currentUser}
            selectedBookingTimes={bookingTimes}
            bookingRate={bookingRate}
            bookingDates={bookingDates?.map(bookingDate => new Date(bookingDate))}
            onManageDisableScrolling={onManageDisableScrolling}
            selectedPaymentMethod={selectedPaymentMethod}
            hideAvatar
            hideRatesButton
            hideFees
            displayOnMobile={!isLarge}
          />
          {transitionTransactionError && (
            <p className={css.error}>
              Something went wrong with accepting or declining the booking request. Please try
              again.
            </p>
          )}

          {isNotAcceptedOrDeclined || isExpired ? (
            hasSameDayBooking ? (
              <div className={css.bookingDecisionContainer}>
                <h2 className={css.bookingDeclined}>
                  You have a booking on the same day. Please decline this booking request.
                </h2>
                <Button
                  className={css.viewBookingLink}
                  onClick={() =>
                    onTransitionTransaction({
                      transaction: currentTransaction,
                      transition: TRANSITION_DECLINE_BOOKING,
                      include: ['booking', 'customer', 'listing'],
                    })
                  }
                  inProgress={transitionTransactionInProgress === TRANSITION_DECLINE_BOOKING}
                >
                  Decline
                </Button>
              </div>
            ) : (
              <div className={css.acceptDeclineContainer}>
                <Button
                  onClick={() =>
                    onTransitionTransaction({
                      transaction: currentTransaction,
                      transition: TRANSITION_ACCEPT_BOOKING,
                      include: ['booking', 'customer', 'listing'],
                      bookingStart: newBookingStart,
                      bookingEnd: newBookingEnd,
                    })
                  }
                  inProgress={transitionTransactionInProgress === TRANSITION_ACCEPT_BOOKING}
                >
                  Accept
                </Button>
                <SecondaryButton
                  onClick={() =>
                    onTransitionTransaction({
                      transaction: currentTransaction,
                      transition: TRANSITION_DECLINE_BOOKING,
                      include: ['booking', 'customer', 'listing'],
                    })
                  }
                  className={css.declineButton}
                  inProgress={transitionTransactionInProgress === TRANSITION_DECLINE_BOOKING}
                >
                  Decline
                </SecondaryButton>
              </div>
            )
          ) : (
            <div className={css.bookingDecisionContainer}>
              {isAccepted && (
                <>
                  <h2 className={css.bookingAccepted}>Booking Accepted</h2>
                  <NamedLink className={css.viewBookingLink} name="BookingsPage">
                    View Booking
                  </NamedLink>
                </>
              )}
              {isDeclined && <h2 className={css.bookingDeclined}>Booking Declined</h2>}
              {isExpired && <h2 className={css.bookingDeclined}>Booking Request Expired</h2>}
              {isPaymentFailed && <h2 className={css.bookingDeclined}>Client Payment Failed</h2>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationNewBookingRequest;
