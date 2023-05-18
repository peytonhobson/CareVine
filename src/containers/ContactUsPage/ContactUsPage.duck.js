import { storableError } from '../../util/errors';
import * as log from '../../util/log';
import { sendgridStandardEmail } from '../../util/api';

// ================ Action types ================ //

export const SEND_CONTACT_EMAIL_REQUEST = 'app/ContactUsPage/SEND_CONTACT_EMAIL_REQUEST';
export const SEND_CONTACT_EMAIL_SUCCESS = 'app/ContactUsPage/SEND_CONTACT_EMAI_SUCCESS';
export const SEND_CONTACT_EMAIL_ERROR = 'app/ContactUsPage/SEND_CONTACT_EMAI_ERROR';

// ================ Reducer ================ //

const initialState = {
  sendContactEmailInProgress: false,
  sendContactEmailError: null,
  sendContactEmailSuccess: false,
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case SEND_CONTACT_EMAIL_REQUEST:
      return {
        ...state,
        sendContactEmailInProgress: true,
        sendContactEmailError: null,
        sendContactEmailSuccess: false,
      };

    case SEND_CONTACT_EMAIL_SUCCESS:
      return {
        ...state,
        sendContactEmailInProgress: false,
        sendContactEmailSuccess: true,
      };
    case SEND_CONTACT_EMAIL_ERROR:
      return {
        ...state,
        sendContactEmailInProgress: false,
        sendContactEmailError: payload,
      };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const sendContactEmailSuccess = () => ({
  type: SEND_CONTACT_EMAIL_SUCCESS,
});
export const sendContactEmailError = e => ({
  type: SEND_CONTACT_EMAIL_ERROR,
  error: true,
  payload: e,
});
export const sendContactEmailRequest = () => ({
  type: SEND_CONTACT_EMAIL_REQUEST,
});

// ================ Thunk ================ //

export const sendContactEmail = (email, message) => (dispatch, getState, sdk) => {
  dispatch(sendContactEmailRequest());

  return sendgridStandardEmail({
    fromEmail: 'admin-notification@@carevine-mail.us',
    receiverEmail: 'peyton.hobson@carevine.us',
    subject: 'User "Contact Us" Submission',
    html: `User Email: ${email} <br><br> Message: ${message}`,
  })
    .then(() => {
      localStorage.setItem('carevineLastContactMessage', Date.now());
      dispatch(sendContactEmailSuccess());
      return;
    })
    .catch(e => {
      log.error(e, 'send-contact-us-email-failed', { email, message });
      dispatch(sendContactEmailError(storableError(e)));
    });
};
