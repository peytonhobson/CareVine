module.exports = websocket = app => {
  const { WebSocket, WebSocketServer } = require('ws');
  const http = require('http');

  const messagesTypes = {
    MESSAGE_CREATED: 'message/created',
    USER_UPDATED: 'user/updated',
    CONNECTION_INITIATED: 'connection/initiated',
  };

  // Spinning the http server and the WebSocket server.
  const server = http.createServer(app);
  const wsServer = new WebSocketServer({ server });
  const port = process.env.REACT_APP_SOCKET_PORT || 3000;
  server.listen(port, () => {
    console.log(`WebSocket server is running on port ${port}`);
  });

  // I'm maintaining all active connections in this object
  const clients = {};

  const sendEvent = async (userId, type) => {
    const client = clients[userId];

    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type }));
    }
  };

  function handleMessage(message, connection) {
    const dataFromClient = JSON.parse(message.toString());

    console.log(dataFromClient);

    if (dataFromClient.type === messagesTypes.CONNECTION_INITIATED) {
      clients[dataFromClient.userId] = connection;
      connection.on('close', () => handleDisconnect(dataFromClient.userId));
    }

    if (dataFromClient.type === messagesTypes.MESSAGE_CREATED) {
      sendEvent(dataFromClient.receiverId, messagesTypes.MESSAGE_CREATED);
    }

    if (
      dataFromClient.type === messagesTypes.USER_UPDATED &&
      dataFromClient.serverId === process.env.WEBSOCKET_SERVER_ID
    ) {
      sendEvent(dataFromClient.userId, messagesTypes.USER_UPDATED);
    }
  }

  const handleDisconnect = async userId => {
    delete clients[userId];
  };

  // A new client connection request received
  wsServer.on('connection', function(connection) {
    console.log('connection');
    connection.on('message', message => handleMessage(message, connection));
  });
};
