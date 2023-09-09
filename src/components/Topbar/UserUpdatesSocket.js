import React, { useEffect } from 'react';
import useWebSocket from 'react-use-websocket';

const WS_URL = 'ws://10.0.0.222:5150';

const UserUpdateSocket = props => {
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
    onOpen: () => {
      console.log('WebSocket connection established.');
    },
    share: true,
    filter: () => false,
    retryOnError: true,
    shouldReconnect: () => true,
    onMessage: handleMessage,
  });

  useEffect(() => {
    console.log(readyState);
    if (readyState === 1 && userId) {
      console.log('sending message');
      sendMessage(JSON.stringify({ userId }));
    }
  }, [readyState, sendMessage, userId]);

  return <></>;
};

export default UserUpdateSocket;
