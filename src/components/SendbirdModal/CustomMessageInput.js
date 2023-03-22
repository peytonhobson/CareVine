import React, { useState, useContext, useEffect } from 'react';

import '@sendbird/uikit-react/dist/index.css';

import MessageInput from '@sendbird/uikit-react/ui/MessageInput';
import QuoteMessageInput from '@sendbird/uikit-react/ui/QuoteMessageInput';
import { useChannelContext } from '@sendbird/uikit-react/Channel/context';
import useSendbirdStateContext from '@sendbird/uikit-react/useSendbirdStateContext';
import SuggestedMentionList from '@sendbird/uikit-react/Channel/components/SuggestedMentionList';
import { LabelStringSet as stringSet } from '@sendbird/uikit-react/ui/Label';

const isOperatorFunc = function() {
  let groupChannel = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  const myRole = groupChannel === null || groupChannel === void 0 ? void 0 : groupChannel.myRole;
  return myRole === 'operator';
};
const isDisabledBecauseFrozen = function() {
  let groupChannel = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  const isFrozen =
    groupChannel === null || groupChannel === void 0 ? void 0 : groupChannel.isFrozen;
  return isFrozen && !isOperator(groupChannel);
};
const isDisabledBecauseMuted = function() {
  let groupChannel = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  const myMutedState =
    groupChannel === null || groupChannel === void 0 ? void 0 : groupChannel.myMutedState;
  return myMutedState === 'muted';
};

const MessageInputWrapper = (props, ref) => {
  const { value, afterSendMessageMaybe } = props;
  const {
    currentGroupChannel,
    initialized,
    quoteMessage,
    sendMessage,
    sendFileMessage,
    setQuoteMessage,
    messageInputRef,
    renderUserMentionItem,
  } = useChannelContext();
  const globalStore = useSendbirdStateContext();
  const channel = currentGroupChannel;

  const MessageInputKeys = {
    Enter: 'Enter',
    ArrowUp: 'ArrowUp',
    ArrowDown: 'ArrowDown',
    Backspace: 'Backspace',
  };

  const { isOnline, isMentionEnabled, userMention } = globalStore?.config;
  const maxUserMentionCount = userMention?.maxMentionCount || 10;
  const maxUserSuggestionCount = userMention?.maxSuggestionCount || 15;

  const [mentionNickname, setMentionNickname] = useState('');
  const [mentionedUsers, setMentionedUsers] = useState([]);
  const [mentionedUserIds, setMentionedUserIds] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [mentionSuggestedUsers, setMentionSuggestedUsers] = useState([]);
  const [ableMention, setAbleMention] = useState(true);
  const [messageInputEvent, setMessageInputEvent] = useState(null);
  const disabled =
    !initialized ||
    isDisabledBecauseFrozen(channel) ||
    isDisabledBecauseMuted(channel) ||
    !isOnline;
  const isOperator = isOperatorFunc(channel);
  const isBroadcast = channel?.isBroadcast;

  const displaySuggestedMentionList =
    isOnline &&
    isMentionEnabled &&
    mentionNickname.length > 0 &&
    !isDisabledBecauseFrozen(channel) &&
    !isDisabledBecauseMuted(channel);

  // Reset when channel changes
  useEffect(() => {
    setMentionNickname('');
    setMentionedUsers([]);
    setMentionedUserIds([]);
    setSelectedUser(null);
    setMentionSuggestedUsers([]);
    setAbleMention(true);
    setMessageInputEvent(null);
  }, [channel?.url]);

  useEffect(() => {
    if (mentionedUsers?.length >= maxUserMentionCount) {
      setAbleMention(false);
    } else {
      setAbleMention(true);
    }
  }, [mentionedUsers]);

  useEffect(() => {
    setMentionedUsers(
      mentionedUsers.filter(({ userId }) => {
        const i = mentionedUserIds.indexOf(userId);
        if (i < 0) {
          return false;
        } else {
          mentionedUserIds.splice(i, 1);
          return true;
        }
      })
    );
  }, [mentionedUserIds]);

  // broadcast channel + not operator
  if (isBroadcast && !isOperator) {
    return null;
  }
  // other conditions
  return (
    <div className="sendbird-message-input-wrapper">
      {displaySuggestedMentionList && (
        <SuggestedMentionList
          targetNickname={mentionNickname}
          inputEvent={messageInputEvent}
          renderUserMentionItem={renderUserMentionItem}
          onUserItemClick={user => {
            if (user) {
              setMentionedUsers([...mentionedUsers, user]);
            }
            setMentionNickname('');
            setSelectedUser(user);
            setMessageInputEvent(null);
          }}
          onFocusItemChange={() => {
            setMessageInputEvent(null);
          }}
          onFetchUsers={users => {
            setMentionSuggestedUsers(users);
          }}
          ableAddMention={ableMention}
          maxMentionCount={maxUserMentionCount}
          maxSuggestionCount={maxUserSuggestionCount}
        />
      )}
      {quoteMessage && (
        <div className="sendbird-message-input-wrapper__quote-message-input">
          <QuoteMessageInput replyingMessage={quoteMessage} onClose={() => setQuoteMessage(null)} />
        </div>
      )}
      <MessageInput
        className="sendbird-message-input-wrapper__message-input"
        value={value}
        channelUrl={channel?.url}
        mentionSelectedUser={selectedUser}
        isMentionEnabled={isMentionEnabled}
        placeholder={
          (quoteMessage && stringSet.MESSAGE_INPUT__QUOTE_REPLY__PLACE_HOLDER) ||
          (isDisabledBecauseFrozen(channel) && stringSet.MESSAGE_INPUT__PLACE_HOLDER__DISABLED) ||
          (isDisabledBecauseMuted(channel) && stringSet.MESSAGE_INPUT__PLACE_HOLDER__MUTED)
        }
        ref={ref || messageInputRef}
        disabled={disabled}
        onStartTyping={() => {
          channel?.startTyping();
        }}
        onSendMessage={({ message, mentionTemplate }) => {
          sendMessage({
            message,
            quoteMessage,
            mentionedUsers,
            mentionTemplate,
          });
          setMentionNickname('');
          setMentionedUsers([]);
          setQuoteMessage(null);
          channel?.endTyping?.();
          afterSendMessageMaybe && afterSendMessageMaybe();
        }}
        onFileUpload={file => {
          sendFileMessage(file, quoteMessage);
          setQuoteMessage(null);
        }}
        onUserMentioned={user => {
          if (selectedUser?.userId === user?.userId) {
            setSelectedUser(null);
            setMentionNickname('');
          }
        }}
        onMentionStringChange={mentionText => {
          setMentionNickname(mentionText);
        }}
        onMentionedUserIdsUpdated={userIds => {
          setMentionedUserIds(userIds);
        }}
        onKeyDown={e => {
          if (
            displaySuggestedMentionList &&
            mentionSuggestedUsers?.length > 0 &&
            ((e.key === MessageInputKeys.Enter && ableMention) ||
              e.key === MessageInputKeys.ArrowUp ||
              e.key === MessageInputKeys.ArrowDown)
          ) {
            setMessageInputEvent(e);
            return true;
          }
          return false;
        }}
      />
    </div>
  );
};

export default React.forwardRef(MessageInputWrapper);
