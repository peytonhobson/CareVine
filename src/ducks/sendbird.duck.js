import SendbirdChat from '@sendbird/chat';
import { GroupChannelModule } from '@sendbird/chat/groupChannel';
import { fetchCurrentUser } from '../ducks/user.duck';
import { sendbirdUser, sendbirdUnreadMessages } from '../util/api';
import * as log from '../util/log';

export const GENERATE_ACCESS_TOKEN_REQUEST = 'app/sendbird/CREATE_SENDBIRD_USER_REQUEST';
export const GENERATE_ACCESS_TOKEN_SUCCESS = 'app/sendbird/CREATE_SENDBIRD_USER_SUCCESS';
export const GENERATE_ACCESS_TOKEN_ERROR = 'app/sendbird/CREATE_SENDBIRD_USER_ERROR';

export const FETCH_UNREAD_MESSAGES_REQUEST = 'app/sendbird/FETCH_UNREAD_MESSAGES_REQUEST';
export const FETCH_UNREAD_MESSAGES_SUCCESS = 'app/sendbird/FETCH_UNREAD_MESSAGES_SUCCESS';
export const FETCH_UNREAD_MESSAGES_ERROR = 'app/sendbird/FETCH_UNREAD_MESSAGES_ERROR';

const initialState = {
  generateAccessTokenError: null,
  generateAccessTokenInProgress: false,
  generateAccessTokenSuccess: false,
  fetchUnreadMessagesInProgress: false,
  fetchUnreadMessagesError: null,
  unreadMessages: null,
};

export default function checkoutPageReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
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

    case FETCH_UNREAD_MESSAGES_REQUEST:
      return {
        ...state,
        fetchUnreadMessagesInProgress: true,
        fetchUnreadMessagesError: false,
      };
    case FETCH_UNREAD_MESSAGES_SUCCESS:
      return {
        ...state,
        unreadMessages: payload,
        fetchUnreadMessagesInProgress: false,
      };
    case FETCH_UNREAD_MESSAGES_ERROR:
      return {
        ...state,
        fetchUnreadMessagesInProgress: false,
        fetchUnreadMessagesError: payload,
      };

    default:
      return state;
  }
}

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

export const fetchUnreadMessagesRequest = () => ({
  type: FETCH_UNREAD_MESSAGES_REQUEST,
});
export const fetchUnreadMessagesSuccess = unreadMessages => ({
  type: FETCH_UNREAD_MESSAGES_SUCCESS,
  payload: unreadMessages,
});
export const fetchUnreadMessagesError = e => ({
  type: FETCH_UNREAD_MESSAGES_ERROR,
  payload: e,
  error: true,
});

export const generateAccessToken = currentUser => (dispatch, getState, sdk) => {
  dispatch(generateAccessTokenRequest());

  const params = {
    appId: process.env.REACT_APP_SENDBIRD_APP_ID,
    modules: [new GroupChannelModule()],
  };
  const sb = SendbirdChat.init(params);

  // May be failing when current user isnt available
  sb.connect(currentUser.id.uuid)
    .then(() => {
      return sendbirdUser({ currentUser });
    })
    .then(() => {
      dispatch(fetchCurrentUser());
      dispatch(generateAccessTokenSuccess());
    })
    .catch(e => {
      log.error(e, 'generate-access-token-failed');
      dispatch(generateAccessTokenError(e));
    });
};

export const fetchUnreadMessages = () => async (dispatch, getState, sdk) => {
  const userAccessCode = getState().user.currentUser?.id?.uuid;

  try {
    // const { unread_count } = await sendbirdUnreadMessages({ userAccessCode });
    dispatch(fetchUnreadMessagesSuccess(0));
  } catch (e) {
    log.error(e, 'fetch-unread-messages-failed', {});
    dispatch(fetchUnreadMessagesError(e));
  }
};
