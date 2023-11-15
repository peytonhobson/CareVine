// NOTE: this server is purely a dev-mode server. In production, the
// server/index.js server also serves the API routes.

// Configure process.env with .env.* files
require('./env').configureEnv();

const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const apiRouter = require('./apiRouter');
const wellKnownRouter = require('./wellKnownRouter');
const queryEvents = require('./queryEvents');
const isDev = process.env.NODE_ENV === 'development';
const { WebSocketServer, WebSocket } = require('ws');
const { deserialize } = require('./api-util/sdk');

const radix = 10;
const PORT = parseInt(process.env.REACT_APP_DEV_API_SERVER_PORT, radix);
const app = express();

if (isDev) {
  queryEvents();
}

// NOTE: CORS is only needed in this dev API server because it's
// running in a different port than the main app.
app.use(
  cors({
    // origin: process.env.REACT_APP_CANONICAL_ROOT_URL,
    // origin: 'http://10.0.0.222:3000',
    origin: `http://192.168.6.248:3000`,
    credentials: true,
  })
);
app.use(cookieParser());
app.use('/.well-known', wellKnownRouter);
app.use('/api', apiRouter);

const server = app.listen(PORT, () => {
  console.log(`API server listening on ${PORT}`);
});

const messagesTypes = {
  MESSAGE_CREATED: 'message/created',
  MESSAGE_SENT: 'message/sent',
  USER_UPDATED: 'user/updated',
  CONNECTION_INITIATED: 'connection/initiated',
};

const wsServer = new WebSocketServer({ server, path: '/ws' });
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

  if (dataFromClient.type === messagesTypes.CONNECTION_INITIATED) {
    clients[dataFromClient.userId] = connection;
    connection.on('close', () => handleDisconnect(dataFromClient.userId));
  }

  if (dataFromClient.type === messagesTypes.MESSAGE_SENT) {
    sendEvent(dataFromClient.receiverId, messagesTypes.MESSAGE_SENT);
  }
}

const handleDisconnect = async userId => {
  delete clients[userId];
};

// A new client connection request received
wsServer.on('connection', function(connection) {
  connection.on('message', message => handleMessage(message, connection));
});

wsServer.on('error', function(err) {
  log.error(err, 'websocket-server-error');
});

const wsRouter = express.Router();

wsRouter.use(
  bodyParser.text({
    type: 'application/transit+json',
  })
);

// Deserialize Transit body string to JS data
wsRouter.use((req, res, next) => {
  if (req.get('Content-Type') === 'application/transit+json' && typeof req.body === 'string') {
    try {
      req.body = deserialize(req.body);
    } catch (e) {
      console.error('Failed to parse request body as Transit:');
      console.error(e);
      res.status(400).send('Invalid Transit in request body.');
      return;
    }
  }
  next();
});

wsRouter.post('/message-created', (req, res) => {
  const { userId, serverId } = req.body;

  if (serverId === process.env.WEBSOCKET_SERVER_ID) {
    sendEvent(userId, messagesTypes.MESSAGE_CREATED);
  }
});

wsRouter.post('/user-updated', (req, res) => {
  const { userId, serverId } = req.body;

  if (serverId === process.env.WEBSOCKET_SERVER_ID) {
    sendEvent(userId, messagesTypes.USER_UPDATED);
  }
});

app.use('/ws', wsRouter);
