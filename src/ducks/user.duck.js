import { denormalisedResponseEntities, ensureOwnListing } from '../util/data';
import { storableError } from '../util/errors';
import { LISTING_STATE_DRAFT } from '../util/types';
import * as log from '../util/log';
import { authInfo } from './Auth.duck';
import { stripeAccountCreateSuccess } from './stripeConnectAccount.duck';
import { util as sdkUtil } from '../util/sdkLoader';
import { addMarketplaceEntities } from './marketplaceData.duck';
import { isEqual } from 'lodash';

// ================ Action types ================ //

export const CURRENT_USER_SHOW_REQUEST = 'app/user/CURRENT_USER_SHOW_REQUEST';
export const CURRENT_USER_SHOW_SUCCESS = 'app/user/CURRENT_USER_SHOW_SUCCESS';
export const CURRENT_USER_SHOW_ERROR = 'app/user/CURRENT_USER_SHOW_ERROR';
export const CURRENT_USER_SHOW_NOCHANGE_SUCCESS = 'app/user/CURRENT_USER_SHOW_NOCHANGE_SUCCESS';

export const CLEAR_CURRENT_USER = 'app/user/CLEAR_CURRENT_USER';

export const FETCH_CURRENT_USER_HAS_LISTINGS_REQUEST =
  'app/user/FETCH_CURRENT_USER_HAS_LISTINGS_REQUEST';
export const FETCH_CURRENT_USER_HAS_LISTINGS_SUCCESS =
  'app/user/FETCH_CURRENT_USER_HAS_LISTINGS_SUCCESS';
export const FETCH_CURRENT_USER_HAS_LISTINGS_ERROR =
  'app/user/FETCH_CURRENT_USER_HAS_LISTINGS_ERROR';
export const FETCH_CURRENT_USER_HAS_LISTINGS_NOCHANGE_SUCCESS =
  'app/user/FETCH_CURRENT_USER_HAS_LISTINGS_NOCHANGE_SUCCESS';

export const UPDATE_NOTIFICATIONS_REQUEST = 'app/user/UPDATE_NOTIFICATIONS_REQUEST';
export const UPDATE_NOTIFICATIONS_SUCCESS = 'app/user/UPDATE_NOTIFICATIONS_SUCCESS';
export const UPDATE_NOTIFICATIONS_ERROR = 'app/user/UPDATE_NOTIFICATIONS_COUNT_ERROR';

export const FETCH_CURRENT_USER_HAS_ORDERS_REQUEST =
  'app/user/FETCH_CURRENT_USER_HAS_ORDERS_REQUEST';
export const FETCH_CURRENT_USER_HAS_ORDERS_SUCCESS =
  'app/user/FETCH_CURRENT_USER_HAS_ORDERS_SUCCESS';
export const FETCH_CURRENT_USER_HAS_ORDERS_ERROR = 'app/user/FETCH_CURRENT_USER_HAS_ORDERS_ERROR';

export const SEND_VERIFICATION_EMAIL_REQUEST = 'app/user/SEND_VERIFICATION_EMAIL_REQUEST';
export const SEND_VERIFICATION_EMAIL_SUCCESS = 'app/user/SEND_VERIFICATION_EMAIL_SUCCESS';
export const SEND_VERIFICATION_EMAIL_ERROR = 'app/user/SEND_VERIFICATION_EMAIL_ERROR';

// ================ Reducer ================ //

const mergeCurrentUser = (oldCurrentUser, newCurrentUser) => {
  const { id: oId, type: oType, attributes: oAttr, ...oldRelationships } = oldCurrentUser || {};
  const { id, type, attributes, ...relationships } = newCurrentUser || {};

  // Passing null will remove currentUser entity.
  // Only relationships are merged.
  // TODO figure out if sparse fields handling needs a better handling.
  return newCurrentUser === null
    ? null
    : oldCurrentUser === null
    ? newCurrentUser
    : { id, type, attributes, ...oldRelationships, ...relationships };
};

const initialState = {
  currentUser: null,
  fetchCurrentUserInProgress: false,
  currentUserFetched: false,
  currentUserShowError: null,
  currentUserHasListings: false,
  currentUserHasListingsError: null,
  currentUserHasOrders: null, // This is not fetched unless unverified emails exist
  currentUserHasOrdersError: null,
  sendVerificationEmailInProgress: false,
  sendVerificationEmailError: null,
  currentUserListing: null,
  currentUserListingFetched: false,
  updateNotificationInProgress: false,
  updateNotificationError: null,
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case CURRENT_USER_SHOW_REQUEST:
      return { ...state, currentUserShowError: null, fetchCurrentUserInProgress: true };
    case CURRENT_USER_SHOW_SUCCESS:
      return {
        ...state,
        currentUser: mergeCurrentUser(state.currentUser, payload),
        currentUserFetched: true,
        fetchCurrentUserInProgress: false,
      };
    case CURRENT_USER_SHOW_ERROR:
      // eslint-disable-next-line no-console
      console.error(payload);
      return { ...state, currentUserShowError: payload, fetchCurrentUserInProgress: false };
    case CURRENT_USER_SHOW_NOCHANGE_SUCCESS:
      return {
        ...state,
        currentUserFetched: true,
        fetchCurrentUserInProgress: false,
      };

    case CLEAR_CURRENT_USER:
      return {
        ...state,
        currentUser: null,
        currentUserShowError: null,
        currentUserHasListings: false,
        currentUserHasListingsError: null,
        currentUserListing: null,
        currentUserListingFetched: false,
      };

    case FETCH_CURRENT_USER_HAS_LISTINGS_REQUEST:
      return { ...state, currentUserHasListingsError: null };
    case FETCH_CURRENT_USER_HAS_LISTINGS_SUCCESS:
      return {
        ...state,
        currentUserHasListings: payload.hasListings,
        currentUserListing: payload.listing,
        currentUserListingFetched: true,
      };
    case FETCH_CURRENT_USER_HAS_LISTINGS_NOCHANGE_SUCCESS:
      return {
        ...state,
        currentUserListingFetched: true,
      };
    case FETCH_CURRENT_USER_HAS_LISTINGS_ERROR:
      console.error(payload); // eslint-disable-line
      return { ...state, currentUserHasListingsError: payload };

    // convert fetch notifications cases to notification count

    case UPDATE_NOTIFICATIONS_REQUEST:
      return {
        ...state,
        updateNotificationInProgress: true,
        updateNotificationsError: null,
      };
    case UPDATE_NOTIFICATIONS_SUCCESS:
      return {
        ...state,
        updateNotificationInProgress: false,
      };
    case UPDATE_NOTIFICATIONS_ERROR:
      return {
        ...state,
        updateNotificationsError: payload,
        updateNotificationsInProgress: false,
      };

    case FETCH_CURRENT_USER_HAS_ORDERS_REQUEST:
      return { ...state, currentUserHasOrdersError: null };
    case FETCH_CURRENT_USER_HAS_ORDERS_SUCCESS:
      return { ...state, currentUserHasOrders: payload.hasOrders };
    case FETCH_CURRENT_USER_HAS_ORDERS_ERROR:
      console.error(payload); // eslint-disable-line
      return { ...state, currentUserHasOrdersError: payload };

    case SEND_VERIFICATION_EMAIL_REQUEST:
      return {
        ...state,
        sendVerificationEmailInProgress: true,
        sendVerificationEmailError: null,
      };
    case SEND_VERIFICATION_EMAIL_SUCCESS:
      return {
        ...state,
        sendVerificationEmailInProgress: false,
      };
    case SEND_VERIFICATION_EMAIL_ERROR:
      return {
        ...state,
        sendVerificationEmailInProgress: false,
        sendVerificationEmailError: payload,
      };

    default:
      return state;
  }
}

// ================ Selectors ================ //

export const hasCurrentUserErrors = state => {
  const { user } = state;
  return (
    user.currentUserShowError || user.currentUserHasListingsError || user.currentUserHasOrdersError
  );
};

export const verificationSendingInProgress = state => {
  return state.user.sendVerificationEmailInProgress;
};

// ================ Action creators ================ //

export const currentUserShowRequest = () => ({ type: CURRENT_USER_SHOW_REQUEST });
export const currentUserShowSuccess = user => ({
  type: CURRENT_USER_SHOW_SUCCESS,
  payload: user,
});
export const currentUserShowNoChangeSuccess = () => ({
  type: CURRENT_USER_SHOW_NOCHANGE_SUCCESS,
});
export const currentUserShowError = e => ({
  type: CURRENT_USER_SHOW_ERROR,
  payload: e,
  error: true,
});

export const clearCurrentUser = () => ({ type: CLEAR_CURRENT_USER });

const fetchCurrentUserHasListingsRequest = () => ({
  type: FETCH_CURRENT_USER_HAS_LISTINGS_REQUEST,
});
export const fetchCurrentUserHasListingsSuccess = (hasListings, listing) => ({
  type: FETCH_CURRENT_USER_HAS_LISTINGS_SUCCESS,
  payload: { hasListings, listing },
});
export const fetchCurrentUserHasListingsNoChangeSuccess = () => ({
  type: FETCH_CURRENT_USER_HAS_LISTINGS_NOCHANGE_SUCCESS,
});
const fetchCurrentUserHasListingsError = e => ({
  type: FETCH_CURRENT_USER_HAS_LISTINGS_ERROR,
  error: true,
  payload: e,
});

export const updateNotificationsRequest = () => ({
  type: UPDATE_NOTIFICATIONS_REQUEST,
});
export const updateNotificationsSuccess = () => ({
  type: UPDATE_NOTIFICATIONS_SUCCESS,
});
export const updateNotificationsError = e => ({
  type: UPDATE_NOTIFICATIONS_ERROR,
  error: true,
  payload: e,
});

const fetchCurrentUserHasOrdersRequest = () => ({
  type: FETCH_CURRENT_USER_HAS_ORDERS_REQUEST,
});
export const fetchCurrentUserHasOrdersSuccess = hasOrders => ({
  type: FETCH_CURRENT_USER_HAS_ORDERS_SUCCESS,
  payload: { hasOrders },
});
const fetchCurrentUserHasOrdersError = e => ({
  type: FETCH_CURRENT_USER_HAS_ORDERS_ERROR,
  error: true,
  payload: e,
});

export const sendVerificationEmailRequest = () => ({
  type: SEND_VERIFICATION_EMAIL_REQUEST,
});
export const sendVerificationEmailSuccess = () => ({
  type: SEND_VERIFICATION_EMAIL_SUCCESS,
});
export const sendVerificationEmailError = e => ({
  type: SEND_VERIFICATION_EMAIL_ERROR,
  error: true,
  payload: e,
});

// ================ Thunks ================ //

export const fetchCurrentUserHasListings = () => (dispatch, getState, sdk) => {
  dispatch(fetchCurrentUserHasListingsRequest());
  const { currentUser } = getState().user;

  if (!currentUser) {
    dispatch(fetchCurrentUserHasListingsSuccess(false));
    return Promise.resolve(null);
  }

  const params = {
    // Since we are only interested in if the user has
    // listings, we only need at most one result.
    page: 1,
    per_page: 1,
    include: ['author'],
  };

  return sdk.ownListings
    .query(params)
    .then(response => {
      const hasListings = response.data.data && response.data.data.length > 0;
      const listing = hasListings ? response.data.data[0] : null;

      const hasPublishedListings =
        hasListings &&
        ensureOwnListing(response.data.data[0]).attributes.state !== LISTING_STATE_DRAFT;

      if (isEqual(listing, getState().user.currentUserListing)) {
        dispatch(fetchCurrentUserHasListingsNoChangeSuccess());
        return;
      }

      dispatch(fetchCurrentUserHasListingsSuccess(!!hasPublishedListings, listing));
      dispatch(addMarketplaceEntities(response));
    })
    .catch(e => dispatch(fetchCurrentUserHasListingsError(storableError(e))));
};

export const fetchCurrentUserHasOrders = () => (dispatch, getState, sdk) => {
  dispatch(fetchCurrentUserHasOrdersRequest());

  if (!getState().user.currentUser) {
    dispatch(fetchCurrentUserHasOrdersSuccess(false));
    return Promise.resolve(null);
  }

  const params = {
    only: 'order',
    page: 1,
    per_page: 1,
  };

  return sdk.transactions
    .query(params)
    .then(response => {
      const hasOrders = response.data.data && response.data.data.length > 0;
      dispatch(fetchCurrentUserHasOrdersSuccess(!!hasOrders));
    })
    .catch(e => dispatch(fetchCurrentUserHasOrdersError(storableError(e))));
};

export const updateNotifications = notifications => async (dispatch, getState, sdk) => {
  dispatch(updateNotificationsRequest());

  try {
    await sdk.currentUser.updateProfile({
      privateData: { notifications },
    });

    dispatch(fetchCurrentUser());
    dispatch(updateNotificationsSuccess());
  } catch (e) {
    log.error(e, 'failed-to-update-notifications');
    dispatch(updateNotificationsError(storableError(e)));
  }
};

export const fetchCurrentUser = (params = null) => (dispatch, getState, sdk) => {
  dispatch(currentUserShowRequest());
  const { isAuthenticated } = getState().Auth;

  if (!isAuthenticated) {
    // Make sure current user is null
    dispatch(currentUserShowSuccess(null));
    return Promise.resolve({});
  }

  const parameters = params || {
    include: ['profileImage', 'stripeAccount', 'stripeCustomer'],
    'fields.image': [
      'variants.square-small',
      'variants.square-small2x',
      'variants.square-xsmall',
      'variants.square-xsmall2x',
    ],
    'imageVariant.square-xsmall': sdkUtil.objectQueryString({
      w: 40,
      h: 40,
      fit: 'crop',
    }),
    'imageVariant.square-xsmall2x': sdkUtil.objectQueryString({
      w: 80,
      h: 80,
      fit: 'crop',
    }),
  };

  return sdk.currentUser
    .show(parameters)
    .then(response => {
      const entities = denormalisedResponseEntities(response);
      if (entities.length !== 1) {
        throw new Error('Expected a resource in the sdk.currentUser.show response');
      }
      const currentUser = entities[0];

      // Save stripeAccount to store.stripe.stripeAccount if it exists
      if (currentUser.stripeAccount) {
        dispatch(stripeAccountCreateSuccess(currentUser.stripeAccount));
      }

      // set current user id to the logger
      log.setUserId(currentUser.id.uuid);
      dispatch(currentUserShowSuccess(currentUser));
      return currentUser;
    })
    .then(currentUser => {
      dispatch(fetchCurrentUserHasListings());
      if (!currentUser.attributes.emailVerified) {
        dispatch(fetchCurrentUserHasOrders());
      }

      // Make sure auth info is up to date
      dispatch(authInfo());
    })
    .catch(e => {
      // Make sure auth info is up to date
      dispatch(authInfo());
      log.error(e, 'fetch-current-user-failed');
      dispatch(currentUserShowError(storableError(e)));
    });
};

export const sendVerificationEmail = () => (dispatch, getState, sdk) => {
  if (verificationSendingInProgress(getState())) {
    return Promise.reject(new Error('Verification email sending already in progress'));
  }
  dispatch(sendVerificationEmailRequest());
  return sdk.currentUser
    .sendVerificationEmail()
    .then(() => dispatch(sendVerificationEmailSuccess()))
    .catch(e => dispatch(sendVerificationEmailError(storableError(e))));
};
