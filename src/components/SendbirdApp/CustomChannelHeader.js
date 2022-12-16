import React from 'react';
import Icon, { IconTypes, IconColors } from '@sendbird/uikit-react/ui/Icon';
import IconButton from '@sendbird/uikit-react/ui/IconButton';
import ChannelAvatar from '@sendbird/uikit-react/ui/ChannelAvatar';
import { LabelStringSet } from '@sendbird/uikit-react/ui/Label';
import { useChannelContext } from '@sendbird/uikit-react/Channel/context';
import useSendbirdStateContext from '@sendbird/uikit-react/useSendbirdStateContext';
import { useMediaQuery } from '@mui/material';
import { NamedLink, PaymentButton } from '../';
import { createSlug } from '../../util/urlHelpers';
import css from './SendbirdApp.module.css';

export const getChannelTitle = (channel, currentUserId, stringSet) => {
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
    listing,
    onOpenPaymentModal,
    currentUser,
    otherUser,
    otherUserListing,
    onRequestPayment,
    transitionToRequestPaymentInProgress,
    transitionToRequestPaymentError,
    transitionToRequestPaymentSuccess,
    channelUrl,
    onSendRequestForPayment,
    sendRequestForPaymentInProgress,
    sendRequestForPaymentError,
    sendRequestForPaymentSuccess,
  } = props;
  const slug = createSlug((listing && listing.title) || '');
  const listingId = (listing && listing.id.uuid) || 'a';

  const channelStore = useChannelContext();
  const globalStore = useSendbirdStateContext();

  const { currentGroupChannel, onSearchClick } = channelStore;

  const isMobile = useMediaQuery('(max-width: 768px)');

  const {
    stores: { sdkStore, userStore },
    config: { isOnline, userId, appId, accessToken, theme, userListQuery, logger, pubSub },
  } = globalStore;

  return (
    <div className="sendbird-chat-header">
      <div className="sendbird-chat-header__left">
        <NamedLink className={css.listingLink} name="ListingPage" params={{ id: listingId, slug }}>
          {isMobile && (
            <Icon
              className="sendbird-chat-header__icon_back"
              fillColor={IconColors.PRIMARY}
              width="24px"
              height="24px"
              type={IconTypes.ARROW_LEFT}
            />
          )}
          <ChannelAvatar
            theme={theme}
            channel={currentGroupChannel}
            userId={userId}
            height={32}
            width={32}
          />
          <label
            className="sendbird-chat-header__left__title sendbird-label sendbird-label--h-2 sendbird-label--color-onbackground-1"
            style={{ cursor: 'pointer' }}
          >
            {getChannelTitle(currentGroupChannel, userId)}
          </label>
        </NamedLink>
      </div>
      <div className="sendbird-chat-header__right">
        <PaymentButton
          onOpenPaymentModal={onOpenPaymentModal}
          currentUser={currentUser}
          otherUser={otherUser}
          channelUrl={channelUrl}
          channelContext={globalStore}
          onSendRequestForPayment={onSendRequestForPayment}
          sendRequestForPaymentInProgress={sendRequestForPaymentInProgress}
          sendRequestForPaymentError={sendRequestForPaymentError}
          sendRequestForPaymentSuccess={sendRequestForPaymentSuccess}
        />
      </div>
    </div>
  );
};

export default CustomChannelHeader;
