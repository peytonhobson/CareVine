import pick from 'lodash/pick';
import SendbirdChat from '@sendbird/chat';
import { GroupChannelModule } from '@sendbird/chat/groupChannel';

import { storableError } from '../../util/errors';
import { TRANSITION_REQUEST_PAYMENT } from '../../util/transaction';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import * as log from '../../util/log';
import config from '../../config';
import { fetchCurrentUser } from '../../ducks/user.duck';
import { updateUserNotifications } from '../../util/api';
import { userDisplayNameAsString } from '../../util/data';
import { NOTIFICATION_TYPE_PAYMENT_REQUESTED } from '../../util/constants';
import { v4 as uuidv4 } from 'uuid';

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

export const FETCH_OTHER_USERS_REQUEST = 'app/InboxPage/FETCH_OTHER_USERS_REQUEST';
export const FETCH_OTHER_USERS_SUCCESS = 'app/InboxPage/FETCH_OTHER_USERS_SUCCESS';
export const FETCH_OTHER_USERS_ERROR = 'app/InboxPage/FETCH_OTHER_USERS_ERROR';

// ================ Reducer ================ //

const entityRefs = entities =>
  entities.map(entity => ({
    id: entity.id,
    type: entity.type,
  }));

const initialState = {
  fetchOtherUserListingError: null,
  fetchOtherUserListingInProgress: false,
  fetchUserFromChannelUrlError: null,
  fetchUserFromChannelUrlInProgress: false,
  otherUserListing: null,
  otherUserRef: null,
  sendRequestForPaymentError: null,
  sendRequestForPaymentInProgress: false,
  sendRequestForPaymentSuccess: false,
  transitionToRequestPaymentError: null,
  transitionToRequestPaymentInProgress: false,
  transitionToRequestPaymentSuccess: false,
  fetchOtherUsersInProgress: false,
  fetchOtherUsersError: null,
  otherUsersRefs: null,
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
        sendRequestForPaymentSuccess: false,
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

    case FETCH_OTHER_USERS_REQUEST:
      return {
        ...state,
        fetchOtherUsersInProgress: true,
        fetchOtherUsersError: null,
      };
    case FETCH_OTHER_USERS_SUCCESS:
      return {
        ...state,
        otherUsersRefs: entityRefs(payload),
        fetchOtherUsersInProgress: false,
      };
    case FETCH_OTHER_USERS_ERROR:
      return {
        ...state,
        fetchOtherUsersInProgress: false,
        fetchOtherUsersError: payload,
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

export const fetchOtherUsersRequest = () => ({
  type: FETCH_OTHER_USERS_REQUEST,
});
export const fetchOtherUsersSuccess = response => ({
  type: FETCH_OTHER_USERS_SUCCESS,
  payload: response,
});
export const fetchOtherUsersError = e => ({
  type: FETCH_OTHER_USERS_ERROR,
  error: true,
  payload: e,
});

// ================ Thunks ================ //

export const fetchOtherUserListing = (channelUrl, currentUserId, accessToken) => (
  dispatch,
  getState,
  sdk
) => {
  dispatch(fetchOtherUserListingRequest());

  const params = {
    appId: process.env.REACT_APP_SENDBIRD_APP_ID,
    modules: [new GroupChannelModule()],
  };
  const sb = SendbirdChat.init(params);

  sb.connect(currentUserId, accessToken)
    .then(() => {
      sb.groupChannel.getChannel(channelUrl).then(channel => {
        const members = channel.members;

        const otherUser = members.find(member => member.userId !== currentUserId);

        return sdk.listings.query({ authorId: otherUser?.userId }).then(response => {
          dispatch(fetchOtherUserListingSuccess(response.data.data));
        });
      });
    })
    .catch(e => {
      log.error(e, 'fetch-other-user-listing-failed');
      dispatch(fetchOtherUserListingError(e));
      throw e;
    });
};

export const transitionToRequestPayment = (otherUserListing, channelUrl) => (
  dispatch,
  getState,
  sdk
) => {
  dispatch(transitionToRequestPaymentRequest());

  const listingId = otherUserListing?.id?.uuid;

  const bodyParams = {
    transition: TRANSITION_REQUEST_PAYMENT,
    processAlias: config.singleActionProcessAlias,
    params: { listingId, protectedData: { channelUrl } },
  };
  return sdk.transactions
    .initiate(bodyParams)
    .then(response => {
      dispatch(transitionToRequestPaymentSuccess());
      return response;
    })
    .catch(e => {
      log.error(e, 'transition-to-request-payment-failed');
      dispatch(transitionToRequestPaymentError(storableError(e)));
      throw e;
    });
};

export const fetchUserFromChannelUrl = (channelUrl, currentUserId, accessToken) => (
  dispatch,
  getState,
  sdk
) => {
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

        sdk.users
          .show({ id: otherUser && otherUser.userId, include: ['profileImage'] })
          .then(response => {
            dispatch(addMarketplaceEntities(response));
            dispatch(fetchUserFromChannelUrlSuccess(response.data.data));
            return response.data.data;
          });
      });
    })
    .catch(e => {
      log.error(e, 'fetch-user-from-channel-url-failed');
      dispatch(fetchUserFromChannelUrlError(e));
    });
};

export const sendRequestForPayment = (
  currentUser,
  channelUrl,
  otherUserListing,
  otherUser
) => async (dispatch, getState, sdk) => {
  dispatch(sendRequestForPaymentRequest());

  const senderName = userDisplayNameAsString(currentUser);
  const userId = otherUser.id.uuid;
  const newNotification = {
    id: uuidv4(),
    type: NOTIFICATION_TYPE_PAYMENT_REQUESTED,
    createdAt: new Date().getTime(),
    isRead: false,
    metadata: {
      senderName,
      channelUrl,
      providerId: userId,
    },
  };

  try {
    const response = await updateUserNotifications({
      userId,
      newNotification,
    });

    dispatch(sendRequestForPaymentSuccess());
    dispatch(transitionToRequestPayment(otherUserListing, channelUrl));
  } catch (e) {
    log.error(e, 'send-request-for-payment-failed');
    dispatch(sendRequestForPaymentError(e));
  }
};

export const fetchOtherUsers = (userId, accessToken) => async (dispatch, getState, sdk) => {
  dispatch(fetchOtherUsersRequest());

  try {
    const params = {
      appId: process.env.REACT_APP_SENDBIRD_APP_ID,
      modules: [new GroupChannelModule()],
    };
    const sb = SendbirdChat.init(params);

    await sb.connect(userId, accessToken);

    const queryParams = {
      userIdsFiter: [userId],
    };
    const query = sb.groupChannel.createMyGroupChannelListQuery(queryParams);

    if (query.hasNext) {
      const channels = await query.next();

      const userIds = channels.map(channel => {
        const members = channel.members;

        const otherUser = members.find(member => member.userId !== userId);
        return otherUser.userId;
      });

      const responses = await Promise.all(
        userIds.map(async id => {
          const user = await sdk.users.show({
            id,
            include: ['profileImage'],
            'fields.user': ['profile.publicData', 'profile.abbreviatedName'],
          });

          dispatch(addMarketplaceEntities(user));

          return user.data.data;
        })
      );

      dispatch(fetchOtherUsersSuccess(responses));
    }
  } catch (e) {
    log.error(e, 'fetch-other-users-failed');
    dispatch(fetchOtherUsersError(e));
  }
};
