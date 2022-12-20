import '@sendbird/uikit-react/dist/index.css';

import React, { useState } from 'react';

import ChannelAvatar from '@sendbird/uikit-react/ui/ChannelAvatar';
import Badge from '@sendbird/uikit-react/ui/Badge';
import Icon, { IconColors, IconTypes } from '@sendbird/uikit-react/ui/Icon';
import Label, { LabelTypography, LabelColors } from '@sendbird/uikit-react/ui/Label';
import useSendbirdStateContext from '@sendbird/uikit-react/useSendbirdStateContext';
import { u as useLocalization } from '@sendbird/uikit-react/LocalizationContext-3c8d4888.js';
import MentionUserLabel from '@sendbird/uikit-react/ui/MentionUserLabel';
import { u as useChannelListContext } from '@sendbird/uikit-react/ChannelListProvider-95089982.js';
import { TypingIndicatorText } from '@sendbird/uikit-react/Channel/components/TypingIndicator';
import MessageStatus from '@sendbird/uikit-react/ui/MessageStatus';
import { useMediaQuery } from '@mui/material';
import { u as useLongPress } from '@sendbird/uikit-react/useLongPress-e7b1aee7.js';
import { t as truncateString, d as isEditedMessage } from '@sendbird/uikit-react/index-c45e5f15.js';
import {
  i as isToday,
  a as isYesterday,
  f as formatRelative,
} from '@sendbird/uikit-react/index-13e7d10f.js';
import { f as format } from '@sendbird/uikit-react/index-ba11d77d.js';

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

  if (isToday(createdAt)) {
    return format(createdAt, 'p', optionalParam);
  }

  if (isYesterday(createdAt)) {
    return formatRelative(createdAt, new Date(), optionalParam);
  }

  return format(createdAt, 'MMM dd', optionalParam);
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
  tabIndex,
}) => {
  const sbState = useSendbirdStateContext();
  const {
    isTypingIndicatorEnabled = false,
    isMessageReceiptStatusEnabled = false,
    typingChannels,
  } = useChannelListContext();
  const channelListContext = useChannelListContext();
  const { dateLocale, stringSet } = useLocalization();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTyping = typingChannels?.some(({ url }) => url === channel?.url);

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
    {
      onLongPress: () => {
        if (isMobile) {
          setShowMobileLeave(true);
        }
      },
      onClick,
    },
    {
      delay: 1000,
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
        {...(isMobile ? { ...onLongPress } : { onClick })}
      >
        <div className="sendbird-channel-preview__avatar">
          <ChannelAvatar channel={channel} userId={userId} theme={theme} />
        </div>
        <div className="sendbird-channel-preview__content">
          <div className="sendbird-channel-preview__content__upper">
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
                <div style={{ color: isActive ? '#ffffff' : 'var(--marketplaceColorLight' }}>
                  {channelName}
                </div>
              </span>
              <Label
                className="sendbird-channel-preview__content__upper__header__total-members"
                type={LabelTypography.CAPTION_2}
                color={LabelColors.ONBACKGROUND_2}
              >
                {getTotalMembers(channel)}
              </Label>
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
                {getLastMessageCreatedAt(channel, dateLocale)}
              </span>
            )}
          </div>
          <div className="sendbird-channel-preview__content__lower">
            <span
              className="sendbird-channel-preview__content__lower__last-message sendbird-label--color-onbackground-2 sendbird-label--body-2"
              style={{ color: isActive && '#ffffff' }}
            >
              {isChannelTyping && <TypingIndicatorText members={channel?.getTypingUsers()} />}
              {!isChannelTyping &&
                getLastMessage(channel) +
                  (isEditedMessage(channel?.lastMessage) ? ` ${stringSet.MESSAGE_EDITED}` : '')}
            </span>
            <div className="sendbird-channel-preview__content__lower__unread-message-count">
              {isMentionEnabled && channel?.unreadMentionCount > 0 ? (
                <MentionUserLabel
                  className="sendbird-channel-preview__content__lower__unread-message-count__mention"
                  color="purple"
                >
                  {'@'}
                </MentionUserLabel>
              ) : null}
              {getChannelUnreadMessageCount(channel) ? ( // return number
                <Badge count={getChannelUnreadMessageCount(channel)} />
              ) : null}
            </div>
          </div>
        </div>
        {/* {!isMobile && (
          <div className="sendbird-channel-preview__action">{renderChannelAction({ channel })}</div>
        )} */}
      </div>
      {/*
        Event from portal is transferred to parent
        If this modal goes inside channel preview, it will propogate event to
        ChannelPreview and cause many issues with click/touchEnd etc
        https://github.com/facebook/react/issues/11387#issuecomment-340019419
      */}
    </>
  );
};

export default CustomChannelPreview;
