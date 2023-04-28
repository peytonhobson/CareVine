import { storableError } from '../util/errors';
import * as log from '../util/log';
import {
  stripeCreatePaymentIntent,
  stripeCreateSubscription,
  stripeUpdateCustomer,
  stripeCancelSubscription,
  stripeUpdateSubscription,
  stripeConfirmPayment,
  stripeCreateSubscriptionSchedule,
  stripeCancelSubscriptionSchedule,
  stripeUpdatePaymentIntent,
  stripeDetachPaymentMethod,
} from '../util/api';
import { createStripeCustomer } from './paymentMethods.duck';
import { fetchCurrentUser } from './user.duck';

// https://stripe.com/docs/api/payment_intents/object#payment_intent_object-status
const STRIPE_PI_HAS_PASSED_CONFIRM = ['processing', 'requires_capture', 'canceled', 'succeeded'];

// ================ Action types ================ //

export const SET_INITIAL_VALUES = 'app/stripe/SET_INITIAL_VALUES';

export const STRIPE_ACCOUNT_CLEAR_ERROR = 'app/stripe/STRIPE_ACCOUNT_CLEAR_ERROR';

export const ACCOUNT_OPENER_CREATE_REQUEST = 'app/stripe/ACCOUNT_OPENER_CREATE_REQUEST';
export const ACCOUNT_OPENER_CREATE_SUCCESS = 'app/stripe/ACCOUNT_OPENER_CREATE_SUCCESS';
export const ACCOUNT_OPENER_CREATE_ERROR = 'app/stripe/ACCOUNT_OPENER_CREATE_ERROR';

export const PERSON_CREATE_REQUEST = 'app/stripe/PERSON_CREATE_REQUEST';
export const PERSON_CREATE_SUCCESS = 'app/stripe/PERSON_CREATE_SUCCESS';
export const PERSON_CREATE_ERROR = 'app/stripe/PERSON_CREATE_ERROR';

export const CLEAR_PAYMENT_TOKEN = 'app/stripe/CLEAR_PAYMENT_TOKEN';

export const HANDLE_CARD_PAYMENT_REQUEST = 'app/stripe/HANDLE_CARD_PAYMENT_REQUEST';
export const HANDLE_CARD_PAYMENT_SUCCESS = 'app/stripe/HANDLE_CARD_PAYMENT_SUCCESS';
export const HANDLE_CARD_PAYMENT_ERROR = 'app/stripe/HANDLE_CARD_PAYMENT_ERROR';

export const HANDLE_CARD_SETUP_REQUEST = 'app/stripe/HANDLE_CARD_SETUP_REQUEST';
export const HANDLE_CARD_SETUP_SUCCESS = 'app/stripe/HANDLE_CARD_SETUP_SUCCESS';
export const HANDLE_CARD_SETUP_ERROR = 'app/stripe/HANDLE_CARD_SETUP_ERROR';

export const HANDLE_PAYMENT_REQUEST = 'app/stripe/HANDLE_PAYMENT_REQUEST';
export const HANDLE_PAYMENT_SUCCESS = 'app/stripe/HANDLE_PAYMENT_SUCCESS';
export const HANDLE_PAYMENT_ERROR = 'app/stripe/HANDLE_PAYMENT_ERROR';

export const CLEAR_HANDLE_CARD_PAYMENT = 'app/stripe/CLEAR_HANDLE_CARD_PAYMENT';

export const RETRIEVE_PAYMENT_INTENT_REQUEST = 'app/stripe/RETRIEVE_PAYMENT_INTENT_REQUEST';
export const RETRIEVE_PAYMENT_INTENT_SUCCESS = 'app/stripe/RETRIEVE_PAYMENT_INTENT_SUCCESS';
export const RETRIEVE_PAYMENT_INTENT_ERROR = 'app/stripe/RETRIEVE_PAYMENT_INTENT_ERROR';

export const CREATE_PAYMENT_REQUEST = 'app/stripe/CREATE_PAYMENT_REQUEST';
export const CREATE_PAYMENT_SUCCESS = 'app/stripe/CREATE_PAYMENT_SUCCESS';
export const CREATE_PAYMENT_ERROR = 'app/stripe/CREATE_PAYMENT_ERROR';

export const CREATE_PAYMENT_INTENT_REQUEST = 'app/stripe/CREATE_PAYMENT_INTENT_REQUEST';
export const CREATE_PAYMENT_INTENT_SUCCESS = 'app/stripe/CREATE_PAYMENT_INTENT_SUCCESS';
export const CREATE_PAYMENT_INTENT_ERROR = 'app/stripe/CREATE_PAYMENT_INTENT_ERROR';

export const CREATE_SUBSCRIPTION_REQUEST = 'app/stripe/CREATE_SUBSCRIPTION_REQUEST';
export const CREATE_SUBSCRIPTION_SUCCESS = 'app/stripe/CREATE_SUBSCRIPTION_SUCCESS';
export const CREATE_SUBSCRIPTION_ERROR = 'app/stripe/CREATE_SUBSCRIPTION_ERROR';

export const CANCEL_SUBSCRIPTION_REQUEST = 'app/stripe/CANCEL_SUBSCRIPTION_REQUEST';
export const CANCEL_SUBSCRIPTION_SUCCESS = 'app/stripe/CANCEL_SUBSCRIPTION_SUCCESS';
export const CANCEL_SUBSCRIPTION_ERROR = 'app/stripe/CANCEL_SUBSCRIPTION_ERROR';

export const UPDATE_SUBSCRIPTION_REQUEST = 'app/stripe/UPDATE_SUBSCRIPTION_REQUEST';
export const UPDATE_SUBSCRIPTION_SUCCESS = 'app/stripe/UPDATE_SUBSCRIPTION_SUCCESS';
export const UPDATE_SUBSCRIPTION_ERROR = 'app/stripe/UPDATE_SUBSCRIPTION_ERROR';

export const UPDATE_CUSTOMER_CREDIT_BALANCE_REQUEST =
  'app/stripe/UPDATE_CUSTOMER_CREDIT_BALANCE_REQUEST';
export const UPDATE_CUSTOMER_CREDIT_BALANCE_SUCCESS =
  'app/stripe/UPDATE_CUSTOMER_CREDIT_BALANCE_SUCCESS';
export const UPDATE_CUSTOMER_CREDIT_BALANCE_ERROR =
  'app/stripe/UPDATE_CUSTOMER_CREDIT_BALANCE_ERROR';

// ================ Reducer ================ //

export const initialState = {
  confirmCardPaymentInProgress: false,
  confirmCardPaymentError: null,
  confirmCardPaymentSuccess: false,
  confirmPaymentInProgress: false,
  confirmPaymentSuccess: false,
  confirmPaymentError: null,
  handleCardSetupInProgress: false,
  handleCardSetupError: null,
  paymentIntent: null,
  setupIntent: null,
  retrievePaymentIntentInProgress: false,
  retrievePaymentIntentError: null,
  createPaymentInProgress: false,
  createPaymentError: null,
  createPaymentSuccess: false,
  createPaymentIntentError: null,
  createPaymentIntentInProgress: false,
  createSubscriptionInProgress: false,
  createSubscriptionError: null,
  subscription: null,
  cancelSubscriptionInProgress: false,
  cancelSubscriptionError: null,
  updateSubscriptionInProgress: false,
  updateSubscriptionError: null,
  updateCustomerCreditBalanceInProgress: false,
  updateCustomerCreditBalanceError: null,
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case SET_INITIAL_VALUES:
      return { ...initialState, ...payload };

    case STRIPE_ACCOUNT_CLEAR_ERROR:
      return { ...initialState };

    case ACCOUNT_OPENER_CREATE_REQUEST:
      return {
        ...state,
        createAccountOpenerError: null,
        createAccountOpenerInProgress: true,
      };
    case ACCOUNT_OPENER_CREATE_SUCCESS:
      return { ...state, createAccountOpenerInProgress: false, personAccountOpener: payload };
    case ACCOUNT_OPENER_CREATE_ERROR:
      console.error(payload);
      return { ...state, createAccountOpenerError: payload, createAccountOpenerInProgress: false };

    case PERSON_CREATE_REQUEST:
      return {
        ...state,
        persons: [
          ...state.persons,
          {
            ...payload,
            createStripePersonError: null,
            createStripePersonInProgress: true,
          },
        ],
      };
    case PERSON_CREATE_SUCCESS:
      return {
        ...state,
        persons: state.persons.map(p => {
          return p.personToken === payload.personToken
            ? { ...payload, createStripePersonInProgress: false }
            : p;
        }),
      };
    case PERSON_CREATE_ERROR:
      console.error(payload);
      return {
        ...state,
        persons: state.persons.map(p => {
          return p.personToken === payload.personToken
            ? { ...p, createStripePersonInProgress: false, createStripePersonError: payload.error }
            : p;
        }),
      };

    case HANDLE_CARD_PAYMENT_REQUEST:
      return {
        ...state,
        confirmCardPaymentError: null,
        confirmCardPaymentInProgress: true,
        confirmCardPaymentSuccess: false,
      };
    case HANDLE_CARD_PAYMENT_SUCCESS:
      return {
        ...state,
        paymentIntent: payload,
        confirmCardPaymentInProgress: false,
        confirmCardPaymentSuccess: true,
      };
    case HANDLE_CARD_PAYMENT_ERROR:
      console.error(payload);
      return { ...state, confirmCardPaymentError: payload, confirmCardPaymentInProgress: false };

    case HANDLE_CARD_SETUP_REQUEST:
      return {
        ...state,
        handleCardSetupError: null,
        handleCardSetupInProgress: true,
      };
    case HANDLE_CARD_SETUP_SUCCESS:
      return { ...state, setupIntent: payload, handleCardSetupInProgress: false };
    case HANDLE_CARD_SETUP_ERROR:
      console.error(payload);
      return { ...state, handleCardSetupError: payload, handleCardSetupInProgress: false };

    case CLEAR_HANDLE_CARD_PAYMENT:
      return {
        ...state,
        confirmCardPaymentInProgress: false,
        confirmCardPaymentError: null,
        paymentIntent: null,
      };

    case HANDLE_PAYMENT_REQUEST:
      return {
        ...state,
        confirmPaymentError: null,
        confirmPaymentInProgress: true,
        confirmPaymentSuccess: false,
      };
    case HANDLE_PAYMENT_SUCCESS:
      return {
        ...state,
        paymentIntent: payload,
        confirmPaymentInProgress: false,
        confirmPaymentSuccess: true,
      };
    case HANDLE_PAYMENT_ERROR:
      console.error(payload);
      return { ...state, confirmPaymentError: payload, confirmPaymentInProgress: false };

    case RETRIEVE_PAYMENT_INTENT_REQUEST:
      return {
        ...state,
        retrievePaymentIntentError: null,
        retrievePaymentIntentInProgress: true,
      };
    case RETRIEVE_PAYMENT_INTENT_SUCCESS:
      return { ...state, paymentIntent: payload, retrievePaymentIntentInProgress: false };
    case RETRIEVE_PAYMENT_INTENT_ERROR:
      console.error(payload);
      return {
        ...state,
        retrievePaymentIntentError: payload,
        retrievePaymentIntentInProgress: false,
      };

    case CREATE_PAYMENT_REQUEST:
      return {
        ...state,
        createPaymentError: null,
        createPaymentInProgress: true,
        createPaymentSuccess: false,
      };
    case CREATE_PAYMENT_SUCCESS:
      return { ...state, createPaymentInProgress: false, createPaymentSuccess: true };
    case CREATE_PAYMENT_ERROR:
      return {
        ...state,
        createPaymentError: payload,
        createPaymentInProgress: false,
      };

    case CREATE_PAYMENT_INTENT_REQUEST:
      return {
        ...state,
        createPaymentIntentError: null,
        createPaymentIntentInProgress: true,
      };
    case CREATE_PAYMENT_INTENT_SUCCESS:
      return { ...state, createPaymentIntentInProgress: false, paymentIntent: payload };
    case CREATE_PAYMENT_INTENT_ERROR:
      return {
        ...state,
        createPaymentIntentError: payload,
        createPaymentIntentInProgress: false,
      };

    case CREATE_SUBSCRIPTION_REQUEST:
      return {
        ...state,
        createSubscriptionError: null,
        createSubscriptionInProgress: true,
      };
    case CREATE_SUBSCRIPTION_SUCCESS:
      return { ...state, createSubscriptionInProgress: false, subscription: payload };
    case CREATE_SUBSCRIPTION_ERROR:
      return {
        ...state,
        createSubscriptionError: payload,
        createSubscriptionInProgress: false,
      };

    case CANCEL_SUBSCRIPTION_REQUEST:
      return {
        ...state,
        cancelSubscriptionError: null,
        cancelSubscriptionInProgress: true,
      };
    case CANCEL_SUBSCRIPTION_SUCCESS:
      return { ...state, cancelSubscriptionInProgress: false };
    case CANCEL_SUBSCRIPTION_ERROR:
      return {
        ...state,
        cancelSubscriptionError: payload,
        cancelSubscriptionInProgress: false,
      };

    case UPDATE_SUBSCRIPTION_REQUEST:
      return {
        ...state,
        updateSubscriptionError: null,
        updateSubscriptionInProgress: true,
      };
    case UPDATE_SUBSCRIPTION_SUCCESS:
      return { ...state, updateSubscriptionInProgress: false, subscription: payload };
    case UPDATE_SUBSCRIPTION_ERROR:
      return {
        ...state,
        updateSubscriptionError: payload,
        updateSubscriptionInProgress: false,
      };

    case UPDATE_CUSTOMER_CREDIT_BALANCE_REQUEST:
      return {
        ...state,
        updateCustomerCreditBalanceError: null,
        updateCustomerCreditBalanceInProgress: true,
      };
    case UPDATE_CUSTOMER_CREDIT_BALANCE_SUCCESS:
      return { ...state, updateCustomerCreditBalanceInProgress: false, customer: payload };
    case UPDATE_CUSTOMER_CREDIT_BALANCE_ERROR:
      return {
        ...state,
        updateCustomerCreditBalanceError: payload,
        updateCustomerCreditBalanceInProgress: false,
      };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const setInitialValues = initialValues => ({
  type: SET_INITIAL_VALUES,
  payload: initialValues,
});

export const stripeAccountClearError = () => ({
  type: STRIPE_ACCOUNT_CLEAR_ERROR,
});

export const confirmCardPaymentRequest = () => ({
  type: HANDLE_CARD_PAYMENT_REQUEST,
});

export const confirmCardPaymentSuccess = payload => ({
  type: HANDLE_CARD_PAYMENT_SUCCESS,
  payload,
});

export const confirmCardPaymentError = payload => ({
  type: HANDLE_CARD_PAYMENT_ERROR,
  payload,
  error: true,
});

export const handleCardSetupRequest = () => ({
  type: HANDLE_CARD_SETUP_REQUEST,
});

export const handleCardSetupSuccess = payload => ({
  type: HANDLE_CARD_SETUP_SUCCESS,
  payload,
});

export const handleCardSetupError = payload => ({
  type: HANDLE_CARD_SETUP_ERROR,
  payload,
  error: true,
});

export const confirmPaymentRequest = () => ({
  type: HANDLE_PAYMENT_REQUEST,
});
export const confirmPaymentSuccess = payload => ({
  type: HANDLE_PAYMENT_SUCCESS,
  payload,
});
export const confirmPaymentError = payload => ({
  type: HANDLE_PAYMENT_ERROR,
  payload,
  error: true,
});

export const initializeCardPaymentData = () => ({
  type: CLEAR_HANDLE_CARD_PAYMENT,
});

export const retrievePaymentIntentRequest = () => ({
  type: RETRIEVE_PAYMENT_INTENT_REQUEST,
});

export const retrievePaymentIntentSuccess = payload => ({
  type: RETRIEVE_PAYMENT_INTENT_SUCCESS,
  payload,
});

export const retrievePaymentIntentError = payload => ({
  type: RETRIEVE_PAYMENT_INTENT_ERROR,
  payload,
  error: true,
});

export const createPaymentRequest = () => ({
  type: CREATE_PAYMENT_REQUEST,
});
export const createPaymentSuccess = payload => ({
  type: CREATE_PAYMENT_SUCCESS,
  payload,
});
export const createPaymentError = payload => ({
  type: CREATE_PAYMENT_ERROR,
  payload,
  error: true,
});

export const createPaymentIntentRequest = () => ({
  type: CREATE_PAYMENT_INTENT_REQUEST,
});
export const createPaymentIntentSuccess = payload => ({
  type: CREATE_PAYMENT_INTENT_SUCCESS,
  payload,
});
export const createPaymentIntentError = payload => ({
  type: CREATE_PAYMENT_INTENT_ERROR,
  payload,
  error: true,
});

export const createSubscriptionRequest = () => ({
  type: CREATE_SUBSCRIPTION_REQUEST,
});
export const createSubscriptionSuccess = payload => ({
  type: CREATE_SUBSCRIPTION_SUCCESS,
  payload,
});
export const createSubscriptionError = payload => ({
  type: CREATE_SUBSCRIPTION_ERROR,
  payload,
  error: true,
});

export const cancelSubscriptionRequest = () => ({
  type: CANCEL_SUBSCRIPTION_REQUEST,
});
export const cancelSubscriptionSuccess = () => ({
  type: CANCEL_SUBSCRIPTION_SUCCESS,
});
export const cancelSubscriptionError = payload => ({
  type: CANCEL_SUBSCRIPTION_ERROR,
  payload,
  error: true,
});

export const updateSubscriptionRequest = () => ({
  type: UPDATE_SUBSCRIPTION_REQUEST,
});
export const updateSubscriptionSuccess = payload => ({
  type: UPDATE_SUBSCRIPTION_SUCCESS,
  payload,
});
export const updateSubscriptionError = payload => ({
  type: UPDATE_SUBSCRIPTION_ERROR,
  payload,
  error: true,
});

export const updateCustomerCreditBalanceRequest = () => ({
  type: UPDATE_CUSTOMER_CREDIT_BALANCE_REQUEST,
});
export const updateCustomerCreditBalanceSuccess = () => ({
  type: UPDATE_CUSTOMER_CREDIT_BALANCE_SUCCESS,
});
export const updateCustomerCreditBalanceError = payload => ({
  type: UPDATE_CUSTOMER_CREDIT_BALANCE_ERROR,
  payload,
  error: true,
});

// ================ Thunks ================ //

export const retrievePaymentIntent = params => dispatch => {
  const { stripe, stripePaymentIntentClientSecret } = params;
  dispatch(retrievePaymentIntentRequest());

  return stripe
    .retrievePaymentIntent(stripePaymentIntentClientSecret)
    .then(response => {
      if (response.error) {
        return Promise.reject(response);
      } else {
        dispatch(retrievePaymentIntentSuccess(response.paymentIntent));
        return response;
      }
    })
    .catch(err => {
      // Unwrap Stripe error.
      const e = err.error || storableError(err);
      dispatch(retrievePaymentIntentError(e));

      // Log error
      const { code, doc_url, message, payment_intent } = err.error || {};
      const loggableError = err.error
        ? {
            code,
            message,
            doc_url,
            paymentIntentStatus: payment_intent
              ? payment_intent.status
              : 'no payment_intent included',
          }
        : e;
      log.error(loggableError, 'stripe-retrieve-payment-intent-failed', {
        stripeMessage: loggableError.message,
      });
      throw err;
    });
};

export const confirmCardPayment = params => dispatch => {
  // It's required to use the same instance of Stripe as where the card has been created
  // so that's why Stripe needs to be passed here and we can't create a new instance.
  const { stripe, paymentParams, paymentIntent } = params;

  dispatch(confirmCardPaymentRequest());

  const clientSecret = paymentIntent.client_secret;

  const paymentParamsMaybe = paymentParams || {};

  const doConfirmCardPayment = () =>
    stripe
      .confirmCardPayment(clientSecret, {
        ...paymentParamsMaybe,
      })
      .then(response => {
        if (response.error) {
          return Promise.reject(response);
        } else {
          dispatch(confirmCardPaymentSuccess(response));
          return response;
        }
      });

  if (STRIPE_PI_HAS_PASSED_CONFIRM.includes(paymentIntent?.status)) {
    // Payment Intent has been confirmed already, move forward.
    dispatch(confirmCardPaymentSuccess(response));
    return response;
  } else {
    // If payment intent has not been confirmed yet, confirm it.
    return doConfirmCardPayment().catch(err => {
      // Unwrap Stripe error.
      const e = err.error || storableError(err);
      dispatch(confirmCardPaymentError(e));

      // Log error
      const containsPaymentIntent = err.error && err.error.payment_intent;
      const { code, doc_url, message, payment_intent } = containsPaymentIntent ? err.error : {};
      const loggableError = containsPaymentIntent
        ? {
            code,
            message,
            doc_url,
            paymentIntentStatus: payment_intent.status,
          }
        : e;
      log.error(loggableError, 'stripe-handle-card-payment-failed', {
        stripeMessage: loggableError.message,
      });
      throw e;
    });
  }
};

export const confirmPayment = params => dispatch => {
  const { stripe, paymentParams, paymentIntent } = params;

  dispatch(confirmPaymentRequest());

  const paymentParamsMaybe = paymentParams || {};

  const clientSecret = paymentIntent.client_secret;

  const doConfirmPayment = () =>
    stripe
      .confirmUsBankAccountPayment(clientSecret, {
        ...paymentParamsMaybe,
      })
      .then(response => {
        if (response.error) {
          return Promise.reject(response);
        } else {
          dispatch(confirmPaymentSuccess(response));
          return response;
        }
      });

  if (STRIPE_PI_HAS_PASSED_CONFIRM.includes(paymentIntent?.status)) {
    // Payment Intent has been confirmed already, move forward.
    dispatch(confirmCardPaymentSuccess(response));
    return response;
  } else {
    // If payment intent has not been confirmed yet, confirm it.
    return doConfirmPayment().catch(err => {
      // Unwrap Stripe error.
      const e = err.error || storableError(err);
      dispatch(confirmPaymentError(e));

      // Log error
      const containsPaymentIntent = err.error && err.error.payment_intent;
      const { code, doc_url, message, payment_intent } = containsPaymentIntent ? err.error : {};
      const loggableError = containsPaymentIntent
        ? {
            code,
            message,
            doc_url,
            paymentIntentStatus: payment_intent.status,
          }
        : e;
      log.error(loggableError, 'stripe-handle-payment-failed', {
        stripeMessage: loggableError.message,
      });
      throw e;
    });
  }
};

export const handleCardSetup = params => dispatch => {
  // It's required to use the same instance of Stripe as where the card has been created
  // so that's why Stripe needs to be passed here and we can't create a new instance.
  const { stripe, card, setupIntentClientSecret, paymentParams } = params;

  dispatch(handleCardSetupRequest());

  return stripe
    .handleCardSetup(setupIntentClientSecret, card, paymentParams)
    .then(response => {
      if (response.error) {
        return Promise.reject(response);
      } else {
        dispatch(handleCardSetupSuccess(response));
        return response;
      }
    })
    .catch(err => {
      // Unwrap Stripe error.
      const e = err.error || storableError(err);
      dispatch(handleCardSetupError(e));

      // Log error
      const containsSetupIntent = err.error && err.error.setup_intent;
      const { code, doc_url, message, setup_intent } = containsSetupIntent ? err.error : {};
      const loggableError = containsSetupIntent
        ? {
            code,
            message,
            doc_url,
            paymentIntentStatus: setup_intent.status,
          }
        : e;
      log.error(loggableError, 'stripe-handle-card-setup-failed', {
        stripeMessage: loggableError.message,
      });
      throw e;
    });
};

export const createPayment = params => (dispatch, getState, sdk) => {
  const { stripe, elements, userId, saveMethodAsDefault, paymentIntent, defaultMethodId } = params;

  dispatch(createPaymentRequest());

  const handleSuccess = response => {
    dispatch(createPaymentSuccess(response));
    return response;
  };

  const handleError = e => {
    dispatch(createPaymentError(e));
    log.error(e, 'Create-Payment-Failed', {});
    throw e;
  };

  const confirmParams = {
    elements,
    confirmParams: {
      // Make sure to change this to inbox page constant
      return_url: process.env.REACT_APP_CANONICAL_ROOT_URL + '/inbox',
      payment_method_data: {
        billing_details: {
          address: {
            country: 'US',
          },
        },
      },
    },
    metadata: {
      userId,
    },
    redirect: 'if_required',
  };

  if (saveMethodAsDefault) {
    let stripeCustomerId = null;
    // If user is saving card as default

    const paymentIntentId = paymentIntent.id;

    return stripeUpdatePaymentIntent({
      paymentIntentId,
      update: { setup_future_usage: 'off_session' },
    })
      .then(res => {
        stripeCustomerId = res?.customer;
        return stripe.confirmPayment(confirmParams);
      })
      .then(res => {
        const paymentMethodId = res?.paymentIntent?.payment_method;
        return stripeUpdateCustomer({
          stripeCustomerId,
          params: {
            invoice_settings: {
              default_payment_method: paymentMethodId,
            },
          },
        });
      })
      .then(res => {
        if (res.error) {
          throw res.error;
        }

        if (defaultMethodId) {
          // May want to confirm payment after this confirms, otherwise throw error
          stripeDetachPaymentMethod({ paymentMethodId: defaultMethodId });
        }

        handleSuccess(res);
      })
      .catch(handleError);
  } else {
    return stripe
      .confirmPayment(confirmParams)
      .then(res => {
        if (res.error) {
          throw res.error;
        }

        handleSuccess(res);
      })
      .catch(handleError);
  }
};

export const createPaymentIntent = (amount, userId, sender, isCard, caregiverName, metadata) => (
  dispatch,
  getState,
  sdk
) => {
  dispatch(createPaymentIntentRequest());

  const handleSuccess = response => {
    dispatch(createPaymentIntentSuccess(response));
    return response;
  };

  const handleError = e => {
    dispatch(createPaymentIntentError(e));
    log.error(e, 'create-payment-intent-Failed', {});
    throw e;
  };

  const stripeCustomerId = sender.stripeCustomer?.attributes.stripeCustomerId;

  if (stripeCustomerId) {
    return stripeCreatePaymentIntent({
      amount,
      userId,
      stripeCustomerId,
      isCard,
      description: `Payment to ${caregiverName}`,
      sender,
      metadata,
    })
      .then(res => handleSuccess(res))
      .catch(e => handleError(e));
  } else {
    return dispatch(createStripeCustomer())
      .then(res => {
        return stripeCreatePaymentIntent({
          amount,
          userId,
          stripeCustomerId: res.id,
          isCard,
          description: `Payment to ${caregiverName}`,
          sender,
          metadata,
        });
      })
      .then(res => {
        dispatch(fetchCurrentUser());
        handleSuccess(res);
      })
      .catch(e => handleError(e));
  }
};

export const createSubscription = (stripeCustomerId, priceId, userId, params) => (
  dispatch,
  getState,
  sdk
) => {
  dispatch(createSubscriptionRequest());

  const handleSuccess = response => {
    dispatch(createSubscriptionSuccess(response));
    return response;
  };

  const handleError = e => {
    dispatch(createSubscriptionError(e));
    log.error(e, 'create-subscription-Failed', {});
    throw e;
  };

  if (stripeCustomerId) {
    return stripeCreateSubscription({ stripeCustomerId, priceId, userId, params })
      .then(res => {
        if (params?.default_payment_method && !params?.trial_end) {
          return stripeConfirmPayment({
            paymentId: res.latest_invoice.payment_intent.id,
            paymentMethod: params.default_payment_method,
          });
        } else {
          return res;
        }
      })
      .then(res => handleSuccess(res))
      .catch(e => handleError(e));
  } else {
    return dispatch(createStripeCustomer())
      .then(res => {
        return stripeCreateSubscription({
          stripeCustomerId: res.id,
          priceId,
          userId,
          params,
        });
      })
      .then(res => {
        if (params && params.default_payment_method) {
          return stripeConfirmPayment({
            paymentId: res.latest_invoice.payment_intent.id,
            paymentMethod: params.default_payment_method,
          });
        } else {
          return res;
        }
      })
      .then(res => handleSuccess(res))
      .catch(e => handleError(e));
  }
};

export const createFutureSubscription = (stripeCustomerId, startDate, priceId, userId) => (
  dispatch,
  getState,
  sdk
) => {
  dispatch(createSubscriptionRequest());

  const handleSuccess = response => {
    dispatch(createSubscriptionSuccess(response));
    return response;
  };

  const handleError = e => {
    dispatch(createSubscriptionError(e));
    log.error(e, 'create-future-subscription-Failed', {});
    throw e;
  };

  return stripeCreateSubscriptionSchedule({ stripeCustomerId, startDate, priceId, userId })
    .then(res => handleSuccess(res))
    .catch(e => handleError(e));
};

export const cancelFutureSubscription = scheduleId => (dispatch, getState, sdk) => {
  dispatch(cancelSubscriptionRequest());

  const handleSuccess = response => {
    dispatch(cancelSubscriptionSuccess(response));
    return response;
  };

  const handleError = e => {
    dispatch(cancelSubscriptionError(e));
    log.error(e, 'cancel-future-subscription-Failed', {});
    throw e;
  };

  return stripeCancelSubscriptionSchedule({ scheduleId })
    .then(res => handleSuccess(res))
    .catch(e => handleError(e));
};

export const cancelSubscription = subscriptionId => (dispatch, getState, sdk) => {
  dispatch(cancelSubscriptionRequest());

  const handleSuccess = response => {
    dispatch(cancelSubscriptionSuccess(response));
    return response;
  };

  const handleError = e => {
    dispatch(cancelSubscriptionError(e));
    log.error(e, 'cancel-subscription-Failed', {});
    throw e;
  };

  return stripeCancelSubscription({ subscriptionId })
    .then(res => handleSuccess(res))
    .catch(e => handleError(e));
};

export const updateSubscription = (subscriptionId, params) => (dispatch, getState, sdk) => {
  dispatch(updateSubscriptionRequest());

  const handleSuccess = response => {
    dispatch(updateSubscriptionSuccess(response));
    return response;
  };

  const handleError = e => {
    dispatch(updateSubscriptionError(e));
    log.error(e, 'cancel-subscription-Failed', {});
    throw e;
  };

  return stripeUpdateSubscription({ subscriptionId, params })
    .then(res => handleSuccess(res))
    .catch(e => handleError(e));
};

export const updateCustomerCreditBalance = (stripeCustomerId, amount) => (
  dispatch,
  getState,
  sdk
) => {
  dispatch(updateCustomerCreditBalanceRequest());

  const handleSuccess = response => {
    dispatch(updateCustomerCreditBalanceSuccess(response));
    return response;
  };

  const handleError = e => {
    dispatch(updateCustomerCreditBalanceError(e));
    log.error(e, 'update-customer-credit-balance-Failed', {});
    throw e;
  };

  return stripeUpdateCustomerCreditBalance({ stripeCustomerId, amount })
    .then(res => handleSuccess(res))
    .catch(e => handleError(e));
};
