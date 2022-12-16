import React, { useState, useCallback, useEffect, Fragment } from 'react';

import SBConversation from '@sendbird/uikit-react/Channel';
import ChannelList from '@sendbird/uikit-react/ChannelList';
import SBChannelSettings from '@sendbird/uikit-react/ChannelSettings';
import withSendbird from '@sendbird/uikit-react/withSendbird';
import ChannelListHeader from '@sendbird/uikit-react/ChannelList/components/ChannelListHeader';
import ChannelListUI from '@sendbird/uikit-react/ChannelList/components/ChannelListUI';
import Avatar from '@sendbird/uikit-react/ui/Avatar';
import ChannelPreviewAction from '@sendbird/uikit-react/ChannelList/components/ChannelPreviewAction';
import '@sendbird/uikit-react/dist/index.css';

import CustomMessageItem from './CustomMessageItem';
import CustomChannelPreview from './CustomChannelPreview';
import sendbirdSelectors from '@sendbird/uikit-react/sendbirdSelectors';

import css from './SendbirdApp.module.css';
import { ChannelListProvider } from '@sendbird/uikit-react/ChannelList/context';
import CustomChannelHeader from './CustomChannelHeader';
import useSendbirdStateContext from '@sendbird/uikit-react/useSendbirdStateContext';

export const removeElementsByClass = className => {
  const elements = document.getElementsByClassName(className);
  Array.from(elements).forEach(el => el.parentNode.removeChild(el));
};

export const replaceElementsByClass = (className, replacement) => {
  const elements = document.getElementsByClassName(className);
  elements.forEach(el => el.parentNode.replaceChild(el, replacement));
};

const SendbirdApp = props => {
  // default props
  const {
    stores: { sdkStore, userStore },
    config: { isOnline, userId, appId, accessToken, theme, userListQuery, logger, pubSub },
    sdk,
    updateLastMessage,
    history,
    userEmail,
    ownListing,
    otherUser,
    currentUser,
    otherUserListing,
    onFetchOtherUserListing,
    onFetchOtherUser,
    onOpenPaymentModal,
    onRequestPayment,
    transitionToRequestPaymentInProgress,
    transitionToRequestPaymentError,
    transitionToRequestPaymentSuccess,
    onFetchUserFromChannelUrl,
    onSendRequestForPayment,
    sendRequestForPaymentInProgress,
    sendRequestForPaymentError,
    sendRequestForPaymentSuccess,
  } = props;
  // const logDefaultProps = useCallback(() => {
  //   console.log(
  //     'SDK store list log',
  //     sdkStore.initialized,
  //     sdkStore.sdk,
  //     sdkStore.loading,
  //     sdkStore.error
  //   );
  //   console.log('User store list log', userStore.initialized, userStore.user, userStore.loading);
  //   console.log(
  //     'Config list log',
  //     isOnline,
  //     userId,
  //     appId,
  //     accessToken,
  //     theme,
  //     userListQuery,
  //     logger,
  //     pubSub
  //   );
  // }, [
  //   sdkStore.initialized,
  //   sdkStore.sdk,
  //   sdkStore.loading,
  //   sdkStore.error,
  //   userStore.initialized,
  //   userStore.user,
  //   userStore.loading,
  //   isOnline,
  //   userId,
  //   appId,
  //   accessToken,
  //   theme,
  //   userListQuery,
  //   logger,
  //   pubSub,
  // ]);
  // logDefaultProps();

  // useState
  const [showSettings, setShowSettings] = useState(false);
  const [currentChannelUrl, setCurrentChannelUrl] = useState('');

  const redirectToOwnProfile = () => {
    history.push(`/l/${ownListing.attributes.title}/${ownListing.id.uuid}`);
  };

  useEffect(() => {
    currentChannelUrl && onFetchOtherUserListing(currentChannelUrl, userId);
    currentChannelUrl && onFetchUserFromChannelUrl(currentChannelUrl, userId);
  }, [currentChannelUrl]);

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

  const customListHeader = <ChannelListHeader renderTitle={() => renderTitle} />;

  const customChannelHeader = (
    <CustomChannelHeader
      listing={otherUserListing}
      onOpenPaymentModal={onOpenPaymentModal}
      currentUser={currentUser}
      otherUser={otherUser}
      otherUserListing={otherUserListing}
      onRequestPayment={onRequestPayment}
      transitionToRequestPaymentInProgress={transitionToRequestPaymentInProgress}
      transitionToRequestPaymentError={transitionToRequestPaymentError}
      transitionToRequestPaymentSuccess={transitionToRequestPaymentSuccess}
      channelUrl={currentChannelUrl}
      onSendRequestForPayment={onSendRequestForPayment}
      sendRequestForPaymentInProgress={sendRequestForPaymentInProgress}
      sendRequestForPaymentError={sendRequestForPaymentError}
      sendRequestForPaymentSuccess={sendRequestForPaymentSuccess}
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
              renderHeader={() => customListHeader}
              renderChannelPreview={({ channel, onClick }) => (
                <CustomChannelPreview
                  key={channel?.url}
                  onClick={onClick}
                  channel={channel}
                  isActive={channel?.url === currentChannelUrl}
                  renderChannelAction={() => (
                    <ChannelPreviewAction channel={channel} disabled={!isOnline} />
                  )}
                />
              )}
            />
          </ChannelListProvider>
        </div>
        <div className="sendbird-app__conversation-wrap">
          <SBConversation
            channelUrl={currentChannelUrl}
            renderChannelHeader={() => customChannelHeader}
            renderMessage={({ message, onDeleteMessage, onUpdateMessage, emojiContainer }) => (
              <CustomMessageItem
                message={message}
                onDeleteMessage={onDeleteMessage}
                onUpdateMessage={onUpdateMessage}
                emojiContainer={emojiContainer}
                userId={userId}
                sdk={sdk}
                currentChannel={currentChannelUrl}
                updateLastMessage={updateLastMessage}
                onOpenPaymentModal={onOpenPaymentModal}
                currentUser={currentUser}
                otherUser={otherUser}
              />
            )}
          />
        </div>
      </div>
      {showSettings && (
        <div className="sendbird-app__settingspanel-wrap">
          <SBChannelSettings
            channelUrl={currentChannelUrl}
            onCloseClick={() => {
              setShowSettings(false);
            }}
          />
        </div>
      )}
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
