import { storableError } from '../../util/errors';
import * as log from '../../util/log';
import { sendFeedbackEmail } from '../../util/api';

// ================ Action types ================ //

export const SEND_FEEDBACK_EMAIL_REQUEST = 'app/FeedbackPage/SEND_FEEDBACK_EMAIL_REQUEST';
export const SEND_FEEDBACK_EMAIL_SUCCESS = 'app/FeedbackPage/SEND_FEEDBACK_EMAIL_SUCCESS';
export const SEND_FEEDBACK_EMAIL_ERROR = 'app/FeedbackPage/SEND_FEEDBACK_EMAIL_ERROR';

// ================ Reducer ================ //

const initialState = {
  sendFeedbackEmailInProgress: false,
  sendFeedbackEmailError: null,
  sendFeedbackEmailSuccess: false,
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case SEND_FEEDBACK_EMAIL_REQUEST:
      return {
        ...state,
        sendFeedbackEmailInProgress: true,
        sendFeedbackEmailError: null,
        sendFeedbackEmailSuccess: false,
      };

    case SEND_FEEDBACK_EMAIL_SUCCESS:
      return {
        ...state,
        sendFeedbackEmailInProgress: false,
        sendFeedbackEmailSuccess: true,
      };
    case SEND_FEEDBACK_EMAIL_ERROR:
      return {
        ...state,
        sendFeedbackEmailInProgress: false,
        sendFeedbackEmailError: payload,
      };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const sendFeedbackEmailSuccess = () => ({
  type: SEND_FEEDBACK_EMAIL_SUCCESS,
});
export const sendFeedbackEmailError = e => ({
  type: SEND_FEEDBACK_EMAIL_ERROR,
  error: true,
  payload: e,
});
export const sendFeedbackEmailRequest = () => ({
  type: SEND_FEEDBACK_EMAIL_REQUEST,
});

// ================ Thunk ================ //

export const feedbackEmail = feedback => (dispatch, getState, sdk) => {
  dispatch(sendFeedbackEmailRequest());

  return sendFeedbackEmail({ feedback })
    .then(() => {
      dispatch(sendFeedbackEmailSuccess());
      return;
    })
    .catch(e => {
      log.error(e, 'send-feedback-email-failed', { feedback });
      dispatch(sendFeedbackEmailError(storableError(e)));
    });
};
