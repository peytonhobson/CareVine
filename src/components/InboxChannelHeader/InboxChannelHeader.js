import React, { useState } from 'react';
import { IconArrowHead, Avatar, NamedLink, Button, RequestPaymentModal } from '..';
import PaymentButton from './CustomButtons/PaymentButton';
import { createSlug } from '../../util/urlHelpers';
import { userDisplayNameAsString } from '../../util/data';
import { EMPLOYER } from '../../util/constants';
import { FormattedMessage } from 'react-intl';

import css from './InboxChannelHeader.module.css';

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
    conversationId,
    onCloseChatModal,
    intl,
    onManageDisableScrolling,
  } = props;

  const [isRequestPaymentModalOpen, setIsRequestPaymentModalOpen] = useState(false);

  const listingId = listing?.id?.uuid;
  const slug = listing && createSlug(listing.attributes.title);

  const otherUserName = userDisplayNameAsString(otherUser);
  const currentUserType = currentUser.attributes.profile.metadata?.userType;

  return (
    <div className={css.channelHeader}>
      {otherUser && (
        <>
          <div className={css.headerLeft}>
            {isMobile && (
              <div className={css.closeButton} onClick={onCloseChatModal} role="button">
                <IconArrowHead
                  direction="left"
                  size="big"
                  height="1.5em"
                  width="1em"
                  rootClassName={css.arrowIcon}
                  onClick={onCloseChatModal}
                />
              </div>
            )}
            {!!listing ? (
              <NamedLink
                className={css.listingLink}
                name="ListingPage"
                params={{ id: listingId, slug }}
              >
                <Avatar
                  className={css.headerAvatar}
                  initialsClassName={css.avatarInitials}
                  user={otherUser}
                  disableProfileLink
                />
                <h1 className={css.channelTitle} style={{ cursor: 'pointer' }}>
                  {otherUserName}
                </h1>
              </NamedLink>
            ) : (
              <div className={css.listingLink}>
                <Avatar
                  className={css.headerAvatar}
                  initialsClassName={css.avatarInitials}
                  user={otherUser}
                  disableProfileLink
                />
                <h1 className={css.channelTitle} style={{ cursor: 'pointer' }}>
                  {otherUserName}
                </h1>
              </div>
            )}
          </div>
          {/* <div className={css.headerRight}>
            {currentUserType === EMPLOYER ? (
              <PaymentButton
                disabled={!otherUser || !listing || fetchOtherUserListingInProgress}
                onOpenPaymentModal={onOpenPaymentModal}
                otherUser={otherUser}
              />
            ) : (
              // TODO: Change this to generic button that opens modal
              <Button
                onClick={() => setIsRequestPaymentModalOpen(true)}
                className={css.requestButton}
              >
                <FormattedMessage id="InboxChannelHeader.requestPayment" />
              </Button>
            )}
          </div> */}
        </>
      )}
      <RequestPaymentModal
        currentUser={currentUser}
        intl={intl}
        onHandleClose={() => setIsRequestPaymentModalOpen(false)}
        isOpen={isRequestPaymentModalOpen}
        otherUser={otherUser}
        otherUserListing={listing}
        onSendRequestForPayment={onSendRequestForPayment}
        conversationId={conversationId}
        sendRequestForPaymentError={sendRequestForPaymentError}
        sendRequestForPaymentInProgress={sendRequestForPaymentInProgress}
        sendRequestForPaymentSuccess={sendRequestForPaymentSuccess}
        onManageDisableScrolling={onManageDisableScrolling}
      ></RequestPaymentModal>
    </div>
  );
};

export default InboxChannelHeader;
