import '@sendbird/uikit-react/dist/index.css';

import React, { useState } from 'react';

import ChannelAvatar from '@sendbird/uikit-react/ui/ChannelAvatar';
import Badge from '../Badge/Badge';
import Icon, { IconColors, IconTypes } from '@sendbird/uikit-react/ui/Icon';
import Label, { LabelTypography, LabelColors } from '@sendbird/uikit-react/ui/Label';
import useSendbirdStateContext from '@sendbird/uikit-react/useSendbirdStateContext';
import { LabelStringSet as stringSet } from '@sendbird/uikit-react/ui/Label';
import { TypingIndicatorText } from '@sendbird/uikit-react/Channel/components/TypingIndicator';
import MessageStatus from '@sendbird/uikit-react/ui/MessageStatus';
import { useMediaQuery } from '@mui/material';
import { useChannelListContext } from '@sendbird/uikit-react/ChannelList/context';
import { timestampToDate } from '../../util/dates';
import moment from 'moment';
import { useLongPress } from 'use-long-press';
import Modal from '@sendbird/uikit-react/ui/Modal';
import TextButton from '@sendbird/uikit-react/ui/TextButton';

const getLastMessageCreatedAt = (channel, locale) => {
  var _channel$lastMessage;

  const createdAt =
    channel === null || channel === void 0
      ? void 0
      : (_channel$lastMessage = channel.lastMessage) === null || _channel$lastMessage === void 0
      ? void 0
      : _channel$lastMessage.createdAt;
  const optionalParam = locale
    ? {
        locale,
      }
    : null;

  if (!createdAt) {
    return '';
  }

  const isToday = dirtyDate => {
    if (!dirtyDate) {
      return false;
    }
    const dateLeftStartOfDay = timestampToDate(dirtyDate).setHours(0, 0, 0, 0);
    const dateRightStartOfDay = new Date().setHours(0, 0, 0, 0);
    return dateLeftStartOfDay === dateRightStartOfDay;
  };

  const isYesterday = dirtyDate => {
    if (!dirtyDate) {
      return false;
    }

    const dateLeftStartOfDay = timestampToDate(dirtyDate).setHours(0, 0, 0, 0);
    const dateRightStartOfDay = new Date().setHours(0, 0, 0, 0);
    return dateLeftStartOfDay === dateRightStartOfDay - 86400000;
  };

  if (isToday(createdAt)) {
    return timestampToDate(createdAt).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  }

  if (isYesterday(createdAt)) {
    return (
      'yesterday at ' +
      timestampToDate(createdAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      })
    );
  }

  return moment(createdAt).format('MMM DD');
};

const truncateString = function(fullStr, strLen) {
  if (!strLen) strLen = 40;
  if (fullStr === null || fullStr === undefined) return '';
  if (fullStr.length <= strLen) return fullStr;
  var separator = '...';
  var sepLen = separator.length;
  var charsToShow = strLen - sepLen;
  var frontChars = Math.ceil(charsToShow / 2);
  var backChars = Math.floor(charsToShow / 2);
  return fullStr.substr(0, frontChars) + separator + fullStr.substr(fullStr.length - backChars);
};

const isUserMessage = function(message) {
  var _a;

  return (
    message &&
    (((_a = message === null || message === void 0 ? void 0 : message.isUserMessage) === null ||
    _a === void 0
      ? void 0
      : _a.call(message)) ||
      (message === null || message === void 0 ? void 0 : message.messageType) === 'user')
  );
};

const isEditedMessage = function(message) {
  return (
    isUserMessage(message) &&
    (message === null || message === void 0 ? void 0 : message.updatedAt) > 0
  );
};

const getChannelTitle = function() {
  var _channel$members;

  let channel = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  let currentUserId = arguments.length > 1 ? arguments[1] : undefined;
  let stringSet =
    arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : LabelStringSet;

  if (
    !(channel !== null && channel !== void 0 && channel.name) &&
    !(channel !== null && channel !== void 0 && channel.members)
  ) {
    return stringSet.NO_TITLE;
  }

  if (channel !== null && channel !== void 0 && channel.name && channel.name !== 'Group Channel') {
    return channel.name;
  }

  if (
    (channel === null || channel === void 0
      ? void 0
      : (_channel$members = channel.members) === null || _channel$members === void 0
      ? void 0
      : _channel$members.length) === 1
  ) {
    return stringSet.NO_MEMBERS;
  }

  return ((channel === null || channel === void 0 ? void 0 : channel.members) || [])
    .filter(_ref => {
      let { userId } = _ref;
      return userId !== currentUserId;
    })
    .map(_ref2 => {
      let { nickname } = _ref2;
      return nickname || stringSet.NO_NAME;
    })
    .join(', ');
};

const getTotalMembers = channel =>
  channel !== null && channel !== void 0 && channel.memberCount ? channel.memberCount : 0;

const getPrettyLastMessage = function() {
  let message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  const MAXLEN = 30;
  const { messageType, name } = message;

  if (messageType === 'file') {
    return truncateString(name, MAXLEN);
  }

  return message.message;
};

const getLastMessage = channel =>
  channel !== null && channel !== void 0 && channel.lastMessage
    ? getPrettyLastMessage(channel.lastMessage)
    : '';
const getChannelUnreadMessageCount = channel =>
  channel !== null && channel !== void 0 && channel.unreadMessageCount
    ? channel.unreadMessageCount
    : 0;

const CustomChannelPreview = ({
  channel,
  isActive = false,
  onClick,
  renderChannelAction,
  onLeaveChannel,
  tabIndex,
}) => {
  const sbState = useSendbirdStateContext();
  const {
    isTypingIndicatorEnabled = false,
    isMessageReceiptStatusEnabled = false,
    typingChannels,
  } = useChannelListContext();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTyping = typingChannels?.some(({ url }) => url === channel?.url);

  const [showMobileLeave, setShowMobileLeave] = useState(false);

  const userId = sbState?.stores?.userStore?.user?.userId;
  const theme = sbState?.config?.theme;
  const isMentionEnabled = sbState?.config?.isMentionEnabled;
  const isFrozen = channel?.isFrozen || false;
  const isBroadcast = channel?.isBroadcast || false;
  const isChannelTyping = isTypingIndicatorEnabled && isTyping;
  const isMessageStatusEnabled =
    isMessageReceiptStatusEnabled &&
    (channel?.lastMessage?.messageType === 'user' ||
      channel?.lastMessage?.messageType === 'file') &&
    channel?.lastMessage?.sender?.userId === userId;

  const onLongPress = useLongPress(
    () => {
      if (isMobile) {
        setShowMobileLeave(true);
      }
    },
    {
      onCancel: () => onClick(),
      threshold: 500,
    }
  );
  const channelName = getChannelTitle(channel, userId, stringSet);
  return (
    <>
      <div
        className={[
          'sendbird-channel-preview',
          isActive ? 'sendbird-channel-preview--active' : '',
        ].join(' ')}
        role="link"
        tabIndex={tabIndex}
        style={{ width: isMobile ? '100%' : 'auto' }}
        {...(isMobile ? { ...onLongPress() } : { onClick })}
      >
        <div className="sendbird-channel-preview__avatar">
          <ChannelAvatar channel={channel} userId={userId} theme={theme} />
        </div>
        <div className="sendbird-channel-preview__content">
          <div className="sendbird-channel-preview__content__upper " style={{ width: '100%' }}>
            <div className="sendbird-channel-preview__content__upper__header">
              {isBroadcast && (
                <div className="sendbird-channel-preview__content__upper__header__broadcast-icon">
                  <Icon
                    type={IconTypes.BROADCAST}
                    fillColor={IconColors.SECONDARY}
                    height="16px"
                    width="16px"
                  />
                </div>
              )}
              <span className="sendbird-channel-preview__content__upper__header__channel-name sendbird-label--subtitle-2">
                <div
                  style={{
                    color: isActive ? '#ffffff' : 'var(--marketplaceColor',
                    userSelect: isMobile && 'none',
                    WebkitUserSelect: isMobile && 'none',
                    msUserSelect: isMobile && 'none',
                  }}
                >
                  {channelName}
                </div>
              </span>
              {isFrozen && (
                <div
                  title="Frozen"
                  className="sendbird-channel-preview__content__upper__header__frozen-icon"
                >
                  <Icon
                    type={IconTypes.FREEZE}
                    fillColor={IconColors.PRIMARY}
                    height={12}
                    width={12}
                  />
                </div>
              )}
            </div>
            {isMessageStatusEnabled ? (
              <MessageStatus
                className="sendbird-channel-preview__content__upper__last-message-at"
                channel={channel}
                message={channel?.lastMessage}
              />
            ) : (
              <span
                className="sendbird-channel-preview__content__upper__last-message-at sendbird-label--color-onbackground-2 sendbird-label--caption-3"
                style={{ color: isActive && '#ffffff' }}
              >
                <div style={{ marginRight: '10px', float: 'left' }}>
                  {getChannelUnreadMessageCount(channel) ? ( // return number
                    <Badge count={getChannelUnreadMessageCount(channel)} />
                  ) : null}
                </div>
                {getLastMessageCreatedAt(channel, null)}
              </span>
            )}
          </div>
          <div className="sendbird-channel-preview__content__lower" style={{ width: '80%' }}>
            <span
              className="sendbird-channel-preview__content__lower__last-message sendbird-label--color-onbackground-2 sendbird-label--body-2"
              style={{
                color: isActive && '#ffffff',
                userSelect: isMobile && 'none',
                WebkitUserSelect: isMobile && 'none',
                msUserSelect: isMobile && 'none',
              }}
            >
              {isChannelTyping && <TypingIndicatorText members={channel?.getTypingUsers()} />}
              {!isChannelTyping &&
                getLastMessage(channel) +
                  (isEditedMessage(channel?.lastMessage) ? ` ${stringSet.MESSAGE_EDITED}` : '')}
            </span>
          </div>
        </div>
        <div className="sendbird-channel-preview__action">{renderChannelAction({ channel })}</div>
      </div>
      {/*
        Event from portal is transferred to parent
        If this modal goes inside channel preview, it will propogate event to
        ChannelPreview and cause many issues with click/touchEnd etc
        https://github.com/facebook/react/issues/11387#issuecomment-340019419
      */}
      {showMobileLeave && isMobile && (
        <Modal
          className="sendbird-channel-preview__leave--mobile"
          titleText={channelName}
          hideFooter
          isCloseOnClickOutside
          onCancel={() => setShowMobileLeave(false)}
        >
          <TextButton
            onClick={() => {
              channel.leave();
              setShowMobileLeave(false);
            }}
            className="sendbird-channel-preview__leave-label--mobile"
          >
            <Label type={LabelTypography.SUBTITLE_1} color={LabelColors.ONBACKGROUND_1}>
              Delete Chat
            </Label>
          </TextButton>
        </Modal>
      )}
    </>
  );
};

export default CustomChannelPreview;
