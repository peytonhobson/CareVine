import React, { useMemo } from 'react';

import Message from '@sendbird/uikit-react/Channel/components/Message';

import NotifyForPaymentMessage from './MessageItems/NotifyForPaymentMessage';
import RequestForPaymentMessage from './MessageItems/RequestForPaymentMessage';
import ConfirmPaymentMessage from './MessageItems/ConfirmPaymentMessage';

const CONFIRM_PAYMENT = 'CONFIRM_PAYMENT';
const REQUEST_FOR_PAYMENT = 'REQUEST_FOR_PAYMENT';
const NOTIFY_FOR_PAYMENT = 'NOTIFY_FOR_PAYMENT';

const CustomMessageItem = props => {
  const {
    currentChannel,
    currentUser,
    emojiContainer,
    isPaymentModalOpen,
    message,
    onDeleteMessage,
    onOpenPaymentModal,
    onUpdateMessage,
    otherUser,
    sdk,
    updateLastMessage,
    userId,
  } = props;

  const MessageHOC = useMemo(() => {
    if (message.customType === CONFIRM_PAYMENT) {
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
    } else if (message.customType === REQUEST_FOR_PAYMENT) {
      return () => (
        <RequestForPaymentMessage
          message={message}
          userId={userId}
          onOpenPaymentModal={onOpenPaymentModal}
          changedOtherUser={otherUser}
        />
      );
    } else if (message.customType === NOTIFY_FOR_PAYMENT) {
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
    currentChannel,
    isPaymentModalOpen,
    message,
    onDeleteMessage,
    onUpdateMessage,
    sdk,
    updateLastMessage,
    userId,
    otherUser,
  ]);

  return (
    <div id={message.messageId} className="customized-message-item">
      <MessageHOC />
      <br />
    </div>
  );
};

export default CustomMessageItem;
