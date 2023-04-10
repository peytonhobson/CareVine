import { fetchHasStripeAccount, updateUserNotifications } from '../../util/api';
import { storableError } from '../../util/errors';
import * as log from '../../util/log';
import { fetchCurrentUser } from '../../ducks/user.duck';
import config from '../../config';
import { NOTIFICATION_TYPE_NOTIFY_FOR_PAYMENT } from '../../util/constants';
import { userDisplayNameAsString } from '../../util/data';
import { v4 as uuidv4 } from 'uuid';
import { TRANSITION_NOTIFY_FOR_PAYMENT } from '../../util/transaction';

// ================ Action types ================ //

export const SET_INITIAL_VALUES = 'app/StripePaymentModal/SET_INITIAL_VALUES';

export const STRIPE_CUSTOMER_REQUEST = 'app/StripePaymentModal/STRIPE_CUSTOMER_REQUEST';
export const STRIPE_CUSTOMER_SUCCESS = 'app/StripePaymentModal/STRIPE_CUSTOMER_SUCCESS';
export const STRIPE_CUSTOMER_ERROR = 'app/StripePaymentModal/STRIPE_CUSTOMER_ERROR';

export const HAS_STRIPE_ACCOUNT_REQUEST = 'app/StripePaymentModal/HAS_STRIPE_ACCOUNT_REQUEST';
export const HAS_STRIPE_ACCOUNT_SUCCESS = 'app/StripePaymentModal/HAS_STRIPE_ACCOUNT_SUCCESS';
export const HAS_STRIPE_ACCOUNT_ERROR = 'app/StripePaymentModal/HAS_STRIPE_ACCOUNT_ERROR';

export const SEND_NOTIFY_FOR_PAYMENT_REQUEST =
  'app/StripePaymentModal/SEND_NOTIFY_FOR_PAYMENT_REQUEST';
export const SEND_NOTIFY_FOR_PAYMENT_SUCCESS =
  'app/StripePaymentModal/SEND_NOTIFY_FOR_PAYMENT_SUCCESS';
export const SEND_NOTIFY_FOR_PAYMENT_ERROR = 'app/StripePaymentModal/SEND_NOTIFY_FOR_PAYMENT_ERROR';

// ================ Reducer ================ //

export const initialState = {
  hasStripeAccount: false,
  hasStripeAccountError: null,
  hasStripeAccountFetched: false,
  hasStripeAccountInProgress: false,
  paymentIntent: null,
  sendNotifyForPaymentError: null,
  sendNotifyForPaymentInProgress: false,
  sendNotifyForPaymentSuccess: false,
  stripeCustomerFetched: false,
};

export default function StripePaymentModalReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case SET_INITIAL_VALUES:
      return { ...initialState, ...payload };

    case STRIPE_CUSTOMER_REQUEST:
      return { ...state, stripeCustomerFetched: false };
    case STRIPE_CUSTOMER_SUCCESS:
      return { ...state, stripeCustomerFetched: true };
    case STRIPE_CUSTOMER_ERROR:
      return { ...state, stripeCustomerFetchError: payload };

    case HAS_STRIPE_ACCOUNT_REQUEST:
      return { ...state, hasStripeAccountInProgress: true };
    case HAS_STRIPE_ACCOUNT_SUCCESS:
      return {
        ...state,
        hasStripeAccountInProgress: false,
        hasStripeAccountFetched: true,
        hasStripeAccount: payload,
      };
    case HAS_STRIPE_ACCOUNT_ERROR:
      return { ...state, hasStripeAccountInProgress: false, hasStripeAccountError: payload };

    case SEND_NOTIFY_FOR_PAYMENT_REQUEST:
      return {
        ...state,
        sendNotifyForPaymentInProgress: true,
        sendNotifyForPaymentError: null,
      };
    case SEND_NOTIFY_FOR_PAYMENT_SUCCESS:
      return {
        ...state,
        sendNotifyForPaymentInProgress: false,
        sendNotifyForPaymentSuccess: true,
      };
    case SEND_NOTIFY_FOR_PAYMENT_ERROR:
      return {
        ...state,
        sendNotifyForPaymentInProgress: false,
        sendNotifyForPaymentPaymentError: payload,
      };

    default:
      return state;
  }
}

// ================ Selectors ================ //

export const setInitialValues = initialValues => ({
  type: SET_INITIAL_VALUES,
  payload: initialValues,
});

export const stripeCustomerRequest = () => ({ type: STRIPE_CUSTOMER_REQUEST });
export const stripeCustomerSuccess = () => ({ type: STRIPE_CUSTOMER_SUCCESS });
export const stripeCustomerError = e => ({
  type: STRIPE_CUSTOMER_ERROR,
  error: true,
  payload: e,
});

export const hasStripeAccountRequest = () => ({ type: HAS_STRIPE_ACCOUNT_REQUEST });
export const hasStripeAccountSuccess = hasStripeAccount => ({
  type: HAS_STRIPE_ACCOUNT_SUCCESS,
  payload: hasStripeAccount,
});
export const hasStripeAccountError = e => ({
  type: HAS_STRIPE_ACCOUNT_ERROR,
  error: true,
  payload: e,
});

export const sendNotifyForPaymentRequest = () => ({
  type: SEND_NOTIFY_FOR_PAYMENT_REQUEST,
});
export const sendNotifyForPaymentSuccess = () => ({
  type: SEND_NOTIFY_FOR_PAYMENT_SUCCESS,
});
export const sendNotifyForPaymentError = e => ({
  type: SEND_NOTIFY_FOR_PAYMENT_ERROR,
  error: true,
  payload: e,
});

// ================ Action creators ================ //

export const stripeCustomer = () => (dispatch, getState, sdk) => {
  dispatch(stripeCustomerRequest());

  return dispatch(fetchCurrentUser({ include: ['stripeCustomer.defaultPaymentMethod'] }))
    .then(response => {
      dispatch(stripeCustomerSuccess());
    })
    .catch(e => {
      dispatch(stripeCustomerError(storableError(e)));
    });
};

export const sendNotifyForPayment = (currentUser, otherUser, providerListing) => async (
  dispatch,
  getState,
  sdk
) => {
  dispatch(sendNotifyForPaymentRequest());

  const senderName = userDisplayNameAsString(currentUser);
  const userId = otherUser.id.uuid;
  const newNotification = {
    id: uuidv4(),
    type: NOTIFICATION_TYPE_NOTIFY_FOR_PAYMENT,
    createdAt: new Date().getTime(),
    isRead: false,
    metadata: {
      senderName,
    },
  };

  try {
    const response = await updateUserNotifications({
      userId,
      newNotification,
    });

    dispatch(sendNotifyForPaymentSuccess());
    dispatch(transitionTransaction(providerListing, TRANSITION_NOTIFY_FOR_PAYMENT));
  } catch (e) {
    log.error(e, 'send-notify-for-payment-failed');
    dispatch(sendNotifyForPaymentError(e));
  }
};

export const transitionTransaction = (otherUserListing, transition, params) => (
  dispatch,
  getState,
  sdk
) => {
  const listingId = otherUserListing?.id?.uuid;

  const paramsMaybe = params ? params : {};
  const bodyParams = {
    transition,
    processAlias: config.singleActionProcessAlias,
    params: {
      listingId,
      ...paramsMaybe,
    },
  };
  return sdk.transactions
    .initiate(bodyParams)
    .then(response => {
      return response;
    })
    .catch(e => {
      log.error(e, 'transition-transaction-failed', {});
    });
};

// const sendConfirmPaymentNotification = (
//   currentUserId,
//   providerName,
//   channelUrl,
//   sendbirdContext
// ) => (dispatch, getState, sdk) => {
//   const params = {
//     appId: process.env.REACT_APP_SENDBIRD_APP_ID,
//     modules: [new GroupChannelModule()],
//   };

//   const sb = SendbirdChat.init(params);

//   return sb
//     .connect(currentUserId)
//     .then(() => {
//       sb.groupChannel.getChannel(channelUrl).then(channel => {
//         const messageParams = {
//           customType: 'CONFIRM_PAYMENT',
//           message: `You made a payment to ${providerName}.`,
//           data: `{"providerName": "${providerName}"}`,
//         };

//         channel.sendUserMessage(messageParams).onSucceeded(message => {
//           sendbirdContext.config.pubSub.publish('SEND_USER_MESSAGE', {
//             message,
//             channel,
//           });
//         });
//       });
//     })
//     .catch(e => {
//       log.error(e, 'send-payment-notification-failed', {});
//     });
// };

export const hasStripeAccount = userId => (dispatch, getState, sdk) => {
  dispatch(hasStripeAccountRequest());

  const handleSuccess = response => {
    dispatch(hasStripeAccountSuccess(response.data));
    return response;
  };

  const handleError = e => {
    console.log(e);
    dispatch(hasStripeAccountError(storableError(e)));
    log.error(e, 'fetch-provider-account-failed', {});
    throw e;
  };

  return fetchHasStripeAccount({ userId })
    .then(handleSuccess)
    .catch(handleError);
};
