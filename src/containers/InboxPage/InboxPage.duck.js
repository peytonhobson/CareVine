import reverse from 'lodash/reverse';
import sortBy from 'lodash/sortBy';
import { storableError } from '../../util/errors';
import { parse } from '../../util/urlHelpers';
import { TRANSITION_REQUEST_PAYMENT } from '../../util/transaction';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { denormalisedResponseEntities } from '../../util/data';
import { types as sdkTypes } from '../../util/sdkLoader';
import pick from 'lodash/pick';
import pickBy from 'lodash/pickBy';
import isEmpty from 'lodash/isEmpty';
import queryString from 'query-string';
import { updateUserMetadata, transitionPrivileged, sendbirdUser } from '../../util/api';
import * as log from '../../util/log';
import config from '../../config';
import SendbirdChat from '@sendbird/chat';
import { GroupChannelModule } from '@sendbird/chat/groupChannel';
import { fetchCurrentUser } from '../../ducks/user.duck';

const MESSAGES_PAGE_SIZE = 10;
const { UUID } = sdkTypes;

const sortedTransactions = txs =>
  reverse(
    sortBy(txs, tx => {
      return tx.attributes ? tx.attributes.lastTransitionedAt : null;
    })
  );

// ================ Action types ================ //

export const SET_INITIAL_VALUES = 'app/InboxPage/SET_INITIAL_VALUES';

export const FETCH_OTHER_USER_LISTING_REQUEST = 'app/InboxPage/FETCH_OTHER_USER_LISTING_REQUEST';
export const FETCH_OTHER_USER_LISTING_SUCCESS = 'app/InboxPage/FETCH_OTHER_USER_LISTING_SUCCESS';
export const FETCH_OTHER_USER_LISTING_ERROR = 'app/InboxPage/FETCH_OTHER_USER_LISTING_ERROR';

export const TRANSITION_TO_REQUEST_PAYMENT_REQUEST =
  'app/InboxPage/TRANSITION_TO_REQUEST_PAYMENT_REQUEST';
export const TRANSITION_TO_REQUEST_PAYMENT_SUCCESS =
  'app/InboxPage/TRANSITION_TO_REQUEST_PAYMENT_SUCCESS';
export const TRANSITION_TO_REQUEST_PAYMENT_ERROR =
  'app/InboxPage/TRANSITION_TO_REQUEST_PAYMENT_ERROR';

export const FETCH_USER_FROM_CHANNEL_URL_REQUEST =
  'app/InboxPage/FETCH_USER_FROM_CHANNEL_URL_REQUEST';
export const FETCH_USER_FROM_CHANNEL_URL_SUCCESS =
  'app/InboxPage/FETCH_USER_FROM_CHANNEL_URL_SUCCESS';
export const FETCH_USER_FROM_CHANNEL_URL_ERROR = 'app/InboxPage/FETCH_USER_FROM_CHANNEL_URL_ERROR';

export const SEND_REQUEST_FOR_PAYMENT_REQUEST =
  'app/StripePaymentModal/SEND_REQUEST_FOR_PAYMENT_REQUEST';
export const SEND_REQUEST_FOR_PAYMENT_SUCCESS =
  'app/StripePaymentModal/SEND_REQUEST_FOR_PAYMENT_SUCCESS';
export const SEND_REQUEST_FOR_PAYMENT_ERROR =
  'app/StripePaymentModal/SEND_REQUEST_FOR_PAYMENT_ERROR';

export const GENERATE_ACCESS_TOKEN_REQUEST = 'app/StripePaymentModal/CREATE_SENDBIRD_USER_REQUEST';
export const GENERATE_ACCESS_TOKEN_SUCCESS = 'app/StripePaymentModal/CREATE_SENDBIRD_USER_SUCCESS';
export const GENERATE_ACCESS_TOKEN_ERROR = 'app/StripePaymentModal/CREATE_SENDBIRD_USER_ERROR';

// ================ Reducer ================ //

const entityRefs = entities =>
  entities.map(entity => ({
    id: entity.id,
    type: entity.type,
  }));

const initialState = {
  otherUserListing: null,
  fetchOtherUserListingInProgress: false,
  fetchOtherUserListingError: false,
  transitionToRequestPaymentInProgress: false,
  transitionToRequestPaymentError: null,
  transitionToRequestPaymentSuccess: false,
  otherUserRef: null,
  fetchUserFromChannelUrlInProgress: false,
  fetchUserFromChannelUrlError: null,
  sendRequestForPaymentInProgress: false,
  sendRequestForPaymentError: null,
  sendRequestForPaymentSuccess: false,
  generateAccessTokenInProgress: false,
  generateAccessTokenError: null,
  generateAccessTokenSuccess: false,
};

const mergeEntityArrays = (a, b) => {
  return a.filter(aEntity => !b.find(bEntity => aEntity.id.uuid === bEntity.id.uuid)).concat(b);
};

export default function checkoutPageReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case SET_INITIAL_VALUES:
      return { ...initialState, ...payload };
    case FETCH_OTHER_USER_LISTING_REQUEST:
      return { ...state, fetchOtherUserListingInProgress: true, fetchOtherUserListingError: null };
    case FETCH_OTHER_USER_LISTING_SUCCESS:
      return {
        ...state,
        otherUserListing: payload,
        fetchOtherUserListingInProgress: false,
      };
    case FETCH_OTHER_USER_LISTING_ERROR:
      return {
        ...state,
        fetchOtherUserListingInProgress: false,
        fetchOtherUserListingError: payload,
      };

    case TRANSITION_TO_REQUEST_PAYMENT_REQUEST:
      return {
        ...state,
        transitionToRequestPaymentInProgress: true,
        transitionToRequestPaymentError: null,
      };
    case TRANSITION_TO_REQUEST_PAYMENT_SUCCESS:
      return {
        ...state,
        transitionToRequestPaymentSuccess: true,
        transitionToRequestPaymentInProgress: false,
      };
    case TRANSITION_TO_REQUEST_PAYMENT_ERROR:
      return {
        ...state,
        transitionToRequestPaymentInProgress: false,
        transitionToRequestPaymentError: payload,
      };

    case FETCH_USER_FROM_CHANNEL_URL_REQUEST:
      return {
        ...state,
        fetchUserFromChannelUrlInProgress: true,
        fetchUserFromChannelUrlError: null,
      };
    case FETCH_USER_FROM_CHANNEL_URL_SUCCESS:
      return {
        ...state,
        otherUserRef: entityRefs([payload])[0],
        fetchUserFromChannelUrlInProgress: false,
      };
    case FETCH_USER_FROM_CHANNEL_URL_ERROR:
      return {
        ...state,
        fetchUserFromChannelUrlInProgress: false,
        fetchUserFromChannelUrlError: payload,
      };

    case SEND_REQUEST_FOR_PAYMENT_REQUEST:
      return {
        ...state,
        sendRequestForPaymentInProgress: true,
        sendRequestForPaymentError: null,
      };
    case SEND_REQUEST_FOR_PAYMENT_SUCCESS:
      return {
        ...state,
        sendRequestForPaymentInProgress: false,
        sendRequestForPaymentSuccess: true,
      };
    case SEND_REQUEST_FOR_PAYMENT_ERROR:
      return {
        ...state,
        sendRequestForPaymentInProgress: false,
        sendRequestForPaymentError: payload,
      };

    case GENERATE_ACCESS_TOKEN_REQUEST:
      return {
        ...state,
        generateAccessTokenInProgress: true,
        generateAccessTokenError: null,
      };
    case GENERATE_ACCESS_TOKEN_SUCCESS:
      return {
        ...state,
        generateAccessTokenInProgress: false,
        generateAccessTokenSuccess: true,
      };
    case GENERATE_ACCESS_TOKEN_ERROR:
      return {
        ...state,
        generateAccessTokenInProgress: false,
        generateAccessTokenError: payload,
      };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const setInitialValues = initialValues => ({
  type: SET_INITIAL_VALUES,
  payload: pick(initialValues, Object.keys(initialState)),
});

const fetchOtherUserListingRequest = () => ({ type: FETCH_OTHER_USER_LISTING_REQUEST });
const fetchOtherUserListingSuccess = response => ({
  type: FETCH_OTHER_USER_LISTING_SUCCESS,
  payload: response[0],
});
const fetchOtherUserListingError = e => ({
  type: FETCH_OTHER_USER_LISTING_ERROR,
  error: true,
  payload: e,
});

const transitionToRequestPaymentRequest = () => ({ type: TRANSITION_TO_REQUEST_PAYMENT_REQUEST });
const transitionToRequestPaymentSuccess = () => ({
  type: TRANSITION_TO_REQUEST_PAYMENT_SUCCESS,
});
const transitionToRequestPaymentError = e => ({
  type: TRANSITION_TO_REQUEST_PAYMENT_ERROR,
  error: true,
  payload: e,
});

const fetchUserFromChannelUrlRequest = () => ({ type: FETCH_USER_FROM_CHANNEL_URL_REQUEST });
const fetchUserFromChannelUrlSuccess = otherUser => ({
  type: FETCH_USER_FROM_CHANNEL_URL_SUCCESS,
  payload: otherUser,
});
const fetchUserFromChannelUrlError = e => ({
  type: FETCH_USER_FROM_CHANNEL_URL_ERROR,
  error: true,
  payload: e,
});

export const sendRequestForPaymentRequest = () => ({
  type: SEND_REQUEST_FOR_PAYMENT_REQUEST,
});
export const sendRequestForPaymentSuccess = () => ({
  type: SEND_REQUEST_FOR_PAYMENT_SUCCESS,
});
export const sendRequestForPaymentError = e => ({
  type: SEND_REQUEST_FOR_PAYMENT_ERROR,
  error: true,
  payload: e,
});

export const generateAccessTokenRequest = () => ({
  type: GENERATE_ACCESS_TOKEN_REQUEST,
});
export const generateAccessTokenSuccess = () => ({
  type: GENERATE_ACCESS_TOKEN_SUCCESS,
});
export const generateAccessTokenError = e => ({
  type: GENERATE_ACCESS_TOKEN_ERROR,
  error: true,
  payload: e,
});

// ================ Thunks ================ //

export const fetchOtherUserListing = (channelUrl, currentUserId) => (dispatch, getState, sdk) => {
  dispatch(fetchOtherUserListingRequest());

  const params = {
    appId: process.env.REACT_APP_SENDBIRD_APP_ID,
    modules: [new GroupChannelModule()],
  };
  const sb = SendbirdChat.init(params);

  sb.connect(currentUserId)
    .then(() => {
      sb.groupChannel.getChannel(channelUrl).then(channel => {
        const members = channel.members;

        const otherUser = members.find(member => member.userId !== currentUserId);

        return sdk.listings.query({ authorId: otherUser.userId }).then(response => {
          dispatch(fetchOtherUserListingSuccess(response.data.data));
        });
      });
    })
    .catch(e => {
      dispatch(fetchOtherUserListingError(e));
      throw e;
    });
};

export const transitionToRequestPayment = otherUserListing => (dispatch, getState, sdk) => {
  dispatch(transitionToRequestPaymentRequest());

  const listingId = otherUserListing && otherUserListing.id.uuid;

  const bodyParams = {
    transition: TRANSITION_REQUEST_PAYMENT,
    processAlias: config.singleActionProcessAlias,
    // Will need to update for notifications
    params: { listingId },
  };
  return sdk.transactions
    .initiate(bodyParams)
    .then(response => {
      dispatch(transitionToRequestPaymentSuccess());
      return response;
    })
    .catch(e => {
      console.log(e);
      dispatch(transitionToRequestPaymentError(storableError(e)));
      throw e;
    });
};

export const fetchUserFromChannelUrl = (channelUrl, currentUserId) => (dispatch, getState, sdk) => {
  dispatch(fetchUserFromChannelUrlRequest());

  const params = {
    appId: process.env.REACT_APP_SENDBIRD_APP_ID,
    modules: [new GroupChannelModule()],
  };
  const sb = SendbirdChat.init(params);

  return sb
    .connect(currentUserId)
    .then(() => {
      sb.groupChannel.getChannel(channelUrl).then(channel => {
        const members = channel.members;

        const otherUser = members.find(member => member.userId !== currentUserId);

        sdk.users.show({ id: otherUser.userId, include: ['profileImage'] }).then(response => {
          dispatch(addMarketplaceEntities(response));
          dispatch(fetchUserFromChannelUrlSuccess(response.data.data));
          return response.data.data;
        });
      });
    })
    .catch(e => {
      dispatch(fetchUserFromChannelUrlError(e));
    });
};

export const sendRequestForPayment = (
  currentUserId,
  customerName,
  channelUrl,
  sendbirdContext,
  otherUserListing
) => (dispatch, getState, sdk) => {
  dispatch(sendRequestForPaymentRequest());

  const params = {
    appId: process.env.REACT_APP_SENDBIRD_APP_ID,
    modules: [new GroupChannelModule()],
  };

  const sb = SendbirdChat.init(params);

  sb.connect(currentUserId)
    .then(() => {
      sb.groupChannel.getChannel(channelUrl).then(channel => {
        const messageParams = {
          customType: 'REQUEST_FOR_PAYMENT',
          message: `You requested payment from ${customerName}.`,
          data: `{"customerName": "${customerName}"}`,
        };

        channel.sendUserMessage(messageParams).onSucceeded(message => {
          sendbirdContext.config.pubSub.publish('SEND_USER_MESSAGE', {
            message,
            channel,
          });
          dispatch(sendRequestForPaymentSuccess());
          dispatch(transitionToRequestPayment(otherUserListing));
        });
      });
    })
    .catch(e => {
      dispatch(sendRequestForPaymentError(e));
    });
};

export const generateAccessToken = currentUser => (dispatch, getState, sdk) => {
  dispatch(generateAccessTokenRequest());

  const params = {
    appId: process.env.REACT_APP_SENDBIRD_APP_ID,
  };
  const sb = SendbirdChat.init(params);

  sb.connect(currentUser.id.uuid)
    .then(() => {
      return sendbirdUser({ currentUser });
    })
    .then(() => {
      dispatch(fetchCurrentUser());
      dispatch(generateAccessTokenSuccess());
    })
    .catch(e => {
      log.error(e);
      dispatch(generateAccessTokenError(e));
    });
};

const IMAGE_VARIANTS = {
  'fields.image': [
    // Profile images
    'variants.square-small',
    'variants.square-small2x',

    // Listing images:
    'variants.landscape-crop',
    'variants.landscape-crop2x',
  ],
};

const isNonEmpty = value => {
  return typeof value === 'object' || Array.isArray(value) ? !isEmpty(value) : !!value;
};

// export const loadData = (params, search) => (dispatch, getState, sdk) => {
//   const state = getState().InboxPage;

//   const initialValues = txRef ? {} : pickBy(state, isNonEmpty);
//   dispatch(setInitialValues(initialValues));

//   dispatch(fetchTransactionsRequest());

//   const { page = 1 } = parse(search);

//   const apiQueryParams = {
//     lastTransitions: TRANSITIONS,
//     include: ['provider', 'provider.profileImage', 'customer', 'customer.profileImage', 'listing'],
//     'fields.transaction': ['lastTransition', 'lastTransitionedAt', 'transitions'],
//     'fields.user': ['profile.displayName', 'profile.abbreviatedName'],
//     'fields.image': ['variants.square-small', 'variants.square-small2x'],
//     page,
//     per_page: INBOX_PAGE_SIZE,
//   };

//   return sdk.transactions
//     .query(apiQueryParams)
//     .then(response => {
//       dispatch(addMarketplaceEntities(response));
//       dispatch(fetchTransactionsSuccess(response));
//       return response;
//     })
//     .then(response => {
//       response.data.data.forEach(transaction => {
//         dispatch(fetchMessages(transaction.id, 1));
//       });
//     })
//     .catch(e => {
//       dispatch(fetchTransactionsError(storableError(e)));
//       throw e;
//     });
// };
