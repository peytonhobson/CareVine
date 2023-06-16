import { useMediaQuery } from '@material-ui/core';
import React from 'react';

import { Avatar, Button, SecondaryButton } from '../../../components';
import BookingSummaryCard from '../../CheckoutPage/BookingSummaryCard';

import css from './NotificationTemplates.module.css';

const BANK_ACCOUNT = 'Bank Account';
const CREDIT_CARD = 'Payment Card';

const NotificationNewBookingRequest = props => {
  const { notification, currentUser, onManageDisableScrolling } = props;

  const {
    lineItems,
    bookingRate,
    stripeCustomerId,
    paymentMethodId,
    paymentMethodType,
    applicationFee,
    message,
    userId,
    authorId,
    senderName,
    senderListingTitle,
    senderCity,
    senderProfileImage,
    senderDefaultAvatar,
  } = notification.metadata;

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
          <div className={css.acceptDeclineContainer}>
            <Button>Accept</Button>
            <SecondaryButton className={css.declineButton}>Decline</SecondaryButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationNewBookingRequest;
