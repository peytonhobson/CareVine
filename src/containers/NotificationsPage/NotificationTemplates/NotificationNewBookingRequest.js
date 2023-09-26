import React, { useEffect, useMemo, useState } from 'react';

import {
  Avatar,
  Button,
  SecondaryButton,
  NamedLink,
  IconSpinner,
  SingleBookingSummaryCard,
  RecurringBookingSummaryCard,
  ButtonTabNavHorizontal,
} from '../../../components';
import {
  TRANSITION_ACCEPT_BOOKING,
  TRANSITION_DECLINE_BOOKING,
  TRANSITION_EXPIRE_BOOKING,
  TRANSITION_REQUEST_BOOKING,
  TRANSITION_DECLINE_PAYMENT,
  TRANSITION_CHARGE,
  TRANSITION_CANCEL_BOOKING_REQUEST,
} from '../../../util/transaction';
import { userDisplayNameAsString, findStartTimeFromLineItems } from '../../../util/data';
import {
  checkForExceptions,
  checkIsBlockedOneTime,
  checkIsBlockedRecurring,
} from '../../../util/bookings';
import { useMediaQuery } from '@material-ui/core';
import moment from 'moment';

import css from './NotificationTemplates.module.css';

const NotificationNewBookingRequest = props => {
  const [selectedTab, setSelectedTab] = useState('message');

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
    acceptBookingInProgress,
    acceptBookingError,
    acceptBookingSuccess,
    onAcceptBooking,
    declineBookingError,
    declineBookingInProgress,
    declineBookingSuccess,
    onDeclineBooking,
  } = props;

  const { txId } = notification.metadata;

  const {
    lineItems,
    bookingRate,
    paymentMethodType,
    message,
    senderListingTitle,
    senderCity,
    senderListingDescription,
    type: bookingType,
    bookingSchedule,
    startDate,
    endDate,
    exceptions = {
      addedDays: [],
      removedDays: [],
      changedDays: [],
    },
  } = currentTransaction?.attributes.metadata || {};

  const { customer, listing } = currentTransaction || {};
  const { bookedDates = [], bookedDays = [] } = listing?.attributes?.metadata || {};

  const senderName = userDisplayNameAsString(customer);

  const bookingStart = findStartTimeFromLineItems(lineItems);
  const bookingEnd = moment(bookingStart)
    .add(1, 'hours')
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

  const isLarge = useMediaQuery('(min-width:1024px)');
  const isNotAcceptedOrDeclined =
    currentTransaction?.attributes.lastTransition === TRANSITION_REQUEST_BOOKING;
  const isDeclined = currentTransaction?.attributes.lastTransition === TRANSITION_DECLINE_BOOKING;
  const isUpcoming =
    currentTransaction?.attributes.lastTransition === TRANSITION_ACCEPT_BOOKING ||
    currentTransaction?.attributes.lastTransition === TRANSITION_CHARGE;
  const isExpired = currentTransaction?.attributes.lastTransition === TRANSITION_EXPIRE_BOOKING;
  const isPaymentFailed =
    currentTransaction?.attributes.lastTransition === TRANSITION_DECLINE_PAYMENT;
  const hasSameDayBooking = useMemo(
    () =>
      (bookingType === 'oneTime'
        ? checkIsBlockedOneTime({ bookingDates, listing })
        : checkIsBlockedRecurring({ bookingSchedule, startDate, endDate, exceptions, listing })) &&
      !(acceptBookingSuccess || acceptBookingInProgress),
    [bookingDates, listing, startDate, endDate, exceptions, bookingType]
  );
  const isCanceledRequest =
    currentTransaction?.attributes.lastTransition === TRANSITION_CANCEL_BOOKING_REQUEST;

  const hasExceptions = checkForExceptions(exceptions);

  const tabs = [];

  if (message) {
    tabs.push({
      text: 'Message',
      selected: selectedTab === 'message',
      onClick: () => setSelectedTab('message'),
    });
  }

  if (senderListingDescription) {
    tabs.push({
      text: 'Job Description',
      selected: selectedTab === 'jobDescription',
      onClick: () => setSelectedTab('jobDescription'),
    });
  }

  useEffect(() => {
    if (senderListingDescription && !message) {
      setSelectedTab('jobDescription');
    }
  }, [message, senderListingDescription]);

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
            <h2 className={css.listingTitle}>
              {senderListingTitle !== 'Title' ? senderListingTitle : ''}
            </h2>
          </div>
          {message || senderListingDescription ? (
            <div className={css.messageContainer}>
              <ButtonTabNavHorizontal
                tabs={tabs}
                rootClassName={css.nav}
                tabRootClassName={css.tab}
                tabContentClass={css.tabContent}
                tabClassName={css.tab}
              />
              {selectedTab === 'message' ? (
                <p className={css.requestMessage}>{message}</p>
              ) : (
                <p className={css.requestMessage}>{senderListingDescription}</p>
              )}
            </div>
          ) : null}
        </div>
        <div className={css.bookingInfo}>
          {bookingType === 'oneTime' ? (
            <SingleBookingSummaryCard
              className={css.summaryCard}
              bookingTimes={bookingTimes}
              bookingRate={bookingRate}
              listing={listing}
              onManageDisableScrolling={onManageDisableScrolling}
              selectedPaymentMethod={paymentMethodType}
              hideRatesButton
              hideAvatar
              hideFees
            />
          ) : (
            <RecurringBookingSummaryCard
              className={css.summaryCard}
              bookingRate={bookingRate}
              listing={listing}
              onManageDisableScrolling={onManageDisableScrolling}
              selectedPaymentMethod={paymentMethodType}
              weekdays={bookingSchedule}
              startDate={startDate}
              weekEndDate={moment(startDate)
                .endOf('week')
                .toDate()}
              bookingEndDate={endDate}
              exceptions={exceptions}
              hideRatesButton
              hideAvatar
              hideFees
              showWeekly
              hideWeeklyBillingDetails
              showExceptions={hasExceptions}
            />
          )}
          {(declineBookingError || acceptBookingError) && (
            <p className={css.error}>
              Something went wrong with accepting or declining the booking request. Please try
              again.
            </p>
          )}

          {isNotAcceptedOrDeclined || isExpired ? (
            hasSameDayBooking ? (
              <div className={css.bookingDecisionContainer}>
                <h2 className={css.bookingDeclined}>
                  You have an existing booking that has dates that conflict with this request.
                  Please decline this booking request.
                </h2>
                <Button
                  className={css.viewBookingLink}
                  onClick={() => onDeclineBooking(currentTransaction)}
                  inProgress={declineBookingInProgress}
                >
                  Decline
                </Button>
              </div>
            ) : (
              <div className={css.acceptDeclineContainer}>
                <Button
                  onClick={() => onAcceptBooking(currentTransaction)}
                  inProgress={acceptBookingInProgress}
                >
                  Accept
                </Button>
                <SecondaryButton
                  onClick={() => onDeclineBooking(currentTransaction)}
                  className={css.declineButton}
                  inProgress={declineBookingInProgress}
                >
                  Decline
                </SecondaryButton>
              </div>
            )
          ) : (
            <div className={css.bookingDecisionContainer}>
              {isUpcoming && (
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
              {isCanceledRequest && (
                <h2 className={css.bookingDeclined}>Customer Canceled Booking Request</h2>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationNewBookingRequest;
