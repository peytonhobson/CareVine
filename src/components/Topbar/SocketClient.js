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

const WS_URL = `${isDev ? 'ws' : 'wss'}://${process.env.REACT_APP_WEBSOCKET_HOST}`;

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
      console.log('user updated');
      onFetchCurrentUser();
    }

    if (dataFromClient.type === 'message/created') {
      console.log('message created');
      onFetchUnreadMessages();

      if (currentPage === 'InboxPage') {
        onFetchConversations();
      }
    }
  };

  const handleOpen = () => {
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
