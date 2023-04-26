import { storableError } from '../util/errors';
import { fetchCurrentUser } from './user.duck';
import {
  authenticateGenerateCriminalBackgroundCheck,
  authenticateTestResult,
  createUserAuthenticate,
  getAuthenticate7YearHistory,
  getIdentityProofQuiz,
  identityProofQuizVerification,
  submitConsentAuthenticate,
  updateUserAuthenticate,
  updateUser,
  applyPromo,
  sendgridStandardEmail,
} from '../util/api';
import * as log from '../util/log';
import { updateProfile } from '../containers/ProfileSettingsPage/ProfileSettingsPage.duck';
import {
  BACKGROUND_CHECK_APPROVED,
  BACKGROUND_CHECK_PENDING,
  BACKGROUND_CHECK_REJECTED,
} from '../util/constants';

const requestAction = actionType => params => ({ type: actionType, payload: { params } });

const successAction = actionType => payload => ({
  payload,
  type: actionType,
});

const errorAction = actionType => error => ({ type: actionType, payload: error, error: true });

// ================ Action types ================ //

export const AUTHENTICATE_CREATE_USER_REQUEST = 'app/Authenticate/AUTHENTICATE_CREATE_USER_REQUEST';
export const AUTHENTICATE_CREATE_USER_SUCCESS = 'app/Authenticate/AUTHENTICATE_CREATE_USER_SUCCESS';
export const AUTHENTICATE_CREATE_USER_ERROR = 'app/Authenticate/AUTHENTICATE_CREATE_USER_ERROR';

export const AUTHENTICATE_UPDATE_USER_REQUEST = 'app/Authenticate/AUTHENTICATE_UPDATE_USER_REQUEST';
export const AUTHENTICATE_UPDATE_USER_SUCCESS = 'app/Authenticate/AUTHENTICATE_UPDATE_USER_SUCCESS';
export const AUTHENTICATE_UPDATE_USER_ERROR = 'app/Authenticate/AUTHENTICATE_UPDATE_USER_ERROR';

export const AUTHENTICATE_SUBMIT_CONSENT_REQUEST =
  'app/Authenticate/AUTHENTICATE_SUBMIT_CONSENT_REQUEST';
export const AUTHENTICATE_SUBMIT_CONSENT_SUCCESS =
  'app/Authenticate/AUTHENTICATE_SUBMIT_CONSENT_SUCCESS';
export const AUTHENTICATE_SUBMIT_CONSENT_ERROR =
  'app/Authenticate/AUTHENTICATE_SUBMIT_CONSENT_ERROR';

export const GET_IDENTITY_PROOF_QUIZ_REQUEST = 'app/Authenticate/GET_IDENTITY_PROOF_QUIZ_REQUEST';
export const GET_IDENTITY_PROOF_QUIZ_SUCCESS = 'app/Authenticate/GET_IDENTITY_PROOF_QUIZ_SUCCESS';
export const GET_IDENTITY_PROOF_QUIZ_ERROR = 'app/Authenticate/GET_IDENTITY_PROOF_QUIZ_ERROR';

export const VERIFY_IDENTITY_PROOF_QUIZ_REQUEST =
  'app/Authenticate/VERIFY_IDENTITY_PROOF_QUIZ_REQUEST';
export const VERIFY_IDENTITY_PROOF_QUIZ_SUCCESS =
  'app/Authenticate/VERIFY_IDENTITY_PROOF_QUIZ_SUCCESS';
export const VERIFY_IDENTITY_PROOF_QUIZ_FAILURE =
  'app/Authenticate/VERIFY_IDENTITY_PROOF_QUIZ_FAILURE';
export const VERIFY_IDENTITY_PROOF_QUIZ_ERROR = 'app/Authenticate/VERIFY_IDENTITY_PROOF_QUIZ_ERROR';

export const GET_AUTHENTICATE_TEST_RESULT_REQUEST =
  'app/Authenticate/GET_AUTHENTICATE_TEST_RESULT_REQUEST';
export const GET_AUTHENTICATE_TEST_RESULT_SUCCESS =
  'app/Authenticate/GET_AUTHENTICATE_TEST_RESULT_SUCCESS';
export const GET_AUTHENTICATE_TEST_RESULT_ERROR =
  'app/Authenticate/GET_AUTHENTICATE_TEST_RESULT_ERROR';

export const AUTHENTICATE_7_YEAR_HISTORY_REQUEST =
  'app/Authenticate/AUTHENTICATE_7_YEAR_HISTORY_REQUEST';
export const AUTHENTICATE_7_YEAR_HISTORY_SUCCESS =
  'app/Authenticate/AUTHENTICATE_7_YEAR_HISTORY_SUCCESS';
export const AUTHENTICATE_7_YEAR_HISTORY_ERROR =
  'app/Authenticate/AUTHENTICATE_7_YEAR_HISTORY_ERROR';

export const AUTHENTICATE_GENERATE_CRIMINAL_BACKGROUND_REQUEST =
  'app/Authenticate/AUTHENTICATE_GENERATE_CRIMINAL_BACKGROUND_REQUEST';
export const AUTHENTICATE_GENERATE_CRIMINAL_BACKGROUND_SUCCESS =
  'app/Authenticate/AUTHENTICATE_GENERATE_CRIMINAL_BACKGROUND_SUCCESS';
export const AUTHENTICATE_GENERATE_CRIMINAL_BACKGROUND_ERROR =
  'app/Authenticate/AUTHENTICATE_GENERATE_CRIMINAL_BACKGROUND_ERROR';

export const APPLY_BC_PROMO_REQUEST = 'app/Authenticate/APPLY_BC_PROMO';
export const APPLY_BC_PROMO_SUCCESS = 'app/Authenticate/APPLY_BC_PROMO_SUCCESS';
export const APPLY_BC_PROMO_ERROR = 'app/Authenticate/APPLY_BC_PROMO_ERROR';

// ================ Reducer ================ //

const initialState = {
  // Error instance placeholders for each endpoint
  authenticateUpdateUserError: null,
  authenticateUpdateUserInProgress: false,
  authenticate7YearHistoryError: null,
  authenticate7YearHistoryInProgress: false,
  authenticateCreateUserError: null,
  authenticateCreateUserInProgress: false,
  authenticateGenerateCriminalBackgroundError: null,
  authenticateGenerateCriminalBackgroundInProgress: false,
  authenticateSubmitConsentError: null,
  authenticateSubmitConsentInProgress: false,
  getAuthenticateTestResultError: null,
  getAuthenticateTestResultInProgress: false,
  getIdentityProofQuizError: null,
  getIdentityProofQuizInProgress: false,
  identityProofQuiz: null,
  verifyIdentityProofQuizError: null,
  verifyIdentityProofQuizInProgress: false,
  verifyIdentityProofQuizFailure: false,
  enrollTCMInProgress: false,
  enrollTCMError: null,
  applyBCPromoInProgress: false,
  applyBCPromoError: null,
  bcPromo: null,
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case AUTHENTICATE_CREATE_USER_REQUEST:
      return {
        ...state,
        authenticateCreateUserInProgress: true,
        authenticateCreateUserError: null,
      };
    case AUTHENTICATE_CREATE_USER_ERROR:
      return {
        ...state,
        authenticateCreateUserInProgress: false,
        authenticateCreateUserError: payload,
      };
    case AUTHENTICATE_CREATE_USER_SUCCESS:
      return {
        ...state,
        authenticateCreateUserInProgress: false,
      };

    case AUTHENTICATE_UPDATE_USER_REQUEST:
      return {
        ...state,
        authenticateUpdateUserInProgress: true,
        authenticateUpdateUserError: null,
      };
    case AUTHENTICATE_UPDATE_USER_ERROR:
      return {
        ...state,
        authenticateUpdateUserInProgress: false,
        authenticateUpdateUserError: payload,
      };
    case AUTHENTICATE_UPDATE_USER_SUCCESS:
      return {
        ...state,
        authenticateUpdateUserInProgress: false,
      };

    case AUTHENTICATE_SUBMIT_CONSENT_REQUEST:
      return {
        ...state,
        authenticateSubmitConsentInProgress: true,
        authenticateSubmitConsentError: null,
      };
    case AUTHENTICATE_SUBMIT_CONSENT_ERROR:
      return {
        ...state,
        authenticateSubmitConsentInProgress: false,
        authenticateSubmitConsentError: payload,
      };
    case AUTHENTICATE_SUBMIT_CONSENT_SUCCESS:
      return {
        ...state,
        authenticateSubmitConsentInProgress: false,
      };

    case GET_IDENTITY_PROOF_QUIZ_REQUEST:
      return {
        ...state,
        getIdentityProofQuizInProgress: true,
        getIdentityProofQuizError: null,
      };
    case GET_IDENTITY_PROOF_QUIZ_ERROR:
      return {
        ...state,
        getIdentityProofQuizInProgress: false,
        getIdentityProofQuizError: payload,
      };
    case GET_IDENTITY_PROOF_QUIZ_SUCCESS:
      return {
        ...state,
        getIdentityProofQuizInProgress: false,
        identityProofQuiz: payload,
      };

    case VERIFY_IDENTITY_PROOF_QUIZ_REQUEST:
      return {
        ...state,
        verifyIdentityProofQuizInProgress: true,
        verifyIdentityProofQuizError: null,
        verifyIdentityProofQuizFailure: false,
      };
    case VERIFY_IDENTITY_PROOF_QUIZ_ERROR:
      return {
        ...state,
        verifyIdentityProofQuizInProgress: false,
        verifyIdentityProofQuizError: payload,
      };
    case VERIFY_IDENTITY_PROOF_QUIZ_SUCCESS:
      return {
        ...state,
        verifyIdentityProofQuizInProgress: false,
      };
    case VERIFY_IDENTITY_PROOF_QUIZ_FAILURE:
      return {
        ...state,
        verifyIdentityProofQuizInProgress: false,
        verifyIdentityProofQuizFailure: true,
      };

    case GET_AUTHENTICATE_TEST_RESULT_REQUEST:
      return {
        ...state,
        getAuthenticateTestResultInProgress: true,
        getAuthenticateTestResultError: null,
      };
    case GET_AUTHENTICATE_TEST_RESULT_ERROR:
      return {
        ...state,
        getAuthenticateTestResultInProgress: false,
        getAuthenticateTestResultError: payload,
      };
    case GET_AUTHENTICATE_TEST_RESULT_SUCCESS:
      return {
        ...state,
        getAuthenticateTestResultInProgress: false,
      };

    case AUTHENTICATE_7_YEAR_HISTORY_ERROR:
      return {
        ...state,
        authenticate7YearHistoryError: payload,
        authenticate7YearHistoryInProgress: false,
      };
    case AUTHENTICATE_7_YEAR_HISTORY_SUCCESS:
      return {
        ...state,
        authenticate7YearHistoryInProgress: false,
      };
    case AUTHENTICATE_7_YEAR_HISTORY_REQUEST:
      return {
        ...state,
        authenticate7YearHistoryInProgress: true,
        authenticate7YearHistoryError: null,
      };

    case AUTHENTICATE_GENERATE_CRIMINAL_BACKGROUND_REQUEST:
      return {
        ...state,
        authenticateGenerateCriminalBackgroundInProgress: true,
        authenticateGenerateCriminalBackgroundError: null,
      };
    case AUTHENTICATE_GENERATE_CRIMINAL_BACKGROUND_ERROR:
      return {
        ...state,
        authenticateGenerateCriminalBackgroundInProgress: false,
        authenticateGenerateCriminalBackgroundError: payload,
      };
    case AUTHENTICATE_GENERATE_CRIMINAL_BACKGROUND_SUCCESS:
      return {
        ...state,
        authenticateGenerateCriminalBackgroundInProgress: false,
      };

    case APPLY_BC_PROMO_REQUEST:
      return {
        ...state,
        applyBCPromoInProgress: true,
        applyBCPromoError: null,
      };
    case APPLY_BC_PROMO_ERROR:
      return {
        ...state,
        applyBCPromoInProgress: false,
        applyBCPromoError: payload,
      };
    case APPLY_BC_PROMO_SUCCESS:
      return {
        ...state,
        applyBCPromoInProgress: false,
        bcPromo: payload,
      };

    default:
      return state;
  }
}

// ================ Selectors ================ //

// ================ Action creators ================ //

export const authenticateCreateUserRequest = requestAction(AUTHENTICATE_CREATE_USER_REQUEST);
export const authenticateCreateUserSuccess = successAction(AUTHENTICATE_CREATE_USER_SUCCESS);
export const authenticateCreateUserError = errorAction(AUTHENTICATE_CREATE_USER_ERROR);

export const authenticateUpdateUserRequest = requestAction(AUTHENTICATE_UPDATE_USER_REQUEST);
export const authenticateUpdateUserSuccess = successAction(AUTHENTICATE_UPDATE_USER_SUCCESS);
export const authenticateUpdateUserError = errorAction(AUTHENTICATE_UPDATE_USER_ERROR);

export const authenticateSubmitConsentRequest = requestAction(AUTHENTICATE_SUBMIT_CONSENT_REQUEST);
export const authenticateSubmitConsentSuccess = successAction(AUTHENTICATE_SUBMIT_CONSENT_SUCCESS);
export const authenticateSubmitConsentError = errorAction(AUTHENTICATE_SUBMIT_CONSENT_ERROR);

export const getIdentityProofQuizRequest = requestAction(GET_IDENTITY_PROOF_QUIZ_REQUEST);
export const getIdentityProofQuizSuccess = successAction(GET_IDENTITY_PROOF_QUIZ_SUCCESS);
export const getIdentityProofQuizError = errorAction(GET_IDENTITY_PROOF_QUIZ_ERROR);

export const verifyIdentityProofQuizRequest = requestAction(VERIFY_IDENTITY_PROOF_QUIZ_REQUEST);
export const verifyIdentityProofQuizSuccess = successAction(VERIFY_IDENTITY_PROOF_QUIZ_SUCCESS);
export const verifyIdentityProofQuizError = errorAction(VERIFY_IDENTITY_PROOF_QUIZ_ERROR);
export const verifyIdentityProofQuizFailure = successAction(VERIFY_IDENTITY_PROOF_QUIZ_FAILURE);

export const getAuthenticateTestResultRequest = requestAction(GET_AUTHENTICATE_TEST_RESULT_REQUEST);
export const getAuthenticateTestResultSuccess = successAction(GET_AUTHENTICATE_TEST_RESULT_SUCCESS);
export const getAuthenticateTestResultError = errorAction(GET_AUTHENTICATE_TEST_RESULT_ERROR);

export const authenticate7YearHistoryRequest = requestAction(AUTHENTICATE_7_YEAR_HISTORY_REQUEST);
export const authenticate7YearHistorySuccess = successAction(AUTHENTICATE_7_YEAR_HISTORY_SUCCESS);
export const authenticate7YearHistoryError = errorAction(AUTHENTICATE_7_YEAR_HISTORY_ERROR);

export const applyBCPromoRequest = requestAction(APPLY_BC_PROMO_REQUEST);
export const applyBCPromoSuccess = successAction(APPLY_BC_PROMO_SUCCESS);
export const applyBCPromoError = errorAction(APPLY_BC_PROMO_ERROR);

export const authenticateGenerateCriminalBackgroundRequest = requestAction(
  AUTHENTICATE_GENERATE_CRIMINAL_BACKGROUND_REQUEST
);
export const authenticateGenerateCriminalBackgroundSuccess = successAction(
  AUTHENTICATE_GENERATE_CRIMINAL_BACKGROUND_SUCCESS
);
export const authenticateGenerateCriminalBackgroundError = errorAction(
  AUTHENTICATE_GENERATE_CRIMINAL_BACKGROUND_ERROR
);

// ================ Thunk ================ //

export const authenticateCreateUser = (userInfo, userId) => (dispatch, getState, sdk) => {
  dispatch(authenticateCreateUserRequest());

  const fullName = `${userInfo.firstName}${userInfo.middleName ? ` ${userInfo.middleName}` : ''} ${
    userInfo.lastName
  }`;

  return dispatch(updateProfile({ privateData: { authenticateFullName: fullName } }))
    .then(() => {
      return createUserAuthenticate({ userInfo });
    })
    .then(response => {
      return sdk.currentUser.updateProfile({
        privateData: { authenticateUserAccessCode: response.data },
      });
    })
    .then(response => {
      dispatch(authenticateCreateUserSuccess());
      dispatch(fetchCurrentUser());
      return response;
    })
    .catch(e => {
      log.error(e, 'authenticate-create-user-failed', {});
      dispatch(authenticateCreateUserError(storableError(e)));
    });
};

export const authenticateUpdateUser = (userInfo, userAccessCode) => (dispatch, getState, sdk) => {
  dispatch(authenticateUpdateUserRequest());

  const fullName = `${userInfo.firstName}${userInfo.middleName ? ` ${userInfo.middleName}` : ''} ${
    userInfo.lastName
  }`;

  return dispatch(updateProfile({ privateData: { authenticateFullName: fullName } }))
    .then(() => {
      return updateUserAuthenticate({ userInfo, userAccessCode });
    })
    .then(response => {
      dispatch(authenticateUpdateUserSuccess());
      dispatch(fetchCurrentUser());
      return response;
    })
    .catch(e => {
      log.error(e, 'authenticate-update-user-failed', {});
      dispatch(authenticateUpdateUserError(storableError(e)));
    });
};

export const authenticateSubmitConsent = (userAccessCode, fullName, userId) => (
  dispatch,
  getState,
  sdk
) => {
  dispatch(authenticateSubmitConsentRequest());

  return submitConsentAuthenticate({ userAccessCode, fullName })
    .then(response => {
      return sdk.currentUser.updateProfile({
        privateData: { authenticateConsent: true },
      });
    })
    .then(() => {
      return updateUser({
        userId,
        metadata: {
          backgroundCheckApproved: {
            status: 'started',
          },
        },
      });
    })
    .then(response => {
      dispatch(authenticateSubmitConsentSuccess());
      dispatch(fetchCurrentUser());
      return response;
    })
    .catch(e => {
      log.error(e, 'authenticate-submit-consent-failed', {});
      dispatch(authenticateSubmitConsentError(storableError(e)));
    });
};

export const identityProofQuiz = (userAccessCode, userId) => (dispatch, getState, sdk) => {
  dispatch(getIdentityProofQuizRequest());

  return getIdentityProofQuiz({ userAccessCode })
    .then(response => {
      dispatch(getIdentityProofQuizSuccess(response.data));
      return sdk.currentUser.updateProfile({
        privateData: { identityProofQuiz: response.data },
      });
    })
    .then(response => {
      dispatch(fetchCurrentUser());
      return response;
    })
    .catch(e => {
      log.error(e, 'identity-proof-quiz-failed', { userAccessCode });
      dispatch(getIdentityProofQuizError(storableError(e)));
    });
};

export const verifyIdentityProofQuiz = (
  IDMSessionId,
  userAccessCode,
  userId,
  questionAnswers,
  currentAttempts
) => (dispatch, getState, sdk) => {
  dispatch(verifyIdentityProofQuizRequest());

  const payload = {
    IDMSessionId,
    userAccessCode,
    questionAnswers,
  };

  let success = false;

  return identityProofQuizVerification({ payload })
    .then(response => {
      success = response?.data?.success;

      const privateData = !!response.data.success
        ? { identityProofQuizVerification: response.data }
        : {
            identityProofQuizVerification: response.data,
            identityProofQuizAttempts: currentAttempts + 1,
          };

      return sdk.currentUser.updateProfile({
        privateData,
      });
    })
    .then(response => {
      if (success) {
        dispatch(verifyIdentityProofQuizSuccess());
      } else {
        dispatch(verifyIdentityProofQuizFailure());
        dispatch(identityProofQuiz());
      }
      return response;
    })
    .then(response => {
      if (success) {
        return dispatch(authenticateGenerateCriminalBackground(userAccessCode, userId));
      }
      return response;
    })
    .then(response => {
      dispatch(fetchCurrentUser());
      return response;
    })
    .catch(e => {
      log.error(e, 'verify-identity-proof-quiz-failed', { payload });
      dispatch(verifyIdentityProofQuizError(storableError(e)));
    });
};

export const authenticateGenerateCriminalBackground = (userAccessCode, userId) => (
  dispatch,
  getState,
  sdk
) => {
  dispatch(authenticateGenerateCriminalBackgroundRequest());

  let success = false;

  return authenticateGenerateCriminalBackgroundCheck({ userAccessCode })
    .then(response => {
      success = response?.data?.success;

      return sdk.currentUser.updateProfile({
        privateData: { authenticateCriminalBackgroundGenerated: response?.data?.success },
      });
    })
    .then(response => {
      dispatch(authenticateGenerateCriminalBackgroundSuccess());
      if (success) {
        dispatch(getAuthenticateTestResult(userAccessCode, userId));
      }
      return response;
    })
    .then(response => {
      dispatch(fetchCurrentUser());
      return response;
    })
    .catch(e => {
      log.error(e, 'authenticate-generate-criminal-background-failed', {});
      dispatch(authenticateGenerateCriminalBackgroundError(storableError(e)));
    });
};

export const getAuthenticateTestResult = (userAccessCode, userId) => (dispatch, getState, sdk) => {
  dispatch(getAuthenticateTestResultRequest());

  let hasCriminalRecord = null;

  return authenticateTestResult({ userAccessCode })
    .then(response => {
      hasCriminalRecord = response?.data?.backgroundCheck?.hasCriminalRecord;

      return sdk.currentUser.updateProfile({
        privateData: {
          authenticateUserTestResult: response.data,
        },
      });
    })
    .then(() => {
      const newDate = new Date();
      return updateUser({
        userId,
        metadata: {
          backgroundCheckApproved: {
            status: !hasCriminalRecord ? BACKGROUND_CHECK_APPROVED : BACKGROUND_CHECK_PENDING,
            date: newDate.getTime(),
          },
        },
      });
    })
    .then(response => {
      dispatch(getAuthenticateTestResultSuccess(response));
      if (hasCriminalRecord) {
        dispatch(authenticate7YearHistory(userAccessCode, userId));
      }
      return response;
    })
    .then(response => {
      dispatch(fetchCurrentUser());
      return response;
    })
    .catch(e => {
      log.error(e, 'get-authenticate-test-result-failed', {});
      dispatch(getAuthenticateTestResultError(storableError(e)));
    });
};

export const authenticate7YearHistory = (userAccessCode, userId) => (dispatch, getState, sdk) => {
  dispatch(authenticate7YearHistoryRequest());

  let result = null;

  return getAuthenticate7YearHistory({ userAccessCode })
    .then(response => {
      result = response.data;
      return sdk.currentUser.updateProfile({
        privateData: {
          authenticate7YearHistory: result,
        },
      });
    })
    .then(() => {
      const newDate = new Date();
      const { Candidate } = result.result.Candidates;

      return updateUser({
        userId,
        metadata: {
          backgroundCheckApproved: {
            status: !Candidate ? BACKGROUND_CHECK_APPROVED : BACKGROUND_CHECK_PENDING,
            date: newDate.getTime(),
          },
        },
      });
    })
    .then(response => {
      sendgridStandardEmail({
        fromEmail: 'admin-notification@carevine.us',
        receiverEmail: 'peyton.hobson@carevine.us',
        subject: 'Criminal Background Check Review',
        html: `<span>User (${userId}) has a background check that needs reviewed.</span><br><br>
        <span>Result: ${JSON.stringify(result)}</span></br>`,
      });
      dispatch(fetchCurrentUser());
      dispatch(authenticate7YearHistorySuccess(response));
      return response;
    })
    .then(response => {
      dispatch(fetchCurrentUser());
      return response;
    })
    .catch(e => {
      log.error(e, 'authenticate-7-year-history-failed', {});
      dispatch(authenticate7YearHistoryError(storableError(e)));
    });
};

export const applyBCPromo = (promoCode, userId) => (dispatch, getState, sdk) => {
  dispatch(applyBCPromoRequest());

  return applyPromo({ promoCode })
    .then(response => {
      const result = {
        promoCode,
        discount: response?.data?.discount,
        date: new Date().getTime(),
      };

      return updateUser({
        userId,
        metadata: {
          backgroundCheckPromo: result,
        },
      }).then(() => result);
    })
    .then(result => {
      dispatch(fetchCurrentUser());
      dispatch(applyBCPromoSuccess(result));
      return result;
    })
    .catch(e => {
      log.error(e, 'apply-bc-promo-failed', {});
      dispatch(applyBCPromoError(storableError(e)));
    });
};
