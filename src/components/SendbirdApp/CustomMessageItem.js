import React, { useMemo } from 'react';
import NotifyForPaymentMessage from './MessageItems/NotifyForPaymentMessage';
import Message from '@sendbird/uikit-react/Channel/components/Message';
import RequestForPaymentMessage from './MessageItems/RequestForPaymentMessage';
import ConfirmPaymentMessage from './MessageItems/ConfirmPaymentMessage';

const CustomMessageItem = props => {
  const {
    message,
    emojiContainer,
    onDeleteMessage,
    onUpdateMessage,
    userId,
    sdk,
    currentChannel,
    updateLastMessage,
    onOpenPaymentModal,
    currentUser,
    otherUser,
  } = props;

  const MessageHOC = useMemo(() => {
    if (message.customType === 'CONFIRM_PAYMENT') {
      return () => (
        <ConfirmPaymentMessage
          message={message}
          userId={userId}
          emojiContainer={emojiContainer}
          onDeleteMessage={onDeleteMessage}
          onUpdateMessage={onUpdateMessage}
          sdk={sdk}
          currentChannel={currentChannel}
          updateLastMessage={updateLastMessage}
          onOpenPaymentModal={onOpenPaymentModal}
          currentUser={currentUser}
          otherUser={otherUser}
        />
      );
    } else if (message.customType === 'REQUEST_FOR_PAYMENT') {
      return () => (
        <RequestForPaymentMessage
          message={message}
          userId={userId}
          emojiContainer={emojiContainer}
          onDeleteMessage={onDeleteMessage}
          onUpdateMessage={onUpdateMessage}
          sdk={sdk}
          currentChannel={currentChannel}
          updateLastMessage={updateLastMessage}
          onOpenPaymentModal={onOpenPaymentModal}
          currentUser={currentUser}
          otherUser={otherUser}
        />
      );
    } else if (message.customType === 'NOTIFY_FOR_PAYMENT') {
      return () => (
        <NotifyForPaymentMessage
          message={message}
          userId={userId}
          emojiContainer={emojiContainer}
          onDeleteMessage={onDeleteMessage}
          onUpdateMessage={onUpdateMessage}
          sdk={sdk}
          currentChannel={currentChannel}
          updateLastMessage={updateLastMessage}
        />
      );
    } else if (
      (message.isUserMessage && message.isUserMessage()) ||
      (message.isFileMessage && message.isFileMessage())
    ) {
      return () => (
        <Message
          message={message}
          userId={userId}
          emojiContainer={emojiContainer}
          onDeleteMessage={onDeleteMessage}
          onUpdateMessage={onUpdateMessage}
          sdk={sdk}
          currentChannel={currentChannel}
          updateLastMessage={updateLastMessage}
        />
      );
    }
    return () => <div />;
  }, [
    message,
    emojiContainer,
    userId,
    onDeleteMessage,
    onUpdateMessage,
    sdk,
    currentChannel,
    updateLastMessage,
  ]);

  return (
    <div id={message.messageId} className="customized-message-item">
      <MessageHOC />
      <br />
    </div>
  );
};

export default CustomMessageItem;
