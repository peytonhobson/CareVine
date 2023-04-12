import React, { useState, useEffect } from 'react';

import { Avatar } from '..';
import ChannelListHeader from '@sendbird/uikit-react/ChannelList/components/ChannelListHeader';
import { ChannelListProvider } from '@sendbird/uikit-react/ChannelList/context';
import ChannelListUI from '@sendbird/uikit-react/ChannelList/components/ChannelListUI';
import CustomChannelHeader from './CustomChannelHeader';
import SBConversation from '@sendbird/uikit-react/Channel';
import '@sendbird/uikit-react/dist/index.css';
import sendbirdSelectors from '@sendbird/uikit-react/sendbirdSelectors';
import withSendbird from '@sendbird/uikit-react/withSendbird';

import CustomChannelPreview from './CustomChannelPreview';
import CustomChannelPreviewAction from './CustomChannelPreviewAction';
import { LISTING_PAGE_PARAM_TYPE_NEW, LISTING_PAGE_PARAM_TYPE_DRAFT } from '../../util/urlHelpers';

import css from './SendbirdApp.module.css';

const newListingStates = [LISTING_PAGE_PARAM_TYPE_NEW, LISTING_PAGE_PARAM_TYPE_DRAFT];

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
    pathParams,
    onFetchOtherUsers,
    otherUsers,
    fetchOtherUsersError,
    fetchOtherUsersInProgress,
  } = props;

  const [currentChannelUrl, setCurrentChannelUrl] = useState('');

  const redirectToOwnProfile = () => {
    const pendingString =
      ownListing.attributes.state === 'pendingApproval' ? '/pending-approval' : '';
    const isNewListing = newListingStates.includes(ownListing.attributes.state);
    if (!isNewListing) {
      history.push(`/l/${ownListing.attributes.title}/${ownListing.id.uuid}${pendingString}`);
    }
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

  useEffect(() => {
    if (pathParams?.channel) {
      setTimeout(() => {
        setCurrentChannelUrl(pathParams.channel);
      }, 500);
    }
  }, [pathParams]);

  useEffect(() => {
    if (currentUser.id.uuid && accessToken) {
      onFetchOtherUsers(currentUser.id.uuid, accessToken);
    }
  }, [currentUser.id.uuid, accessToken]);

  const userEmail = currentUser.attributes.email;
  const renderTitle = (
    <div
      className="sendbird-channel-header__title"
      role="button"
      onClick={redirectToOwnProfile}
      onKeyDown={redirectToOwnProfile}
      tabIndex={0}
      style={{ backgroundColor: 'var(--matterColorNegative)' }}
    >
      <div className={css.titleAvatarContainer}>
        <Avatar className={css.avatar} user={currentUser} disableProfileLink />
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
              if (channel && channel?.url !== currentChannelUrl) {
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
                  otherUser={otherUsers?.find(user =>
                    channel?.members.find(member => member.userId === user.id.uuid)
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
