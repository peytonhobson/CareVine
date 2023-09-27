const http = require('http');
const https = require('https');
const Decimal = require('decimal.js');
const sharetribeSdk = require('sharetribe-flex-sdk');
const flexIntegrationSdk = require('sharetribe-flex-integration-sdk');

const CLIENT_ID = process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID;
const CLIENT_SECRET = process.env.SHARETRIBE_SDK_CLIENT_SECRET;
const USING_SSL = process.env.REACT_APP_SHARETRIBE_USING_SSL === 'true';
const TRANSIT_VERBOSE = process.env.REACT_APP_SHARETRIBE_SDK_TRANSIT_VERBOSE === 'true';

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

exports.serialize = data => {
  return sharetribeSdk.transit.write(data, { typeHandlers, verbose: TRANSIT_VERBOSE });
};

exports.deserialize = str => {
  return sharetribeSdk.transit.read(str, { typeHandlers });
};

exports.getTrustedSdk = (userToken, useDev) => {
  // Initiate an SDK instance for token exchange
  const sdk = sharetribeSdk.createInstance({
    transitVerbose: TRANSIT_VERBOSE,
    clientId: useDev ? process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID_DEV : CLIENT_ID,
    clientSecret: useDev ? process.env.SHARETRIBE_SDK_CLIENT_SECRET : CLIENT_SECRET,
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
      clientId: useDev ? process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID_DEV : CLIENT_ID,

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
