const { WebSocket, WebSocketServer } = require('ws');
const http = require('http');
const { integrationSdk } = require('./api-util/sdk');
const log = require('./log');
const isDev = process.env.REACT_APP_ENV === 'development';
const isTest = process.env.NODE_ENV === 'production' && isDev;
const isProd = process.env.NODE_ENV === 'production' && !isDev;
const isLocal = process.env.NODE_ENV === 'development' && isDev;
const { GetObjectCommand, S3Client } = require('@aws-sdk/client-s3');

// Spinning the http server and the WebSocket server.
const server = http.createServer();
const wsServer = new WebSocketServer({ server });
const port = 8000;
server.listen(port, () => {
  console.log(`WebSocket server is running on port ${port}`);
});

// I'm maintaining all active connections in this object
const clients = {};
// I'm maintaining all active users in this object
const users = {};

const sendMessageCreatedEvent = async (senderId, txId) => {
  const response = await integrationSdk.transactions.show({
    id: txId,
    include: ['provider', 'customer'],
  });

  const transaction = response.data.data;

  const providerId = transaction.relationships.provider.data.id.uuid;
  const customerId = transaction.relationships.customer.data.id.uuid;

  const userId = senderId === providerId ? customerId : providerId;

  const client = clients[userId];

  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify({ type: 'message/created' }));
  }
};

const sendUserUpdatedEvent = async userId => {
  const client = clients[userId];

  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify({ type: 'user/updated' }));
  }
};

const handleEvent = event => {
  const eventType = event.attributes.eventType;

  if (eventType === 'user/updated') {
    const user = event.attributes.resource;
    const userId = user.id.uuid;

    sendUserUpdatedEvent(userId);
  }

  if (eventType === 'message/created') {
    const message = event.attributes.resource;
    const senderId = message.relationships.sender.data.id.uuid;
    const txId = message.relationships.transaction.data.id.uuid;

    sendMessageCreatedEvent(senderId, txId);
  }
};

function handleMessage(message, connection) {
  const dataFromClient = JSON.parse(message.toString());

  clients[dataFromClient.userId] = connection;
}

function handleDisconnect(userId) {
  console.log(`${userId} disconnected.`);

  delete clients[userId];
  delete users[userId];
}

// A new client connection request received
wsServer.on('connection', function(connection) {
  console.log('Recieved a new connection');

  connection.on('message', message => handleMessage(message, connection));
  // User disconnected
  connection.on('close', () => handleDisconnect(userId));
});

const startTime = new Date();
const pollIdleWait = 10000; // 10 seconds
const pollWait = 1000; // 1s

const queryEvents = args => {
  var filter = {
    eventTypes: ['user/updated', 'message/created'],
  };
  return integrationSdk.events
    .query({ ...args, ...filter })
    .catch(e => log.error(e, 'Error querying events'));
};

let stateFile = null;

if (isLocal) {
  stateFile = 'state-files/last-sequence-id.state';
} else if (isTest) {
  stateFile = 'state-files/last-sequence-id-test.state';
} else if (isProd) {
  stateFile = 'state-files/last-sequence-id-prod.state';
}

const client = new S3Client({ region: 'us-west-2' });
const readCommand = new GetObjectCommand({
  Bucket: 'carevine',
  Key: stateFile,
});

const loadLastEventSequenceId = async () => {
  // Load state from local file, if any
  try {
    const response = await client.send(readCommand);
    // The Body object also has 'transformToByteArray' and 'transformToWebStream' methods.
    const data = await response.Body.transformToString();
    return parseInt(data, 10);
  } catch (err) {
    log.error(err);
  }
};

const pollLoop = sequenceId => {
  var params = sequenceId ? { startAfterSequenceId: sequenceId } : { createdAtStart: startTime };
  queryEvents(params).then(res => {
    const events = res?.data?.data;
    const fullPage = events?.length === res?.data?.meta?.perPage;
    const delay = fullPage ? pollWait : pollIdleWait;
    const lastEvent = events?.length ? events[events?.length - 1] : null;
    const lastSequenceId = lastEvent ? lastEvent.attributes?.sequenceId : sequenceId;

    events?.forEach(e => {
      handleEvent(e);
    });

    setTimeout(() => {
      pollLoop(lastSequenceId);
    }, delay);
  });
};

loadLastEventSequenceId().then(lastSequenceId => {
  pollLoop(lastSequenceId);
});
