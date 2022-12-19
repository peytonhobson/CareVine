import React from 'react';
import Icon, { IconTypes, IconColors } from '@sendbird/uikit-react/ui/Icon';
import IconButton from '@sendbird/uikit-react/ui/IconButton';
import ChannelAvatar from '@sendbird/uikit-react/ui/ChannelAvatar';
import { LabelStringSet } from '@sendbird/uikit-react/ui/Label';
import { useChannelContext } from '@sendbird/uikit-react/Channel/context';
import useSendbirdStateContext from '@sendbird/uikit-react/useSendbirdStateContext';
import { useMediaQuery } from '@mui/material';
import { NamedLink } from '../';
import { createSlug } from '../../util/urlHelpers';
import css from './SendbirdApp.module.css';
import { EMPLOYER } from '../../util/constants';
import PaymentButton from './CustomButtons/PaymentButton';
import RequestPaymentButton from './CustomButtons/RequestPaymentButton';

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
    channelUrl,
    onSendRequestForPayment,
    sendRequestForPaymentInProgress,
    sendRequestForPaymentError,
    sendRequestForPaymentSuccess,
    fetchUserFromChannelUrlInProgress,
  } = props;
  const slug = createSlug((listing && listing.title) || '');
  const listingId = (listing && listing.id.uuid) || 'a';

  const channelStore = useChannelContext();
  const sendbirdContext = useSendbirdStateContext();

  const { currentGroupChannel, onSearchClick } = channelStore;

  const isMobile = useMediaQuery('(max-width: 768px)');

  const currentUserType =
    currentUser &&
    currentUser.attributes &&
    currentUser.attributes.profile &&
    currentUser.attributes.profile.metadata &&
    currentUser.attributes.profile.metadata.userType;

  const {
    config: { userId, theme },
  } = sendbirdContext;

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
        {currentUserType === EMPLOYER ? (
          <PaymentButton
            onOpenPaymentModal={onOpenPaymentModal}
            otherUser={otherUser}
            channelUrl={channelUrl}
            sendbirdContext={sendbirdContext}
            fetchUserFromChannelUrlInProgress={fetchUserFromChannelUrlInProgress}
          />
        ) : (
          <RequestPaymentButton
            currentUser={currentUser}
            otherUser={otherUser}
            channelUrl={channelUrl}
            sendbirdContext={sendbirdContext}
            otherUserListing={otherUserListing}
            onSendRequestForPayment={onSendRequestForPayment}
            sendRequestForPaymentInProgress={sendRequestForPaymentInProgress}
            sendRequestForPaymentErro={sendRequestForPaymentError}
            sendRequestForPaymentSuccess={sendRequestForPaymentSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default CustomChannelHeader;
