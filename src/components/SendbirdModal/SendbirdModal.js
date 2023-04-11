import React, { useEffect } from 'react';
import '@sendbird/uikit-react/dist/index.css';
import SBProvider from '@sendbird/uikit-react/SendbirdProvider';
import SBConversation from '@sendbird/uikit-react/Channel';
import { Modal, IconEnquiry, Avatar, IconSpinner } from '../';
import { FormattedMessage } from '../../util/reactIntl';
import CustomMessageInput from './CustomMessageInput';
import { sendgridTemplateEmail, updateUserNotifications } from '../../util/api';
import { userDisplayNameAsString } from '../../util/data';
import { v4 as uuidv4 } from 'uuid';
import { NOTIFICATION_TYPE_NEW_MESSAGE } from '../../util/constants';

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
  const userId = currentUser?.id?.uuid;
  const nickname = currentUser?.attributes?.profile?.displayName;
  const profileUrl = currentUser?.profileImage?.attributes?.variants['square-small']?.url;
  const accessToken = currentUser?.attributes?.profile?.privateData?.sbAccessToken;
  const sendbirdColorSet = {
    '--sendbird-light-primary-500': '#5684a3',
    '--sendbird-light-primary-400': '#5684a3',
    '--sendbird-light-primary-300': '#6ba0b6',
    '--sendbird-light-primary-200': '#6ba0b6',
    '--sendbird-light-primary-100': '#6ba0b6',
  };

  const authorDisplayName = currentAuthor?.attributes?.profile?.displayName;

  useEffect(() => {
    const currentAuthorInMessageChannel = messageChannel?.members?.find(
      member => member?.userId === currentAuthor?.id?.uuid
    );

    if (
      currentAuthor &&
      currentUser &&
      accessToken &&
      !currentAuthorInMessageChannel &&
      !fetchChannelInProgress
    ) {
      onFetchChannel(currentAuthor, currentUser, accessToken);
    }
  }, [currentAuthor, currentUser, accessToken, messageChannel, fetchChannelInProgress]);

  useEffect(() => {
    if (currentUser?.id && !accessToken && !generateAccessTokenInProgress) {
      onGenerateAccessToken(currentUser);
    }
  }, [currentUser, accessToken, generateAccessTokenInProgress]);

  const redirectToInbox = () => {
    const queryParams = {
      limit: 3,
    };
    const query = messageChannel.createPreviousMessageListQuery(queryParams);

    query.load().then(messages => {
      const currentAuthorId = currentAuthor?.id?.uuid;
      const senderName = userDisplayNameAsString(currentUser);

      if (messages?.length <= 1) {
        try {
          sendgridTemplateEmail({
            receiverId: currentAuthorId,
            templateData: {
              marketplaceUrl: process.env.REACT_APP_CANONICAL_ROOT_URL,
              senderName,
              channelUrl: messageChannel.url,
            },
            templateName: 'new-message',
          });
        } catch (e) {
          console.error(e);
        }

        try {
          const newNotification = {
            id: uuidv4(),
            type: NOTIFICATION_TYPE_NEW_MESSAGE,
            createdAt: new Date().getTime(),
            read: false,
            metadata: {
              senderName,
              channelUrl: messageChannel.url,
            },
          };

          updateUserNotifications({ userId: currentAuthorId, newNotification });
        } catch (e) {
          console.error(e);
        }
      }
    });

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
            initialsClassName={css.avatarInitials}
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
