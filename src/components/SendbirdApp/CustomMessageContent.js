import React, { ReactElement, useContext, useRef, useState } from 'react';
import format from 'date-fns/format';
import '@sendbird/uikit-react/dist/index.css';

import { Avatar } from '..';
import UserProfile from '@sendbird/uikit-react/ui/UserProfile';
import MessageStatus from '@sendbird/uikit-react/ui/MessageStatus';
import MessageItemMenu from '@sendbird/uikit-react/ui/MessageItemMenu';
import MessageItemReactionMenu from '@sendbird/uikit-react/ui/MessageItemReactionMenu';
import ContextMenu, { MenuItems } from '@sendbird/uikit-react/ui/ContextMenu';
import Label, { LabelTypography, LabelColors } from '@sendbird/uikit-react/ui/Label';
import EmojiReactions from '@sendbird/uikit-react/ui/EmojiReactions';

import ClientAdminMessage from '@sendbird/uikit-react/ui/AdminMessage';
import TextMessageItemBody from '@sendbird/uikit-react/ui/TextMessageItemBody';
import FileMessageItemBody from '@sendbird/uikit-react/ui/FileMessageItemBody';
import ThumbnailMessageItemBody from '@sendbird/uikit-react/ui/ThumbnailMessageItemBody';
import OGMessageItemBody from '@sendbird/uikit-react/ui/OGMessageItemBody';
import UnknownMessageItemBody from '@sendbird/uikit-react/ui/UnknownMessageItemBody';
import QuoteMessage from '@sendbird/uikit-react/ui/QuoteMessage';

import css from './SendbirdApp.module.css';

import {
  s as isUserMessage,
  v as isSentMessage,
  w as isFailedMessage,
  x as isPendingMessage,
  m as isFileMessage,
  y as copyToClipboard,
  z as getEmojiListAll,
  A as getUIKitMessageTypes,
  o as isThumbnailMessage,
  j as getClassName,
  B as getSenderName,
  C as isTextMessage,
  D as isOGMessage,
  u as getUIKitMessageType,
  d as isVoiceMessage,
} from '@sendbird/uikit-react/index-43834bc0.js';
import { a as UserProfileContext } from '@sendbird/uikit-react/UserProfileContext-cc71f901.js';
import { u as useLocalization } from '@sendbird/uikit-react/LocalizationContext-8725e9b2.js';
import useSendbirdStateContext from '@sendbird/uikit-react/useSendbirdStateContext';
import { u as useLongPress } from '@sendbird/uikit-react/useLongPress-d942e028.js';
import { u as useMediaQueryContext } from '@sendbird/uikit-react/MediaQueryContext-ceb727c7';
import ThreadReplies from '@sendbird/uikit-react/ui/ThreadReplies';
import { T as ThreadReplySelectType } from '@sendbird/uikit-react/const-85535a89.js';

var MobileMenu = function(props) {
  var _a;

  var hideMenu = props.hideMenu,
    channel = props.channel,
    message = props.message,
    replyType = props.replyType,
    userId = props.userId,
    resendMessage = props.resendMessage,
    showEdit = props.showEdit,
    showRemove = props.showRemove,
    setQuoteMessage = props.setQuoteMessage,
    parentRef = props.parentRef;
  var isByMe =
    ((_a = message === null || message === void 0 ? void 0 : message.sender) === null ||
    _a === void 0
      ? void 0
      : _a.userId) === userId;
  var stringSet = useLocalization().stringSet;
  var showMenuItemCopy = isUserMessage(message);
  var showMenuItemEdit = isUserMessage(message) && isSentMessage(message) && isByMe;
  var showMenuItemResend =
    isFailedMessage(message) &&
    (message === null || message === void 0 ? void 0 : message.isResendable) &&
    isByMe;
  var showMenuItemDelete = !isPendingMessage(message) && isByMe;
  var showMenuItemDownload = !isPendingMessage(message) && isFileMessage(message);
  var showMenuItemReply =
    replyType === 'QUOTE_REPLY' &&
    !isFailedMessage(message) &&
    !isPendingMessage(message) &&
    (channel === null || channel === void 0 ? void 0 : channel.isGroupChannel()) &&
    !(channel === null || channel === void 0 ? void 0 : channel.isBroadcast);
  var fileMessage = message;
  return /*#__PURE__*/ React__default.createElement(ContextMenu, {
    isOpen: true,
    menuItems: function() {
      var _a;

      return /*#__PURE__*/ React__default.createElement(
        MenuItems,
        {
          className: 'sendbird-message__mobile-context-menu',
          parentRef: parentRef,
          parentContainRef: parentRef,
          closeDropdown: hideMenu,
        },
        showMenuItemCopy &&
          /*#__PURE__*/ React__default.createElement(
            MenuItem,
            {
              className: 'sendbird-message__mobile-context-menu-item menu-item-copy',
              onClick: function() {
                hideMenu();
                copyToClipboard(message === null || message === void 0 ? void 0 : message.message);
              },
            },
            /*#__PURE__*/ React__default.createElement(
              Label,
              {
                type: LabelTypography.SUBTITLE_1,
              },
              stringSet === null || stringSet === void 0 ? void 0 : stringSet.MESSAGE_MENU__COPY
            ),
            /*#__PURE__*/ React__default.createElement(Icon, {
              type: IconTypes.COPY,
              fillColor: IconColors.PRIMARY,
              width: '24px',
              height: '24px',
            })
          ),
        showMenuItemReply &&
          /*#__PURE__*/ React__default.createElement(
            MenuItem,
            {
              className: 'sendbird-message__mobile-context-menu-item menu-item-reply',
              onClick: function() {
                hideMenu();
                setQuoteMessage(message);
              },
              disable:
                (message === null || message === void 0 ? void 0 : message.parentMessageId) > 0,
            },
            /*#__PURE__*/ React__default.createElement(
              Label,
              {
                type: LabelTypography.SUBTITLE_1,
              },
              stringSet.MESSAGE_MENU__REPLY
            ),
            /*#__PURE__*/ React__default.createElement(Icon, {
              type: IconTypes.REPLY,
              fillColor: IconColors.PRIMARY,
              width: '24px',
              height: '24px',
            })
          ),
        showMenuItemEdit &&
          /*#__PURE__*/ React__default.createElement(
            MenuItem,
            {
              className: 'sendbird-message__mobile-context-menu-item menu-item-edit',
              onClick: function() {
                hideMenu();
                showEdit(true);
              },
            },
            /*#__PURE__*/ React__default.createElement(
              Label,
              {
                type: LabelTypography.SUBTITLE_1,
              },
              stringSet.MESSAGE_MENU__EDIT
            ),
            /*#__PURE__*/ React__default.createElement(Icon, {
              type: IconTypes.EDIT,
              fillColor: IconColors.PRIMARY,
              width: '24px',
              height: '24px',
            })
          ),
        showMenuItemResend &&
          /*#__PURE__*/ React__default.createElement(
            MenuItem,
            {
              className: 'sendbird-message__mobile-context-menu-item menu-item-resend',
              onClick: function() {
                hideMenu();
                resendMessage(message);
              },
            },
            /*#__PURE__*/ React__default.createElement(
              Label,
              {
                type: LabelTypography.SUBTITLE_1,
              },
              stringSet.MESSAGE_MENU__RESEND
            ),
            /*#__PURE__*/ React__default.createElement(Icon, {
              type: IconTypes.REFRESH,
              fillColor: IconColors.PRIMARY,
              width: '24px',
              height: '24px',
            })
          ),
        showMenuItemDelete &&
          /*#__PURE__*/ React__default.createElement(
            MenuItem,
            {
              className: 'sendbird-message__mobile-context-menu-item menu-item-delete',
              onClick: function() {
                hideMenu();
                showRemove(true);
              },
              disable:
                ((_a = message === null || message === void 0 ? void 0 : message.threadInfo) ===
                  null || _a === void 0
                  ? void 0
                  : _a.replyCount) > 0,
            },
            /*#__PURE__*/ React__default.createElement(
              Label,
              {
                type: LabelTypography.SUBTITLE_1,
              },
              stringSet.MESSAGE_MENU__DELETE
            ),
            /*#__PURE__*/ React__default.createElement(Icon, {
              type: IconTypes.DELETE,
              fillColor: IconColors.PRIMARY,
              width: '24px',
              height: '24px',
            })
          ),
        showMenuItemDownload &&
          /*#__PURE__*/ React__default.createElement(
            MenuItem,
            {
              className: 'sendbird-message__mobile-context-menu-item menu-item-save',
              onClick: function() {
                hideMenu();
              },
            },
            /*#__PURE__*/ React__default.createElement(
              'a',
              {
                className: 'sendbird-message__contextmenu--hyperlink',
                rel: 'noopener noreferrer',
                href: fileMessage === null || fileMessage === void 0 ? void 0 : fileMessage.url,
                target: '_blank',
              },
              /*#__PURE__*/ React__default.createElement(
                Label,
                {
                  type: LabelTypography.SUBTITLE_1,
                },
                stringSet.MESSAGE_MENU__SAVE
              ),
              /*#__PURE__*/ React__default.createElement(Icon, {
                type: IconTypes.DOWNLOAD,
                fillColor: IconColors.PRIMARY,
                width: '24px',
                height: '24px',
              })
            )
          )
      );
    },
  });
};

export default function MessageContent({
  className,
  userId,
  channel,
  message,
  disabled = false,
  chainTop = false,
  chainBottom = false,
  isReactionEnabled = false,
  disableQuoteMessage = false,
  replyType,
  threadReplySelectType,
  nicknamesMap,
  emojiContainer,
  scrollToMessage,
  showEdit,
  showRemove,
  showFileViewer,
  resendMessage,
  toggleReaction,
  setQuoteMessage,
  onReplyInThread,
  onQuoteMessageClick,
  otherUser,
}) {
  const messageTypes = getUIKitMessageTypes();
  const { dateLocale } = useLocalization();
  const { config } = useSendbirdStateContext?.() || {};
  const { disableUserProfile, renderUserProfile } = useContext(UserProfileContext);
  const avatarRef = useRef(null);
  const contentRef = useRef(null);
  const { isMobile } = useMediaQueryContext();
  const [showMenu, setShowMenu] = useState(false);
  const [mouseHover, setMouseHover] = useState(false);
  const [supposedHover, setSupposedHover] = useState(false);

  const isByMe =
    userId === message?.sender?.userId ||
    message?.sendingStatus === 'pending' ||
    message?.sendingStatus === 'failed';
  const isByMeClassName = isByMe ? 'outgoing' : 'incoming';
  const chainTopClassName = chainTop ? 'chain-top' : '';
  const isReactionEnabledInChannel = isReactionEnabled && !channel?.isEphemeral;
  const isReactionEnabledClassName = isReactionEnabledInChannel ? 'use-reactions' : '';
  const supposedHoverClassName = supposedHover ? 'sendbird-mouse-hover' : '';
  const useReplying = !!(
    (replyType === 'QUOTE_REPLY' || replyType === 'THREAD') &&
    message?.parentMessageId &&
    message?.parentMessage &&
    !disableQuoteMessage
  );
  const useReplyingClassName = useReplying ? 'use-quote' : '';

  // Thread replies
  const displayThreadReplies = message?.threadInfo?.replyCount > 0 && replyType === 'THREAD';

  // onMouseDown: (e: React.MouseEvent<T>) => void;
  // onTouchStart: (e: React.TouchEvent<T>) => void;
  // onMouseUp: (e: React.MouseEvent<T>) => void;
  // onMouseLeave: (e: React.MouseEvent<T>) => void;
  // onTouchEnd: (e: React.TouchEvent<T>) => void;
  const longPress = useLongPress(
    {
      onLongPress: () => {
        if (isMobile) {
          setShowMenu(true);
        }
      },
      onClick: () => {
        // @ts-ignore
        if (isMobile && isThumbnailMessage(message) && isSentMessage(message)) {
          showFileViewer(true);
        }
      },
    },
    {
      delay: 300,
    }
  );

  if (message?.isAdminMessage?.() || message?.messageType === 'admin') {
    return <ClientAdminMessage message={message} />;
  }
  return (
    <div
      className={getClassName([className, 'sendbird-message-content', isByMeClassName])}
      onMouseOver={() => setMouseHover(true)}
      onMouseLeave={() => setMouseHover(false)}
    >
      {/* left */}
      <div
        className={getClassName([
          'sendbird-message-content__left',
          isReactionEnabledClassName,
          isByMeClassName,
          useReplyingClassName,
        ])}
      >
        {!isByMe && !chainBottom && (
          /** user profile */
          <ContextMenu
            menuTrigger={toggleDropdown => (
              <div className="sendbird-message-content__left__avatar ">
                <Avatar
                  className={css.messageAvatar}
                  user={otherUser}
                  onClick={() => {
                    if (!disableUserProfile) toggleDropdown();
                  }}
                />
              </div>
            )}
            menuItems={closeDropdown => (
              <MenuItems
                /**
                 * parentRef: For catching location(x, y) of MenuItems
                 * parentContainRef: For toggling more options(menus & reactions)
                 */
                parentRef={avatarRef}
                parentContainRef={avatarRef}
                closeDropdown={closeDropdown}
                style={{ paddingTop: '0px', paddingBottom: '0px' }}
              >
                {renderUserProfile ? (
                  // @ts-ignore
                  renderUserProfile({ user: message?.sender, close: closeDropdown })
                ) : (
                  // @ts-ignore
                  <UserProfile user={message.sender} onSuccess={closeDropdown} />
                )}
              </MenuItems>
            )}
          />
        )}
        {/* outgoing menu */}
        {isByMe && !isMobile && (
          <div
            className={getClassName([
              'sendbird-message-content-menu',
              isReactionEnabledClassName,
              supposedHoverClassName,
              isByMeClassName,
            ])}
          >
            <MessageItemMenu
              className="sendbird-message-content-menu__normal-menu"
              channel={channel}
              message={message}
              isByMe={isByMe}
              replyType={replyType}
              disabled={disabled}
              showEdit={showEdit}
              showRemove={showRemove}
              resendMessage={resendMessage}
              setQuoteMessage={setQuoteMessage}
              setSupposedHover={setSupposedHover}
              onReplyInThread={({ message }) => {
                if (threadReplySelectType === ThreadReplySelectType.THREAD) {
                  onReplyInThread({ message });
                } else if (threadReplySelectType === ThreadReplySelectType.PARENT) {
                  scrollToMessage(message.parentMessage.createdAt, message.parentMessageId);
                }
              }}
            />
            {isReactionEnabledInChannel && (
              <MessageItemReactionMenu
                className="sendbird-message-content-menu__reaction-menu"
                message={message}
                userId={userId}
                spaceFromTrigger={{}}
                emojiContainer={emojiContainer}
                toggleReaction={toggleReaction}
                setSupposedHover={setSupposedHover}
              />
            )}
          </div>
        )}
      </div>
      {/* middle */}
      <div
        className="sendbird-message-content__middle"
        {...(isMobile ? { ...longPress } : {})}
        ref={contentRef}
      >
        {!isByMe && !chainTop && !useReplying && (
          <Label
            className="sendbird-message-content__middle__sender-name"
            type={LabelTypography.CAPTION_2}
            color={LabelColors.ONBACKGROUND_2}
          >
            {// @ts-ignore
            channel?.members?.find(member => member?.userId === message?.sender?.userId)
              ?.nickname || getSenderName(message)
            // TODO: Divide getting profileUrl logic to utils
            }
          </Label>
        )}
        {/* quote message */}
        {useReplying ? (
          <div
            className={getClassName([
              'sendbird-message-content__middle__quote-message',
              isByMe ? 'outgoing' : 'incoming',
              useReplyingClassName,
            ])}
          >
            <QuoteMessage
              message={message}
              userId={userId}
              isByMe={isByMe}
              isUnavailable={
                replyType === 'THREAD' &&
                channel?.joinedAt * 1000 > message?.parentMessage?.createdAt
              }
              onClick={() => {
                if (
                  replyType === 'THREAD' &&
                  threadReplySelectType === ThreadReplySelectType.THREAD
                ) {
                  onQuoteMessageClick?.({ message: message });
                }
                if (
                  (replyType === 'QUOTE_REPLY' ||
                    (replyType === 'THREAD' &&
                      threadReplySelectType === ThreadReplySelectType.PARENT)) &&
                  message?.parentMessage?.createdAt &&
                  message?.parentMessageId
                ) {
                  scrollToMessage(message.parentMessage.createdAt, message.parentMessageId);
                }
              }}
            />
          </div>
        ) : null}
        {/* container: message item body + emoji reactions */}
        <div className={getClassName(['sendbird-message-content__middle__body-container'])}>
          {/* message status component */}
          {isByMe && !chainBottom && (
            <div
              className={getClassName([
                'sendbird-message-content__middle__body-container__created-at',
                'left',
                supposedHoverClassName,
              ])}
            >
              <div className="sendbird-message-content__middle__body-container__created-at__component-container">
                <MessageStatus message={message} channel={channel} />
              </div>
            </div>
          )}
          {/* message item body components */}
          {isTextMessage(message) && (
            <TextMessageItemBody
              className="sendbird-message-content__middle__message-item-body"
              message={message}
              isByMe={isByMe}
              mouseHover={mouseHover}
              isMentionEnabled={config?.isMentionEnabled || false}
              isReactionEnabled={isReactionEnabledInChannel}
            />
          )}
          {isOGMessage(message) && (
            <OGMessageItemBody
              className="sendbird-message-content__middle__message-item-body"
              message={message}
              isByMe={isByMe}
              mouseHover={mouseHover}
              isMentionEnabled={config?.isMentionEnabled || false}
              isReactionEnabled={isReactionEnabledInChannel}
            />
          )}
          {getUIKitMessageType(message) === messageTypes.FILE && (
            <FileMessageItemBody
              className="sendbird-message-content__middle__message-item-body"
              message={message}
              isByMe={isByMe}
              mouseHover={mouseHover}
              isReactionEnabled={isReactionEnabledInChannel}
            />
          )}
          {isVoiceMessage(message) && (
            <VoiceMessageItemBody
              className="sendbird-message-content__middle__message-item-body"
              message={message}
              channelUrl={channel?.url}
              isByMe={isByMe}
              isReactionEnabled={isReactionEnabledInChannel}
            />
          )}
          {isThumbnailMessage(message) && (
            <ThumbnailMessageItemBody
              className="sendbird-message-content__middle__message-item-body"
              message={message}
              isByMe={isByMe}
              mouseHover={mouseHover}
              isReactionEnabled={isReactionEnabledInChannel}
              showFileViewer={showFileViewer}
            />
          )}
          {getUIKitMessageType(message) === messageTypes.UNKNOWN && (
            <UnknownMessageItemBody
              className="sendbird-message-content__middle__message-item-body"
              message={message}
              isByMe={isByMe}
              mouseHover={mouseHover}
              isReactionEnabled={isReactionEnabledInChannel}
            />
          )}
          {/* reactions */}
          {isReactionEnabledInChannel && message?.reactions?.length > 0 && (
            <div
              className={getClassName([
                'sendbird-message-content-reactions',
                !isByMe || isThumbnailMessage(message) || isOGMessage(message) ? '' : 'primary',
                mouseHover ? 'mouse-hover' : '',
              ])}
            >
              <EmojiReactions
                userId={userId}
                message={message}
                isByMe={isByMe}
                emojiContainer={emojiContainer}
                memberNicknamesMap={nicknamesMap}
                toggleReaction={toggleReaction}
              />
            </div>
          )}
          {!isByMe && !chainBottom && (
            <Label
              className={getClassName([
                'sendbird-message-content__middle__body-container__created-at',
                'right',
                supposedHoverClassName,
              ])}
              type={LabelTypography.CAPTION_3}
              color={LabelColors.ONBACKGROUND_2}
            >
              {format(message?.createdAt || 0, 'p', {
                locale: dateLocale,
              })}
            </Label>
          )}
        </div>
        {/* thread replies */}
        {displayThreadReplies && (
          <ThreadReplies
            className="sendbird-message-content__middle__thread-replies"
            threadInfo={message?.threadInfo}
            onClick={() => onReplyInThread?.({ message: message })}
          />
        )}
      </div>
      {/* right */}
      <div
        className={getClassName([
          'sendbird-message-content__right',
          chainTopClassName,
          isReactionEnabledClassName,
          useReplyingClassName,
        ])}
      >
        {/* incoming menu */}
        {!isByMe && !isMobile && (
          <div
            className={getClassName([
              'sendbird-message-content-menu',
              chainTopClassName,
              supposedHoverClassName,
              isByMeClassName,
            ])}
          >
            {isReactionEnabledInChannel && (
              <MessageItemReactionMenu
                className="sendbird-message-content-menu__reaction-menu"
                message={message}
                userId={userId}
                spaceFromTrigger={{}}
                emojiContainer={emojiContainer}
                toggleReaction={toggleReaction}
                setSupposedHover={setSupposedHover}
              />
            )}
            <MessageItemMenu
              className="sendbird-message-content-menu__normal-menu"
              channel={channel}
              message={message}
              isByMe={isByMe}
              replyType={replyType}
              disabled={disabled}
              showRemove={showRemove}
              resendMessage={resendMessage}
              setQuoteMessage={setQuoteMessage}
              setSupposedHover={setSupposedHover}
              onReplyInThread={({ message }) => {
                if (threadReplySelectType === ThreadReplySelectType.THREAD) {
                  onReplyInThread({ message });
                } else if (threadReplySelectType === ThreadReplySelectType.PARENT) {
                  scrollToMessage(message.parentMessage.createdAt, message.parentMessageId);
                }
              }}
            />
          </div>
        )}
      </div>
      {showMenu && (message?.isUserMessage?.() || message?.isFileMessage?.()) && (
        <MobileMenu
          parentRef={contentRef}
          channel={channel}
          hideMenu={() => {
            setShowMenu(false);
          }}
          message={message}
          isReactionEnabled={isReactionEnabledInChannel}
          isByMe={isByMe}
          userId={userId}
          replyType={replyType}
          disabled={disabled}
          showRemove={showRemove}
          emojiContainer={emojiContainer}
          resendMessage={resendMessage}
          setQuoteMessage={setQuoteMessage}
          toggleReaction={toggleReaction}
          showEdit={showEdit}
        />
      )}
    </div>
  );
}
