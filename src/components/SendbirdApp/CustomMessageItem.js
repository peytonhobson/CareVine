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
    isPaymentModalOpen,
  } = props;

  const MessageHOC = useMemo(() => {
    if (message.customType === 'CONFIRM_PAYMENT') {
      return () => (
        <ConfirmPaymentMessage
          message={message}
          userId={userId}
          currentChannel={currentChannel}
          onOpenPaymentModal={onOpenPaymentModal}
          currentUser={currentUser}
          otherUser={otherUser}
          isPaymentModalOpen={isPaymentModalOpen}
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
          isPaymentModalOpen={isPaymentModalOpen}
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
          isPaymentModalOpen={isPaymentModalOpen}
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
    userId,
    onDeleteMessage,
    onUpdateMessage,
    sdk,
    currentChannel,
    updateLastMessage,
    isPaymentModalOpen,
  ]);

  return (
    <div id={message.messageId} className="customized-message-item">
      <MessageHOC />
      <br />
    </div>
  );
};

export default CustomMessageItem;
