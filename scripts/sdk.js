const http = require('http');
const https = require('https');
const Decimal = require('decimal.js');
const sharetribeSdk = require('sharetribe-flex-sdk');
const flexIntegrationSdk = require('sharetribe-flex-integration-sdk');

const CLIENT_ID = process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID;
const CLIENT_SECRET = process.env.SHARETRIBE_SDK_CLIENT_SECRET;
const USING_SSL = process.env.REACT_APP_SHARETRIBE_USING_SSL === 'true';
const TRANSIT_VERBOSE = process.env.REACT_APP_SHARETRIBE_SDK_TRANSIT_VERBOSE === 'true';
const USER_TOKEN = {
  access_token:
    'eyJhbGciOiJIUzI1NiJ9.eyJjbGllbnQtaWQiOiJjM2Q1NWZhMy04OGJjLTQ1YjItOTkyYS0yZTdmNTNiNGQ2MWIiLCJ0ZW5hbmN5LWlkIjoiNjM1MWE0Y2YtMjU4OS00YjIxLWI2NGUtNThjZjg4NzI0MDI4Iiwic2NvcGUiOiJ1c2VyIiwiZXhwIjoxNjk1NDAzMDU1LCJlbnYiOiJkZW1vIiwiaWRlbnQiOiJjYXJlZ2l2ZXItdGVzdCIsInVzZXItaWQiOiI2MzUyZTFmNi1jMDdjLTQwM2MtODRhYy00OGJiYWVmNTg2YTIiLCJ1c2VyLXJvbGVzIjpbInVzZXIucm9sZS9wcm92aWRlciIsInVzZXIucm9sZS9jdXN0b21lciJdfQ.9qJKBxFdG07Cxy5pHFMDoqTibHyEo0JFIfXAjoSmJo8',
  scope: 'user',
  token_type: 'bearer',
  expires_in: 600,
  refresh_token:
    'v2--33580563-ea7a-4a00-b88b-a151c648cc43--278928d1d1f2ebad1a9b2c4fb87202fdc3406db8',
};

// Application type handlers for JS SDK.
//
// NOTE: keep in sync with `typeHandlers` in `src/util/api.js`
const typeHandlers = [
  // Use Decimal type instead of SDK's BigDecimal.
  {
    type: sharetribeSdk.types.BigDecimal,
    customType: Decimal,
    writer: v => new sharetribeSdk.types.BigDecimal(v.toString()),
    reader: v => new Decimal(v.value),
  },
];
exports.typeHandlers = typeHandlers;

const baseUrlMaybe = process.env.REACT_APP_SHARETRIBE_SDK_BASE_URL
  ? { baseUrl: process.env.REACT_APP_SHARETRIBE_SDK_BASE_URL }
  : null;
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

const memoryStore = token => {
  const store = sharetribeSdk.tokenStore.memoryStore();
  store.setToken(token);
  return store;
};

// Read the user token from the request cookie
const getUserToken = req => {
  const cookieTokenStore = sharetribeSdk.tokenStore.expressCookieStore({
    clientId: CLIENT_ID,
    req,
    secure: USING_SSL,
  });
  return cookieTokenStore.getToken();
};

exports.serialize = data => {
  return sharetribeSdk.transit.write(data, { typeHandlers, verbose: TRANSIT_VERBOSE });
};

exports.deserialize = str => {
  return sharetribeSdk.transit.read(str, { typeHandlers });
};

exports.getSdk = (req, res) => {
  return sharetribeSdk.createInstance({
    transitVerbose: TRANSIT_VERBOSE,
    clientId: CLIENT_ID,
    httpAgent,
    httpsAgent,
    tokenStore: sharetribeSdk.tokenStore.expressCookieStore({
      clientId: CLIENT_ID,
      req,
      res,
      secure: USING_SSL,
    }),
    typeHandlers,
    ...baseUrlMaybe,
  });
};

exports.getTrustedSdk = userToken => {
  // Initiate an SDK instance for token exchange
  const sdk = sharetribeSdk.createInstance({
    transitVerbose: TRANSIT_VERBOSE,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    httpAgent,
    httpsAgent,
    tokenStore: memoryStore(userToken),
    typeHandlers,
    ...baseUrlMaybe,
  });

  // Perform a token exchange
  return sdk.exchangeToken().then(response => {
    // Setup a trusted sdk with the token we got from the exchange:
    const trustedToken = response.data;

    return sharetribeSdk.createInstance({
      transitVerbose: TRANSIT_VERBOSE,

      // We don't need CLIENT_SECRET here anymore
      clientId: CLIENT_ID,

      // Important! Do not use a cookieTokenStore here but a memoryStore
      // instead so that we don't leak the token back to browser client.
      tokenStore: memoryStore(trustedToken),

      httpAgent,
      httpsAgent,
      typeHandlers,
      ...baseUrlMaybe,
    });
  });
};

exports.integrationSdk = flexIntegrationSdk.createInstance({
  // These two env vars need to be set in the `.env` file.
  clientId: process.env.FLEX_INTEGRATION_CLIENT_ID,
  clientSecret: process.env.FLEX_INTEGRATION_CLIENT_SECRET,

  // Normally you can just skip setting the base URL and just use the
  // default that the `createInstance` uses. We explicitly set it here
  // for local testing and development.
  baseUrl: process.env.FLEX_INTEGRATION_BASE_URL || 'https://flex-integ-api.sharetribe.com',
});
