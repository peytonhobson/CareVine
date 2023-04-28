import { updateUser, sendgridReferralEmail } from '../../util/api';
import { storableError } from '../../util/errors';
import * as log from '../../util/log';
import { fetchCurrentUser } from '../../ducks/user.duck';
import { v4 as uuidv4 } from 'uuid';

// ================ Action types ================ //

export const GENERATE_REFERRAL_CODE_REQUEST = 'app/ReferralPage/GENERATE_REFERRAL_CODE_REQUEST';
export const GENERATE_REFERRAL_CODE_SUCCESS = 'app/ReferralPage/GENERATE_REFERRAL_CODE_SUCCESS';
export const GENERATE_REFERRAL_CODE_ERROR = 'app/ReferralPage/GENERATE_REFERRAL_CODE_ERROR';

export const SEND_REFERRAL_REQUEST = 'app/ReferralPage/SEND_REFERRAL_REQUEST';
export const SEND_REFERRAL_SUCCESS = 'app/ReferralPage/SEND_REFERRAL_SUCCESS';
export const SEND_REFERRAL_ERROR = 'app/ReferralPage/SEND_REFERRAL_ERROR';

export const SEND_REMINDER_REQUEST = 'app/ReferralPage/SEND_REMINDER_REQUEST';
export const SEND_REMINDER_SUCCESS = 'app/ReferralPage/SEND_REMINDER_SUCCESS';
export const SEND_REMINDER_ERROR = 'app/ReferralPage/SEND_REMINDER_ERROR';

// ================ Reducer ================ //

const initialState = {
  generateReferralCodeInProgress: false,
  generateReferralCodeError: null,
  sendReferralInProgress: false,
  sendReferralError: null,
  referralSent: false,
  sendReminderInProgress: false,
  sendReminderError: null,
  reminderSent: false,
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

    case SEND_REFERRAL_REQUEST:
      return {
        ...state,
        sendReferralInProgress: true,
        sendReferralError: null,
        referralSent: false,
      };
    case SEND_REFERRAL_SUCCESS:
      return {
        ...state,
        sendReferralInProgress: false,
        referralSent: true,
      };
    case SEND_REFERRAL_ERROR:
      return {
        ...state,
        sendReferralInProgress: false,
        sendReferralError: payload,
      };

    case SEND_REMINDER_REQUEST:
      return {
        ...state,
        sendReminderInProgress: payload,
        sendReminderError: null,
        reminderSent: false,
      };
    case SEND_REMINDER_SUCCESS:
      return {
        ...state,
        sendReminderInProgress: false,
        reminderSent: payload,
      };
    case SEND_REMINDER_ERROR:
      return {
        ...state,
        sendReminderInProgress: false,
        sendReminderError: payload,
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

export const sendReferralRequest = () => ({ type: SEND_REFERRAL_REQUEST });
export const sendReferralSuccess = () => ({ type: SEND_REFERRAL_SUCCESS });
export const sendReferralError = error => ({
  type: SEND_REFERRAL_ERROR,
  payload: error,
  error: true,
});

export const sendReminderRequest = email => ({ type: SEND_REMINDER_REQUEST, payload: email });
export const sendReminderSuccess = email => ({ type: SEND_REMINDER_SUCCESS, payload: email });
export const sendReminderError = error => ({
  type: SEND_REMINDER_ERROR,
  payload: error,
  error: true,
});

// ================ Thunk ================ //

export const generateReferralCode = () => async (dispatch, getState, sdk) => {
  dispatch(generateReferralCodeRequest());

  const referralCode = Math.floor(Math.random() * 1000000000000);
  const { currentUser } = getState().user;
  const userId = currentUser.id.uuid;

  try {
    await updateUser({ userId, metadata: { referralCode } });

    dispatch(fetchCurrentUser());
    dispatch(generateReferralCodeSuccess());
  } catch (e) {
    dispatch(generateReferralCodeError(storableError(e)));
    log.error(e, 'generate-referral-code-failed', {
      referralCode,
    });
  }
};

export const sendReferral = email => async (dispatch, getState, sdk) => {
  dispatch(sendReferralRequest());

  const { currentUser } = getState().user;
  const userId = currentUser.id.uuid;
  const senderName = currentUser.attributes.profile.firstName;
  const { referrals = [], referralCode } = currentUser.attributes.profile.metadata;

  try {
    await sendgridReferralEmail({ email, referralCode, senderName });

    const newReferral = {
      id: uuidv4(),
      email,
      claimed: false,
      createdAt: Date.now(),
    };

    await updateUser({ userId, metadata: { referrals: [...referrals, newReferral] } });

    dispatch(fetchCurrentUser());
    dispatch(sendReferralSuccess());
  } catch (e) {
    dispatch(sendReferralError(storableError(e)));
    log.error(e, 'send-referral-failed', {
      email,
      referralCode,
    });
  }
};

export const sendReminder = referral => async (dispatch, getState, sdk) => {
  const email = referral.email;

  dispatch(sendReminderRequest(email));

  const { currentUser } = getState().user;
  const senderName = currentUser.attributes.profile.firstName;
  const { referralCode, referrals: oldReferrals } = currentUser.attributes.profile.metadata;

  // TODO: Update user referrals
  try {
    await sendgridReferralEmail({ email, referralCode, senderName });

    const newReferrals = oldReferrals.map(r => {
      if (r.email === email) {
        return {
          ...r,
          lastReminder: Date.now(),
        };
      }
      return r;
    });

    await updateUser({ userId: currentUser.id.uuid, metadata: { referrals: newReferrals } });

    dispatch(fetchCurrentUser());
    dispatch(sendReminderSuccess(email));
  } catch (e) {
    dispatch(sendReminderError(storableError(e)));
    log.error(e, 'send-reminder-failed', {
      email,
      referralCode,
    });
  }
};
