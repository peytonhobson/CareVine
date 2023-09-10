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
const websocket = require('./websocket');

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
    origin: process.env.REACT_APP_CANONICAL_ROOT_URL,
    // origin: 'http://10.0.0.222:3000',
    credentials: true,
  })
);
app.use(cookieParser());
app.use('/.well-known', wellKnownRouter);
app.use('/api', apiRouter);

const server = app.listen(PORT, () => {
  console.log(`API server listening on ${PORT}`);
});

if (isDev) {
  websocket(server);
}
