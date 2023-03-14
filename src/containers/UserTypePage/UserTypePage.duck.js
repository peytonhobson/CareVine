import { chain } from 'lodash';
import { fetchCurrentUser } from '../../ducks/user.duck';
import { updateUserMetadata } from '../../util/api';
import { storableError } from '../../util/errors';
import * as log from '../../util/log';

// ================ Action types ================ //

export const UPDATE_USER_TYPE_REQUEST = 'app/UserTypePage/UPDATE_USER_TYPE_REQUEST';
export const UPDATE_USER_TYPE_SUCCESS = 'app/UserTypePage/UPDATE_USER_TYPE_SUCCESS';
export const UPDATE_USER_TYPE_ERROR = 'app/UserTypePage/UPDATE_USER_TYPE_ERROR';

// ================ Reducer ================ //

const initialState = {
  userType: null,
  updateUserTypeError: null,
  updateUserTypeInProgress: false,
};

export default function payoutMethodsPageReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case UPDATE_USER_TYPE_REQUEST:
      return { ...state, userTypeFetchError: null, updateUserTypeInProgress: true };
    case UPDATE_USER_TYPE_SUCCESS:
      return { ...state, userType: payload, updateUserTypeInProgress: false };
    case UPDATE_USER_TYPE_ERROR:
      console.error(payload); // eslint-disable-line no-console
      return { ...state, updateUserTypeError: payload, updateUserTypeInProgress: false };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const updateUserTypeRequest = () => ({ type: UPDATE_USER_TYPE_REQUEST });
export const updateUserTypeSuccess = userType => ({
  type: UPDATE_USER_TYPE_SUCCESS,
  payload: userType,
});
export const updateUserTypeError = e => ({
  type: UPDATE_USER_TYPE_ERROR,
  error: true,
  payload: e,
});

// ================ Thunks ================ //

export const updateUserType = userType => (dispatch, getState, sdk) => {
  dispatch(updateUserTypeRequest());

  const userId = getState().user?.currentUser?.id?.uuid;

  return updateUserMetadata({ userId, metadata: { userType } })
    .then(res => {
      dispatch(updateUserTypeSuccess(userType));
      dispatch(fetchCurrentUser());
    })
    .catch(e => {
      log.error(e, 'update-user-type-failed', { userType });
      dispatch(updateUserTypeError(storableError(e)));
    });
};

export const loadData = () => (dispatch, getState, sdk) => {
  return dispatch(fetchCurrentUser());
};
