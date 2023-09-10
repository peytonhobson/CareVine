import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import * as log from '../../util/log';
import { TRANSITION_INITIAL_MESSAGE } from '../../util/transaction';

// ================ Action types ================ //

export const CHANGE_MODAL_VALUE_REQUEST = 'app/TopbarContainer/CHANGE_MODAL_VALUE_REQUEST';
export const CHANGE_MODAL_VALUE_SUCCESS = 'app/TopbarContainer/CHANGE_MODAL_VALUE_SUCCESS';
export const CHANGE_MODAL_VALUE_ERROR = 'app/TopbarContainer/CHANGE_MODAL_VALUE_ERROR';

export const FETCH_UNREAD_MESSAGE_COUNT_REQUEST =
  'app/TopbarContainer/FETCH_UNREAD_MESSAGE_COUNT_REQUEST';
export const FETCH_UNREAD_MESSAGE_COUNT_SUCCESS =
  'app/TopbarContainer/FETCH_UNREAD_MESSAGE_COUNT_SUCCESS';
export const FETCH_UNREAD_MESSAGE_COUNT_ERROR =
  'app/TopbarContainer/FETCH_UNREAD_MESSAGE_COUNT_ERROR';

export const SET_SEND_WEBSOCKET_MESSAGE = 'app/TopbarContainer/SET_SEND_WEBSOCKET_MESSAGE';

// ================ Reducer ================ //

const entityRefs = entities =>
  entities.map(entity => ({
    id: entity.id,
    type: entity.type,
  }));

const initialState = {
  modalValue: null,
  changeModalValueInProgress: false,
  changeModalValueError: null,
  unreadMessageCount: 0,
  fetchUnreadMessageCountInProgress: false,
  fetchUnreadMessageCountError: null,
  sendWebsocketMessage: null,
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

    case FETCH_UNREAD_MESSAGE_COUNT_REQUEST:
      return {
        ...state,
        fetchUnreadMessageCountInProgress: true,
        fetchUnreadMessageCountError: false,
      };
    case FETCH_UNREAD_MESSAGE_COUNT_SUCCESS:
      return {
        ...state,
        unreadMessageCount: payload,
        fetchUnreadMessageCountInProgress: false,
      };
    case FETCH_UNREAD_MESSAGE_COUNT_ERROR:
      return {
        ...state,
        fetchUnreadMessageCountInProgress: false,
        fetchUnreadMessageCountError: payload,
      };

    case SET_SEND_WEBSOCKET_MESSAGE:
      return {
        ...state,
        sendWebsocketMessage: payload,
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

export const fetchUnreadMessageCountRequest = () => ({
  type: FETCH_UNREAD_MESSAGE_COUNT_REQUEST,
});
export const fetchUnreadMessageCountSuccess = unreadMessageCount => ({
  type: FETCH_UNREAD_MESSAGE_COUNT_SUCCESS,
  payload: unreadMessageCount,
});
export const fetchUnreadMessageCountError = e => ({
  type: FETCH_UNREAD_MESSAGE_COUNT_ERROR,
  payload: e,
  error: true,
});

export const sendWebsocketMessageSet = func => ({
  type: SET_SEND_WEBSOCKET_MESSAGE,
  payload: func,
});

// ================ Thunks ================ //

export const setSendWebsocketMessage = func => (dispatch, getState, sdk) => {
  dispatch(sendWebsocketMessageSet(func));
};

export const changeModalValue = value => (dispatch, getState, sdk) => {
  return dispatch(changeModalValueSuccess(value));
};

export const fetchUnreadMessageCount = () => async (dispatch, getState, sdk) => {
  dispatch(fetchUnreadMessageCountRequest());

  const apiQueryParams = {
    lastTransitions: TRANSITION_INITIAL_MESSAGE,
    'fields.transaction': ['metadata'],
  };

  try {
    const response = await sdk.transactions.query(apiQueryParams);

    const currentUser = getState().user.currentUser;

    const unreadMessages = response.data.data?.reduce((acc, conversation) => {
      const unreadMessageCount = conversation.attributes.metadata.unreadMessageCount;

      const myUnreadMessages = unreadMessageCount && unreadMessageCount[currentUser?.id?.uuid];

      return acc + (myUnreadMessages ? myUnreadMessages : 0);
    }, 0);

    console.log('unreadMessages', unreadMessages);

    dispatch(fetchUnreadMessageCountSuccess(unreadMessages));
  } catch (e) {
    dispatch(fetchUnreadMessageCountError(e));
  }
};

export const loadData = () => (dispatch, getState, sdk) => {
  return getState().modalValue;
};
