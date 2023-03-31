import SendbirdChat from '@sendbird/chat';
import { GroupChannelModule } from '@sendbird/chat/groupChannel';
import * as log from '../../util/log';

// ================ Action types ================ //

export const CHANGE_MODAL_VALUE_REQUEST = 'app/TopbarContainer/CHANGE_MODAL_VALUE_REQUEST';
export const CHANGE_MODAL_VALUE_SUCCESS = 'app/TopbarContainer/CHANGE_MODAL_VALUE_SUCCESS';
export const CHANGE_MODAL_VALUE_ERROR = 'app/TopbarContainer/CHANGE_MODAL_VALUE_ERROR';

export const FETCH_UNREAD_MESSAGES_REQUEST = 'app/TopbarContainer/FETCH_UNREAD_MESSAGES_REQUEST';
export const FETCH_UNREAD_MESSAGES_SUCCESS = 'app/TopbarContainer/FETCH_UNREAD_MESSAGES_SUCCESS';
export const FETCH_UNREAD_MESSAGES_ERROR = 'app/TopbarContainer/FETCH_UNREAD_MESSAGES_ERROR';

// ================ Reducer ================ //

const initialState = {
  modalValue: null,
  changeModalValueInProgress: false,
  changeModalValueError: null,
  fetchUnreadMessagesInProgress: false,
  fetchUnreadMessagesError: null,
  unreadMessages: null,
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case CHANGE_MODAL_VALUE_REQUEST:
      return {
        ...state,
        changeModalValueInProgress: true,
        changeModalValueError: false,
      };
    case CHANGE_MODAL_VALUE_SUCCESS:
      return {
        ...state,
        modalValue: payload,
        changeModalValueInProgress: false,
      };
    case CHANGE_MODAL_VALUE_ERROR:
      return {
        ...state,
        changeModalValueInProgress: false,
        changeModalValueError: payload,
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

// ================ Action creators ================ //

export const changeModalValueRequest = () => ({
  type: CHANGE_MODAL_VALUE_REQUEST,
});
export const changeModalValueSuccess = modalType => ({
  type: CHANGE_MODAL_VALUE_SUCCESS,
  payload: modalType,
});
export const changeModalValueError = e => ({
  type: CHANGE_MODAL_VALUE_ERROR,
  payload: e,
  error: true,
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

// ================ Thunks ================ //

export const changeModalValue = value => (dispatch, getState, sdk) => {
  return dispatch(changeModalValueSuccess(value));
};

export const fetchUnreadMessages = () => async (dispatch, getState, sdk) => {
  const currentUserId = getState().user?.currentUser?.id?.uuid;
  const accessToken = getState().user?.currentUser?.attributes?.profile?.privateData?.sbAccessToken;

  const params = {
    appId: process.env.REACT_APP_SENDBIRD_APP_ID,
    modules: [new GroupChannelModule()],
  };
  const sb = SendbirdChat.init(params);

  try {
    await sb.connect(currentUserId, accessToken);
  } catch (e) {
    log.error(e, 'connect-failed', {});
  }

  try {
    const count = await sb.groupChannel.getTotalUnreadMessageCount();
    dispatch(fetchUnreadMessagesSuccess(count));
  } catch (e) {
    log.error(e, 'fetch-unread-messages-failed', {});
    dispatch(fetchUnreadMessagesError(e));
  }
};

export const loadData = () => (dispatch, getState, sdk) => {
  return getState().modalValue;
};
