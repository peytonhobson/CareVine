import React from 'react';

import Icon, { IconTypes, IconColors } from '@sendbird/uikit-react/ui/Icon';
import ChannelAvatar from '@sendbird/uikit-react/ui/ChannelAvatar';
import { LabelStringSet } from '@sendbird/uikit-react/ui/Label';
import { useChannelContext } from '@sendbird/uikit-react/Channel/context';
import useSendbirdStateContext from '@sendbird/uikit-react/useSendbirdStateContext';
import { useMediaQuery } from '@mui/material';

import { NamedLink } from '../';
import { createSlug } from '../../util/urlHelpers';
import { EMPLOYER } from '../../util/constants';
import PaymentButton from './CustomButtons/PaymentButton';
import RequestPaymentButton from './CustomButtons/RequestPaymentButton';

import css from './SendbirdApp.module.css';

export const getChannelTitle = (channel, currentUserId) => {
  const LABEL_STRING_SET = LabelStringSet;
  if (!channel?.name && !channel?.members) {
    return LABEL_STRING_SET.NO_TITLE;
  }
  if (channel?.name && channel.name !== 'Group Channel') {
    return channel.name;
  }

  if (channel?.members?.length === 1) {
    return LABEL_STRING_SET.NO_MEMBERS;
  }

  return channel?.members
    .filter(({ userId }) => userId !== currentUserId)
    .map(({ nickname }) => nickname || LABEL_STRING_SET.NO_NAME)
    .join(', ');
};

const CustomChannelHeader = props => {
  const {
    channelUrl,
    currentUser,
    fetchUserFromChannelUrlInProgress,
    listing,
    onOpenPaymentModal,
    onSendRequestForPayment,
    otherUser,
    sendRequestForPaymentError,
    sendRequestForPaymentInProgress,
    sendRequestForPaymentSuccess,
    fetchOtherUserListingInProgress,
    onReturnToChannelList,
  } = props;

  const slug = listing && createSlug(listing);
  const listingId = listing && listing.id.uuid;

  const channelContext = useChannelContext();
  const sendbirdContext = useSendbirdStateContext();

  const { currentGroupChannel } = channelContext;

  const isMobile = useMediaQuery('(max-width: 768px)');

  const currentUserType =
    currentUser.attributes.profile.metadata && currentUser.attributes.profile.metadata.userType;

  const {
    config: { userId, theme },
  } = sendbirdContext;

  const userContent = (
    <>
      {isMobile && (
        <Icon
          className="sendbird-chat-header__icon_back"
          fillColor={IconColors.PRIMARY}
          height="24px"
          type={IconTypes.ARROW_LEFT}
          width="24px"
          onClick={onReturnToChannelList}
        />
      )}
      {!!listing ? (
        <NamedLink className={css.listingLink} name="ListingPage" params={{ id: listingId, slug }}>
          <ChannelAvatar
            channel={currentGroupChannel}
            height={32}
            theme={theme}
            userId={userId}
            width={32}
          />
          <h2
            className="sendbird-chat-header__left__title sendbird-label sendbird-label--color-onbackground-1"
            style={{ cursor: 'pointer' }}
          >
            {getChannelTitle(currentGroupChannel, userId)}
          </h2>
        </NamedLink>
      ) : (
        <div className={css.listingLink}>
          <ChannelAvatar
            channel={currentGroupChannel}
            height={32}
            theme={theme}
            userId={userId}
            width={32}
          />
          <h2
            className="sendbird-chat-header__left__title sendbird-label sendbird-label--color-onbackground-1"
            style={{ cursor: 'pointer' }}
          >
            {getChannelTitle(currentGroupChannel, userId)}
          </h2>
        </div>
      )}
    </>
  );

  return (
    <div className="sendbird-chat-header">
      <div className="sendbird-chat-header__left">{userContent}</div>
      <div className="sendbird-chat-header__right">
        {currentUserType === EMPLOYER ? (
          <PaymentButton
            channelContext={channelContext}
            channelUrl={channelUrl}
            disabled={!otherUser}
            fetchUserFromChannelUrlInProgress={fetchUserFromChannelUrlInProgress}
            onOpenPaymentModal={onOpenPaymentModal}
            otherUser={otherUser}
            sendbirdContext={sendbirdContext}
          />
        ) : (
          <RequestPaymentButton
            channelContext={channelContext}
            channelUrl={channelUrl}
            currentUser={currentUser}
            disabled={
              !otherUser ||
              !listing ||
              fetchUserFromChannelUrlInProgress ||
              fetchOtherUserListingInProgress
            }
            onSendRequestForPayment={onSendRequestForPayment}
            otherUser={otherUser}
            otherUserListing={listing}
            sendbirdContext={sendbirdContext}
            sendRequestForPaymentError={sendRequestForPaymentError}
            sendRequestForPaymentInProgress={sendRequestForPaymentInProgress}
            sendRequestForPaymentSuccess={sendRequestForPaymentSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default CustomChannelHeader;
