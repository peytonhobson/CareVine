import { updateUser } from '../../util/api';
import { storableError } from '../../util/errors';
import * as log from '../../util/log';
import { fetchCurrentUser } from '../../ducks/user.duck';

// ================ Action types ================ //

export const GENERATE_REFERRAL_CODE_REQUEST = 'app/ReferralPage/GENERATE_REFERRAL_CODE_REQUEST';
export const GENERATE_REFERRAL_CODE_SUCCESS = 'app/ReferralPage/GENERATE_REFERRAL_CODE_SUCCESS';
export const GENERATE_REFERRAL_CODE_ERROR = 'app/ReferralPage/GENERATE_REFERRAL_CODE_ERROR';

// ================ Reducer ================ //

const initialState = {
  generateReferralCodeInProgress: false,
  generateReferralCodeError: null,
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case GENERATE_REFERRAL_CODE_REQUEST:
      return {
        ...state,
        generateReferralCodeInProgress: true,
        generateReferralCodeError: null,
      };
    case GENERATE_REFERRAL_CODE_SUCCESS:
      return {
        ...state,
        generateReferralCodeInProgress: false,
      };
    case GENERATE_REFERRAL_CODE_ERROR:
      return {
        ...state,
        generateReferralCodeInProgress: false,
        generateReferralCodeError: payload,
      };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const generateReferralCodeRequest = () => ({ type: GENERATE_REFERRAL_CODE_REQUEST });
export const generateReferralCodeSuccess = () => ({ type: GENERATE_REFERRAL_CODE_SUCCESS });
export const generateReferralCodeError = error => ({
  type: GENERATE_REFERRAL_CODE_ERROR,
  payload: error,
  error: true,
});

// ================ Thunk ================ //

export const generateReferralCode = () => async (dispatch, getState, sdk) => {
  dispatch(generateReferralCodeRequest());

  const referralCode = Math.floor(Math.random() * 1000000000000);

  try {
    await updateUser({ metadata: { referralCode } });

    dispatch(fetchCurrentUser());
    dispatch(generateReferralCodeSuccess());
  } catch (e) {
    dispatch(generateReferralCodeError(storableError(e)));
    log.error(e, 'generate-referral-code-failed', {
      referralCode,
    });
  }
};
