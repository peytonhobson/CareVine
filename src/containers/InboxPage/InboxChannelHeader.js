import React from 'react';
import { IconArrowHead, Avatar, NamedLink } from '../../components';
import PaymentButton from './CustomButtons/PaymentButton';
import RequestPaymentButton from './CustomButtons/RequestPaymentButton';
import { createSlug } from '../../util/urlHelpers';
import { userDisplayNameAsString } from '../../util/data';
import { EMPLOYER } from '../../util/constants';

import css from './InboxPage.module.css';

const InboxChannelHeader = props => {
  const {
    isMobile,
    listing,
    otherUser,
    currentUser,
    fetchOtherUserListingInProgress,
    onOpenPaymentModal,
    onSendRequestForPayment,
    sendRequestForPaymentError,
    sendRequestForPaymentInProgress,
    sendRequestForPaymentSuccess,
  } = props;

  const listingId = listing?.id?.uuid;
  const slug = listing && createSlug(listing);

  const otherUserName = userDisplayNameAsString(otherUser?.attributes?.displayName);
  const currentUserType = currentUser.attributes.profile.metadata?.userType;

  return (
    <div className={css.channelHeader}>
      <div className={css.headerLeft}>
        {isMobile && <IconArrowHead direction="left" size="big" rootClassName={css.arrowIcon} />}
        {!!listing ? (
          <NamedLink
            className={css.listingLink}
            name="ListingPage"
            params={{ id: listingId, slug }}
          >
            <Avatar className={css.headerAvatar} user={otherUser} disableProfileLink />
            <h2 className={css.channelTitle} style={{ cursor: 'pointer' }}>
              {otherUserName}
            </h2>
          </NamedLink>
        ) : (
          <div className={css.listingLink}>
            <Avatar className={css.headerAvatar} user={otherUser} disableProfileLink />
            <h2 className={css.channelTitle} style={{ cursor: 'pointer' }}>
              {otherUserName}
            </h2>
          </div>
        )}
      </div>
      <div className={css.headerRight}>
        {currentUserType === EMPLOYER ? (
          <PaymentButton
            disabled={!otherUser || !listing || fetchOtherUserListingInProgress}
            onOpenPaymentModal={onOpenPaymentModal}
            otherUser={otherUser}
          />
        ) : (
          <RequestPaymentButton
            currentUser={currentUser}
            disabled={!otherUser || !listing || fetchOtherUserListingInProgress}
            onSendRequestForPayment={onSendRequestForPayment}
            otherUser={otherUser}
            otherUserListing={listing}
            sendRequestForPaymentError={sendRequestForPaymentError}
            sendRequestForPaymentInProgress={sendRequestForPaymentInProgress}
            sendRequestForPaymentSuccess={sendRequestForPaymentSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default InboxChannelHeader;
