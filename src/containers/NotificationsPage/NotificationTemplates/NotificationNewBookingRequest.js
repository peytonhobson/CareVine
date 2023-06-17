import { useMediaQuery } from '@material-ui/core';
import React from 'react';

import { Avatar, Button, SecondaryButton, NamedLink } from '../../../components';
import BookingSummaryCard from '../../CheckoutPage/BookingSummaryCard';
import {
  TRANSITION_ACCEPT_BOOKING,
  TRANSITION_DECLINE_BOOKING,
  STATE_DECLINED,
  STATE_ACCEPTED,
} from '../../../util/transaction';

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
  } = props;

  const {
    lineItems,
    bookingRate,
    paymentMethodType,
    message,
    authorId,
    userId,
    senderName,
    senderListingTitle,
    senderCity,
    senderProfileImage,
    senderDefaultAvatar,
    txId,
    accepted,
    declined,
  } = notification.metadata;

  const notificationId = notification.id;

  const bookingTimes = lineItems.map(l => ({
    date: `${new Date(l.date).getMonth() + 1}/${new Date(l.date).getDate()}`,
    startTime: l.startTime,
    endTime: l.endTime,
  }));
  const bookingDates = lineItems.map(l => new Date(l.date));
  const selectedPaymentMethod =
    paymentMethodType === 'us_bank_account' ? BANK_ACCOUNT : CREDIT_CARD;

  const abbreviatedName =
    senderName.split(' ')[0].substring(0, 1) + senderName.split(' ')[1].substring(0, 1);
  const senderAvatarUser = {
    id: userId,
    profileImage: senderProfileImage,
    attributes: {
      profile: { abbreviatedName, publicData: { defaultAvatar: senderDefaultAvatar } },
    },
  };

  const isLarge = useMediaQuery('(min-width:1024px)');

  return (
    <div className={css.bookingRequestRoot}>
      <h1 className={css.requestTitle}>New Booking Request</h1>
      <div className={css.bookingRequestSubContainer}>
        <div className={css.leftColumn}>
          <div className={css.listingContainer}>
            <div className={css.userInfoContainer}>
              <Avatar
                user={senderAvatarUser}
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
            bookingDates={bookingDates.map(bookingDate => new Date(bookingDate))}
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
          {!accepted && !declined ? (
            <div className={css.acceptDeclineContainer}>
              <Button
                onClick={() =>
                  onTransitionTransaction(txId, TRANSITION_ACCEPT_BOOKING, notificationId, authorId)
                }
                inProgress={transitionTransactionInProgress === TRANSITION_ACCEPT_BOOKING}
              >
                Accept
              </Button>
              <SecondaryButton
                onClick={() =>
                  onTransitionTransaction(
                    txId,
                    TRANSITION_DECLINE_BOOKING,
                    notificationId,
                    authorId
                  )
                }
                className={css.declineButton}
                inProgress={transitionTransactionInProgress === TRANSITION_DECLINE_BOOKING}
              >
                Decline
              </SecondaryButton>
            </div>
          ) : (
            <div className={css.bookingDecisionContainer}>
              {accepted && (
                <>
                  <h2 className={css.bookingAccepted}>Booking Accepted</h2>
                  {/* TODO: Change to my booking page */}
                  <NamedLink className={css.viewBookingLink} name="LandingPage">
                    View Booking
                  </NamedLink>
                </>
              )}
              {declined && <h2 className={css.bookingDeclined}>Booking Declined</h2>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationNewBookingRequest;
