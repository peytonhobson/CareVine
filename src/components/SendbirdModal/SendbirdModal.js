import React, { useEffect } from 'react';
import '@sendbird/uikit-react/dist/index.css';
import SBProvider from '@sendbird/uikit-react/SendbirdProvider';
import SBConversation from '@sendbird/uikit-react/Channel';
import { Modal, IconEnquiry, Avatar, IconSpinner } from '../';
import { FormattedMessage } from '../../util/reactIntl';
import CustomMessageInput from './CustomMessageInput';

import css from './SendbirdModal.module.css';

const SendbirdModal = props => {
  const {
    isOpen,
    onClose,
    currentUser,
    onManageDisableScrolling,
    currentAuthor,
    onFetchChannel,
    messageChannel,
    fetchChannelInProgress,
    fetchChannelError,
    history,
    onGenerateAccessToken,
    generateAccessTokenInProgress,
    containerClassName,
  } = props;

  const appId = process.env.REACT_APP_SENDBIRD_APP_ID;
  const userId = currentUser && currentUser.id && currentUser.id.uuid;
  const nickname =
    currentUser && currentUser.attributes && currentUser.attributes.profile.displayName;
  const profileUrl =
    currentUser &&
    currentUser.profileImage &&
    currentUser.profileImage.attributes.variants['square-small'].url;
  const accessToken =
    currentUser &&
    currentUser.attributes &&
    currentUser.attributes.profile.privateData &&
    currentUser.attributes.profile.privateData.sbAccessToken;
  const sendbirdColorSet = {
    '--sendbird-light-primary-500': '#5684a3',
    '--sendbird-light-primary-400': '#5684a3',
    '--sendbird-light-primary-300': '#6ba0b6',
    '--sendbird-light-primary-200': '#6ba0b6',
    '--sendbird-light-primary-100': '#6ba0b6',
  };

  const authorDisplayName =
    currentAuthor && currentAuthor.attributes && currentAuthor.attributes.profile.displayName;

  useEffect(() => {
    if (currentAuthor && currentUser && accessToken && !messageChannel && !fetchChannelInProgress) {
      onFetchChannel(currentAuthor, currentUser, accessToken);
    }
  }, [currentAuthor, currentUser, accessToken, messageChannel, fetchChannelInProgress]);

  useEffect(() => {
    if (!!currentUser && !!currentUser.id && !accessToken && !generateAccessTokenInProgress) {
      onGenerateAccessToken(currentUser);
    }
  }, [currentUser, accessToken, generateAccessTokenInProgress]);

  const redirectToInbox = () => {
    history.push('/inbox');
  };

  return (
    <Modal
      id="SendbirdModal"
      contentClassName={css.enquiryModalContent}
      containerClassName={containerClassName}
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
    >
      <div className={css.header}>
        <div className={css.leftHeader}>
          <IconEnquiry className={css.icon} />
          <h2 className={css.heading}>
            <FormattedMessage
              id="SendbirdModal.heading"
              values={{ displayName: authorDisplayName }}
            />
          </h2>
        </div>
        <div className={css.rightHeader}>
          <Avatar
            rootClassName={css.avatarRoot}
            className={css.avatar}
            user={currentAuthor}
            disableProfileLink
          />
        </div>
      </div>
      <SBProvider
        appId={appId}
        userId={userId}
        accessToken={accessToken}
        nickname={nickname}
        profileUrl={profileUrl}
        colorSet={sendbirdColorSet}
      >
        <div className={css.customizedApp}>
          {!fetchChannelInProgress && messageChannel ? (
            <SBConversation
              channelUrl={messageChannel && messageChannel.url}
              renderChannelHeader={() => <></>}
              renderMessageInput={() => (
                <CustomMessageInput afterSendMessageMaybe={redirectToInbox} />
              )}
            />
          ) : fetchChannelError ? (
            <div className={css.error}>
              <FormattedMessage id="SendbirdModal.fetchChannelErrorMessage" />
            </div>
          ) : (
            <IconSpinner className={css.spinner} />
          )}
        </div>
      </SBProvider>
    </Modal>
  );
};

export default SendbirdModal;
