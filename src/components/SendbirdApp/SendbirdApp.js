import React, { useState, useEffect } from 'react';

import Avatar from '@sendbird/uikit-react/ui/Avatar';
import ChannelListHeader from '@sendbird/uikit-react/ChannelList/components/ChannelListHeader';
import { ChannelListProvider } from '@sendbird/uikit-react/ChannelList/context';
import ChannelListUI from '@sendbird/uikit-react/ChannelList/components/ChannelListUI';
import ChannelPreviewAction from '@sendbird/uikit-react/ChannelList/components/ChannelPreviewAction';
import CustomChannelHeader from './CustomChannelHeader';
import SBConversation from '@sendbird/uikit-react/Channel';
import '@sendbird/uikit-react/dist/index.css';
import sendbirdSelectors from '@sendbird/uikit-react/sendbirdSelectors';
import withSendbird from '@sendbird/uikit-react/withSendbird';

import CustomChannelPreview from './CustomChannelPreview';
import CustomMessageItem from './CustomMessageItem';
import CustomChannelPreviewAction from './CustomChannelPreviewAction';

import css from './SendbirdApp.module.css';

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

const SendbirdApp = props => {
  const {
    config: { isOnline, userId, appId, accessToken, theme, userListQuery, logger, pubSub },
    currentUser,
    fetchOtherUserListingError,
    fetchOtherUserListingInProgress,
    fetchUserFromChannelUrlError,
    fetchUserFromChannelUrlInProgress,
    history,
    isPaymentModalOpen,
    onFetchOtherUserListing,
    onFetchUserFromChannelUrl,
    onOpenPaymentModal,
    onRequestPayment,
    onSendRequestForPayment,
    otherUser,
    otherUserListing,
    ownListing,
    sdk,
    sendRequestForPaymentError,
    sendRequestForPaymentInProgress,
    sendRequestForPaymentSuccess,
    stores: { sdkStore, userStore },
    transitionToRequestPaymentError,
    transitionToRequestPaymentInProgress,
    transitionToRequestPaymentSuccess,
    updateLastMessage,
  } = props;

  const [currentChannelUrl, setCurrentChannelUrl] = useState('');

  const redirectToOwnProfile = () => {
    const pendingString =
      ownListing.attributes.state === 'pendingApproval' ? '/pending-approval' : '';
    history.push(`/l/${ownListing.attributes.title}/${ownListing.id.uuid}${pendingString}`);
  };

  useEffect(() => {
    ((currentChannelUrl !== '' && accessToken) || !!fetchOtherUserListingError) &&
      onFetchOtherUserListing(currentChannelUrl, userId, accessToken);
    ((currentChannelUrl !== '' && accessToken) || !!fetchUserFromChannelUrlError) &&
      onFetchUserFromChannelUrl(currentChannelUrl, userId, accessToken);
  }, [currentChannelUrl, accessToken, fetchUserFromChannelUrlError, fetchOtherUserListingError]);

  useEffect(() => {
    pubSub &&
      pubSub.publish('PAYMENT_MODAL_DISPLAY_CHANGE', {
        isPaymentModalOpen,
      });
  }, [isPaymentModalOpen]);

  useEffect(() => {
    pubSub &&
      pubSub.publish('OTHER_USER_CHANGE', {
        otherUser,
      });
  }, [otherUser]);

  const userEmail = currentUser.attributes.email;
  const renderTitle = (
    <div
      className="sendbird-channel-header__title"
      role="button"
      onClick={redirectToOwnProfile}
      onKeyDown={redirectToOwnProfile}
      tabIndex={0}
    >
      <div className="sendbird-channel-header__title__left">
        <Avatar
          width="32px"
          height="32px"
          src={userStore.user.profileUrl}
          alt={userStore.user.nickname}
        />
      </div>
      <div className="sendbird-channel-header__title__right">
        <label
          className="sendbird-channel-header__title__right__name sendbird-label sendbird-label--subtitle-2 sendbird-label--color-onbackground-1"
          style={{ paddingTop: 0 }}
        >
          {userStore.user.nickname || ''}
        </label>
        <label
          className="sendbird-channel-header__title__right__user-id sendbird-label sendbird-label--body-2 sendbird-label--color-onbackground-2"
          style={{ paddingTop: 0 }}
        >
          {userEmail}
        </label>
      </div>
    </div>
  );

  const customChannelHeader = (
    <CustomChannelHeader
      channelUrl={currentChannelUrl}
      currentUser={currentUser}
      fetchOtherUserListingInProgress={fetchOtherUserListingInProgress}
      fetchUserFromChannelUrlInProgress={fetchUserFromChannelUrlInProgress}
      listing={otherUserListing}
      onOpenPaymentModal={onOpenPaymentModal}
      onRequestPayment={onRequestPayment}
      onSendRequestForPayment={onSendRequestForPayment}
      otherUser={otherUser}
      sendRequestForPaymentError={sendRequestForPaymentError}
      sendRequestForPaymentInProgress={sendRequestForPaymentInProgress}
      sendRequestForPaymentSuccess={sendRequestForPaymentSuccess}
      transitionToRequestPaymentError={transitionToRequestPaymentError}
      transitionToRequestPaymentInProgress={transitionToRequestPaymentInProgress}
      transitionToRequestPaymentSuccess={transitionToRequestPaymentSuccess}
    />
  );

  return (
    <div className={css.customizedApp}>
      <div className="sendbird-app__wrap">
        <div className="sendbird-app__channellist-wrap">
          <ChannelListProvider
            onChannelSelect={channel => {
              if (channel && channel.url) {
                setCurrentChannelUrl(channel.url);
              }
            }}
          >
            <ChannelListUI
              renderChannelPreview={({ channel, onClick }) => (
                <CustomChannelPreview
                  key={channel?.url}
                  onClick={onClick}
                  channel={channel}
                  isActive={channel?.url === currentChannelUrl}
                  renderChannelAction={() => (
                    <CustomChannelPreviewAction channel={channel} disabled={!isOnline} />
                  )}
                />
              )}
              renderHeader={() => <ChannelListHeader renderTitle={() => renderTitle} />}
            />
          </ChannelListProvider>
        </div>
        <div className="sendbird-app__conversation-wrap">
          <SBConversation
            channelUrl={currentChannelUrl}
            renderChannelHeader={() => customChannelHeader}
            disableUserProfile
            renderMessage={({ message, onDeleteMessage, onUpdateMessage, emojiContainer }) => (
              <CustomMessageItem
                currentChannel={currentChannelUrl}
                currentUser={currentUser}
                emojiContainer={emojiContainer}
                isPaymentModalOpen={isPaymentModalOpen}
                message={message}
                onDeleteMessage={onDeleteMessage}
                onOpenPaymentModal={onOpenPaymentModal}
                onUpdateMessage={onUpdateMessage}
                otherUser={otherUser}
                sdk={sdk}
                updateLastMessage={updateLastMessage}
                userId={userId}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default withSendbird(SendbirdApp, store => {
  return {
    sdk: sendbirdSelectors.getSdk(store),
    updateLastMessage: sendbirdSelectors.getUpdateUserMessage(store),
    stores: store.stores,
    config: store.config,
  };
});
