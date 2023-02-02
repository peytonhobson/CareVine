import { storableError } from '../util/errors';
import { fetchCurrentUser } from './user.duck';
import * as log from '../util/log';
import {
  authenticateGenerateCriminalBackgroundCheck,
  authenticateTestResult,
  createUserAuthenticate,
  getAuthenticate7YearHistory,
  getIdentityProofQuiz,
  identityProofQuizVerification,
  submitConsentAuthenticate,
  updateUserAuthenticate,
  updateUserMetadata,
} from '../util/api';
import { updateProfile } from '../containers/ProfileSettingsPage/ProfileSettingsPage.duck';
import { addMarketplaceEntities } from './marketplaceData.duck';

const requestAction = actionType => params => ({ type: actionType, payload: { params } });

const successAction = actionType => result => ({ type: actionType, payload: result.data });

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

export const ENROLL_TCM_REQUEST = 'app/Authenticate/ENROLL_TCM_REQUEST';
export const ENROLL_TCM_SUCCESS = 'app/Authenticate/ENROLL_TCM_SUCCESS';
export const ENROLL_TCM_ERROR = 'app/Authenticate/ENROLL_TCM_ERROR';

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

    case ENROLL_TCM_REQUEST:
      return {
        ...state,
        enrollTcmInProgress: true,
        enrollTcmError: null,
      };
    case ENROLL_TCM_ERROR:
      return {
        ...state,
        enrollTcmInProgress: false,
        enrollTcmError: payload,
      };
    case ENROLL_TCM_SUCCESS:
      return {
        ...state,
        enrollTcmInProgress: false,
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

export const authenticateGenerateCriminalBackgroundRequest = requestAction(
  AUTHENTICATE_GENERATE_CRIMINAL_BACKGROUND_REQUEST
);
export const authenticateGenerateCriminalBackgroundSuccess = successAction(
  AUTHENTICATE_GENERATE_CRIMINAL_BACKGROUND_SUCCESS
);
export const authenticateGenerateCriminalBackgroundError = errorAction(
  AUTHENTICATE_GENERATE_CRIMINAL_BACKGROUND_ERROR
);

export const enrollTCMRequest = requestAction(ENROLL_TCM_REQUEST);
export const enrollTCMSuccess = successAction(ENROLL_TCM_SUCCESS);
export const enrollTCMError = errorAction(ENROLL_TCM_ERROR);

// ================ Thunk ================ //

export const authenticateCreateUser = (userInfo, userId) => (dispatch, getState, sdk) => {
  dispatch(authenticateCreateUserRequest());

  const fullName = `${userInfo.firstName} ${userInfo.lastName}`;

  return dispatch(updateProfile({ privateData: { authenticateFullName: fullName } }))
    .then(() => {
      return createUserAuthenticate({ userInfo });
    })
    .then(response => {
      return updateUserMetadata({
        metadata: { authenticateUserAccessCode: response.data },
        userId,
      });
    })
    .then(response => {
      dispatch(authenticateCreateUserSuccess(response));
      dispatch(fetchCurrentUser());
      return response;
    })
    .catch(e => {
      dispatch(authenticateCreateUserError(storableError(e)));
      throw e;
    });
};

export const authenticateUpdateUser = (userInfo, userAccessCode) => (dispatch, getState, sdk) => {
  dispatch(authenticateUpdateUserRequest());

  const fullName = `${userInfo.firstName} ${userInfo.lastName}`;

  return dispatch(updateProfile({ privateData: { authenticateFullName: fullName } }))
    .then(() => {
      return updateUserAuthenticate({ userInfo, userAccessCode });
    })
    .then(response => {
      dispatch(authenticateUpdateUserSuccess(response));
      dispatch(fetchCurrentUser());
      return response;
    })
    .catch(e => {
      dispatch(authenticateUpdateUserError(storableError(e)));
      throw e;
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
      return updateUserMetadata({
        metadata: { authenticateConsent: true },
        userId,
      });
    })
    .then(response => {
      dispatch(authenticateSubmitConsentSuccess(response));
      dispatch(fetchCurrentUser());
      return response;
    })
    .catch(e => {
      dispatch(authenticateSubmitConsentError(storableError(e)));
      throw e;
    });
};

export const identityProofQuiz = (userAccessCode, userId) => (dispatch, getState, sdk) => {
  dispatch(getIdentityProofQuizRequest());

  return getIdentityProofQuiz({ userAccessCode })
    .then(response => {
      return updateUserMetadata({
        metadata: { identityProofQuiz: response.data },
        userId,
      });
    })
    .then(response => {
      dispatch(getIdentityProofQuizSuccess(response));
      dispatch(fetchCurrentUser());
      return response;
    })
    .catch(e => {
      dispatch(getIdentityProofQuizError(storableError(e)));
      throw e;
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

  return identityProofQuizVerification({ payload })
    .then(response => {
      const metadata = !!response.data.success
        ? { identityProofQuizVerification: response.data }
        : { identityProofQuizAttempts: currentAttempts + 1 };

      updateUserMetadata({
        metadata,
        userId,
      }).then(() => {
        dispatch(fetchCurrentUser()).then(() => {
          if (response.data.success) {
            dispatch(verifyIdentityProofQuizSuccess(response));
          } else {
            dispatch(verifyIdentityProofQuizFailure(response));
          }
        });
      });
      return response;
    })
    .then(response => {
      if (response.data.success) {
        dispatch(authenticateGenerateCriminalBackground(userAccessCode, userId));
      }
      return response;
    })
    .catch(e => {
      dispatch(verifyIdentityProofQuizError(storableError(e)));
    });
};

export const authenticateGenerateCriminalBackground = (userAccessCode, userId) => (
  dispatch,
  getState,
  sdk
) => {
  dispatch(authenticateGenerateCriminalBackgroundRequest());

  return authenticateGenerateCriminalBackgroundCheck({ userAccessCode })
    .then(response => {
      updateUserMetadata({
        metadata: { authenticateCriminalBackgroundGenerated: response.data.success },
        userId,
      }).then(() => {
        dispatch(fetchCurrentUser());
      });
      return response;
    })
    .then(response => {
      dispatch(authenticateGenerateCriminalBackgroundSuccess(response));
      if (response.data.success) {
        dispatch(getAuthenticateTestResult(userAccessCode, userId));
      }
      return response;
    })
    .catch(e => {
      dispatch(authenticateGenerateCriminalBackgroundError(storableError(e)));
    });
};

export const getAuthenticateTestResult = (userAccessCode, userId) => (dispatch, getState, sdk) => {
  dispatch(getAuthenticateTestResultRequest());

  return authenticateTestResult({ userAccessCode })
    .then(response => {
      updateUserMetadata({
        metadata: {
          authenticateUserTestResult: response.data,
          backgroundCheckApproved: !response.data.backgroundCheck.hasCriminalRecord,
        },
        userId,
      }).then(() => {
        dispatch(fetchCurrentUser());
      });
      return response;
    })
    .then(response => {
      dispatch(getAuthenticateTestResultSuccess(response));
      return response;
    })
    .then(response => {
      if (response.data.backgroundCheck.hasCriminalRecord) {
        dispatch(authenticate7YearHistory(userAccessCode, userId));
      }
      return response;
    })
    .catch(e => {
      dispatch(getAuthenticateTestResultError(storableError(e)));
    });
};

export const authenticate7YearHistory = (userAccessCode, userId) => (dispatch, getState, sdk) => {
  dispatch(authenticate7YearHistoryRequest());

  return getAuthenticate7YearHistory({ userAccessCode })
    .then(response => {
      const { Candidate } = response.data.result.Candidates;
      updateUserMetadata({
        metadata: { authenticate7YearHistory: response.data, backgroundCheckApproved: !Candidate },
        userId,
      }).then(() => {
        dispatch(fetchCurrentUser());
      });
      return response;
    })
    .then(response => {
      dispatch(authenticate7YearHistorySuccess(response));
      return response;
    })
    .catch(e => {
      dispatch(authenticate7YearHistoryError(storableError(e)));
    });
};

export const enrollTCM = (userAccessCode, userId) => (dispatch, getState, sdk) => {
  dispatch(enrollTCMRequest());

  return enrollTCMAuthenticate({ userAccessCode })
    .then(response => {
      updateUserMetadata({
        metadata: { tcmEnrolled: response.data },
        userId,
      }).then(() => {
        dispatch(fetchCurrentUser());
      });
      return response;
    })
    .then(response => {
      dispatch(enrollTCMSuccess(response));
      return response;
    })
    .catch(e => {
      dispatch(enrollTCMError(storableError(e)));
    });
};
