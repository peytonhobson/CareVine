import React, { useEffect } from 'react';
import useWebSocket from 'react-use-websocket';

const WS_URL = `ws://${process.env.REACT_APP_SOCKET_HOST}`;

const SocketClient = props => {
  const {
    onFetchCurrentUser,
    onFetchUnreadMessages,
    currentUser,
    currentPage,
    onFetchConversations,
  } = props;

  const userId = currentUser?.id?.uuid;

  const handleMessage = message => {
    const dataFromClient = JSON.parse(message.data);
    if (dataFromClient.type === 'user/updated') {
      onFetchCurrentUser();
    }

    if (dataFromClient.type === 'message/created') {
      onFetchUnreadMessages();

      if (currentPage === 'InboxPage') {
        onFetchConversations();
      }
    }
  };

  const { sendMessage, readyState } = useWebSocket(WS_URL, {
    share: true,
    filter: () => false,
    retryOnError: true,
    shouldReconnect: () => true,
    onMessage: handleMessage,
  });

  useEffect(() => {
    if (readyState === 1 && userId) {
      sendMessage(JSON.stringify({ userId }));
    }
  }, [readyState, sendMessage, userId]);

  return <></>;
};

export default SocketClient;
