// These helpers are calling FTW's own server-side routes
// so, they are not directly calling Marketplace API or Integration API.
// You can find these api endpoints from 'server/api/...' directory

import { types as sdkTypes, transit } from './sdkLoader';
import config from '../config';
import Decimal from 'decimal.js';

export const apiBaseUrl = () => {
  const port = process.env.REACT_APP_DEV_API_SERVER_PORT;
  const useDevApiServer = process.env.NODE_ENV === 'development' && !!port;

  // In development, the dev API server is running in a different port
  if (useDevApiServer) {
    return `http://localhost:${port}`;
  }

  // Otherwise, use the same domain and port as the frontend
  return `${window.location.origin}`;
};

// Application type handlers for JS SDK.
//
// NOTE: keep in sync with `typeHandlers` in `server/api-util/sdk.js`
export const typeHandlers = [
  // Use Decimal type instead of SDK's BigDecimal.
  {
    type: sdkTypes.BigDecimal,
    customType: Decimal,
    writer: v => new sdkTypes.BigDecimal(v.toString()),
    reader: v => new Decimal(v.value),
  },
];

const serialize = data => {
  return transit.write(data, { typeHandlers, verbose: config.sdk.transitVerbose });
};

const deserialize = str => {
  return transit.read(str, { typeHandlers });
};

const post = (path, body) => {
  const url = `${apiBaseUrl()}${path}`;
  const options = {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/transit+json',
    },
    body: serialize(body),
  };
  return window.fetch(url, options).then(res => {
    const contentTypeHeader = res.headers.get('Content-Type');
    const contentType = contentTypeHeader ? contentTypeHeader.split(';')[0] : null;

    if (res.status >= 400) {
      return res.json().then(data => {
        let e = new Error();
        e = Object.assign(e, data);

        throw e;
      });
    }
    if (contentType === 'application/transit+json') {
      return res.text().then(deserialize);
    } else if (contentType === 'application/json') {
      return res.json();
    }
    return res.text();
  });
};

// Fetch transaction line items from the local API endpoint.
//
// See `server/api/transaction-line-items.js` to see what data should
// be sent in the body.
export const transactionLineItems = body => {
  return post('/api/transaction-line-items', body);
};

// Initiate a privileged transaction.
//
// With privileged transitions, the transactions need to be created
// from the backend. This endpoint enables sending the booking data to
// the local backend, and passing that to the Marketplace API.
//
// See `server/api/initiate-privileged.js` to see what data should be
// sent in the body.
export const initiatePrivileged = body => {
  return post('/api/initiate-privileged', body);
};

// Transition a transaction with a privileged transition.
//
// This is similar to the `initiatePrivileged` above. It will use the
// backend for the transition. The backend endpoint will add the
// payment line items to the transition params.
//
// See `server/api/transition-privileged.js` to see what data should
// be sent in the body.
export const transitionPrivileged = body => {
  return post('/api/transition-privileged', body);
};

// Create user with identity provider (e.g. Facebook or Google)
//
// If loginWithIdp api call fails and user can't authenticate to Flex with idp
// we will show option to create a new user with idp.
// For that user needs to confirm data fetched from the idp.
// After the confirmation, this endpoint is called to create a new user with confirmed data.
//
// See `server/api/auth/createUserWithIdp.js` to see what data should
// be sent in the body.
export const createUserWithIdp = body => {
  return post('/api/auth/create-user-with-idp', body);
};

// Update user metadata
//
// This is similar to the `initiatePrivileged` above. It will use the
// backend for the transition. The backend endpoint will update the
// values for the selected user.
//
// See `server/api/update-user-metadata.js` to see what data should
// be sent in the body.
export const updateUserMetadata = body => {
  return post('/api/update-user-metadata', body);
};

// Update listing metadata
//
// This is similar to the `updateUserMetadata` above, but with listings.
//
// See `server/api/update-user-metadata.js` to see what data should
// be sent in the body.
export const updateListingMetadata = body => {
  return post('/api/update-listing-metadata', body);
};

export const deleteUserAccount = body => {
  return post('/api/delete-account', body);
};

// Create payment intent using stripe account
//
// See `server/api/stripe-create-payment-intent.js` to see what data should
// be sent in the body.
export const stripeCreatePaymentIntent = body => {
  return post('/api/create-payment-intent', body);
};

// Fetch if user has stripe account. Will return true if stripeAccountId is present
// and false otherwise.
//
// See `server/api/fetchHasStripeAccount.js` to see what data should
// be sent in the body.
export const fetchHasStripeAccount = body => {
  return post('/api/has-stripe-account', body);
};

// Fetch users saved payment methods
//
// See `server/api/stripe-payment-methods.js` to see what data should
// be sent in the body.
export const stripePaymentMethods = body => {
  return post('/api/stripe-payment-methods', body);
};

// Update default payment method of currentUser
//
// See `server/api/stripe-update-payment-method.js` to see what data should
// be sent in the body.
export const stripeDetachPaymentMethod = body => {
  return post('/api/stripe-detach-payment-method', body);
};

// Update payment intent
//
// See `server/api/stripe-update-payment-itent.js` to see what data should
// be sent in the body.
export const stripeUpdatePaymentIntent = body => {
  return post('/api/stripe-update-payment-intent', body);
};

// Create group channel and send first message
//
// See `server/api/stripe-update-payment-itent.js` to see what data should
// be sent in the body.
export const fetchUserEmail = body => {
  return post('/api/user-email', body);
};

export const sendbirdUser = body => {
  return post('/api/sb-user', body);
};

export const stripeCreateSetupIntent = body => {
  return post('/api/stripe-create-setup-intent', body);
};

export const createUserAuthenticate = body => {
  return post('/api/authenticate-create-user', body);
};
