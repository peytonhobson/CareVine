import React, { useEffect } from 'react';
import useWebSocket from 'react-use-websocket';
import { connect } from 'react-redux';
import { compose } from 'redux';
import {
  fetchUnreadMessageCount,
  setSendWebsocketMessage,
} from '../../containers/TopbarContainer/TopbarContainer.duck';
import { fetchCurrentUser } from '../../ducks/user.duck';
import { fetchConversations } from '../../containers/InboxPage/InboxPage.duck';

const isDev = process.env.NODE_ENV === 'development';

const WS_URL = isDev
  ? `ws://${process.env.REACT_APP_WEBSOCKET_HOST}:${process.env.REACT_APP_WEBSOCKET_PORT}/ws`
  : `${process.env.REACT_APP_CANONICAL_ROOT_URL.replace('https', 'wss')}/ws`;

const SocketClient = props => {
  const {
    onFetchCurrentUser,
    onFetchUnreadMessages,
    currentUser,
    currentPage,
    onFetchConversations,
    onSetSendWebsocketMessage,
  } = props;

  const userId = currentUser?.id?.uuid;

  const handleMessage = message => {
    const dataFromClient = JSON.parse(message.data);
    if (dataFromClient.type === 'user/updated') {
      onFetchCurrentUser();
    }

    console.log(dataFromClient);
    if (dataFromClient.type === 'message/created') {
      onFetchUnreadMessages();
    }

    if (dataFromClient.type === 'message/sent' && currentPage === 'InboxPage') {
      onFetchConversations();
    }
  };

  const handleOpen = () => {
    console.log('Opening', currentUser?.id?.uuid);
    onFetchCurrentUser();
    onFetchUnreadMessages();

    if (currentPage === 'InboxPage') {
      onFetchConversations();
    }
  };

  const { sendMessage, readyState } = useWebSocket(WS_URL, {
    share: true,
    filter: () => false,
    retryOnError: true,
    shouldReconnect: () => true,
    onMessage: handleMessage,
    onOpen: handleOpen,
    onClose: () => console.log('closing'),
  });

  useEffect(() => {
    if (readyState === 1 && userId) {
      sendMessage(JSON.stringify({ type: 'connection/initiated', userId }));
    }
  }, [readyState, sendMessage, userId]);

  useEffect(() => {
    onSetSendWebsocketMessage(sendMessage);
  }, [sendMessage, onSetSendWebsocketMessage]);

  return <></>;
};

const mapStateToProps = state => {
  const { currentUser } = state.user;

  return {
    currentUser,
  };
};

const mapDispatchToProps = {
  onFetchUnreadMessages: fetchUnreadMessageCount,
  onFetchCurrentUser: fetchCurrentUser,
  onFetchConversations: fetchConversations,
  onSetSendWebsocketMessage: setSendWebsocketMessage,
};

export default compose(connect(mapStateToProps, mapDispatchToProps))(SocketClient);
