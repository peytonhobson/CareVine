import SendbirdChat from '@sendbird/chat';
import { GroupChannelModule } from '@sendbird/chat/groupChannel';
import { fetchCurrentUser } from '../ducks/user.duck';
import { sendbirdUser } from '../util/api';
import * as log from '../util/log';

export const GENERATE_ACCESS_TOKEN_REQUEST = 'app/sendbird/CREATE_SENDBIRD_USER_REQUEST';
export const GENERATE_ACCESS_TOKEN_SUCCESS = 'app/sendbird/CREATE_SENDBIRD_USER_SUCCESS';
export const GENERATE_ACCESS_TOKEN_ERROR = 'app/sendbird/CREATE_SENDBIRD_USER_ERROR';

const initialState = {
  generateAccessTokenError: null,
  generateAccessTokenInProgress: false,
  generateAccessTokenSuccess: false,
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
