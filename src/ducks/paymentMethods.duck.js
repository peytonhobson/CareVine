import pick from 'lodash/pick';
import { storableError } from '../util/errors';
import {
  stripeDetachPaymentMethod,
  stripeCreateSetupIntent,
  stripeUpdateCustomer,
} from '../util/api';
import * as log from '../util/log';
import { stripePaymentMethods } from '../util/api';
import { fetchCurrentUser } from './user.duck';
import { stripeCustomer } from './stripe.duck';

// ================ Action types ================ //

export const SET_INITIAL_VALUES = 'app/paymentMethods/SET_INITIAL_VALUES';

export const CREATE_STRIPE_CUSTOMER_REQUEST = 'app/paymentMethods/CREATE_STRIPE_CUSTOMER_REQUEST';
export const CREATE_STRIPE_CUSTOMER_SUCCESS = 'app/paymentMethods/CREATE_STRIPE_CUSTOMER_SUCCESS';
export const CREATE_STRIPE_CUSTOMER_ERROR = 'app/paymentMethods/CREATE_STRIPE_CUSTOMER_ERROR';

export const ADD_PAYMENT_METHOD_REQUEST = 'app/paymentMethods/ADD_PAYMENT_METHOD_REQUEST';
export const ADD_PAYMENT_METHOD_SUCCESS = 'app/paymentMethods/ADD_PAYMENT_METHOD_SUCCESS';
export const ADD_PAYMENT_METHOD_ERROR = 'app/paymentMethods/ADD_PAYMENT_METHOD_ERROR';

export const DELETE_PAYMENT_METHOD_REQUEST = 'app/paymentMethods/DELETE_PAYMENT_METHOD_REQUEST';
export const DELETE_PAYMENT_METHOD_SUCCESS = 'app/paymentMethods/DELETE_PAYMENT_METHOD_SUCCESS';
export const DELETE_PAYMENT_METHOD_ERROR = 'app/paymentMethods/DELETE_PAYMENT_METHOD_ERROR';

export const CREATE_BANK_ACCOUNT_REQUEST = 'app/paymentMethods/CREATE_BANK_ACCOUNT_REQUEST';
export const CREATE_BANK_ACCOUNT_SUCCESS = 'app/paymentMethods/CREATE_BANK_ACCOUNT_SUCCESS';
export const CREATE_BANK_ACCOUNT_ERROR = 'app/paymentMethods/CREATE_BANK_ACCOUNT_ERROR';

export const CREATE_CREDIT_CARD_REQUEST = 'app/paymentMethods/CREATE_CREDIT_CARD_REQUEST';
export const CREATE_CREDIT_CARD_SUCCESS = 'app/paymentMethods/CREATE_CREDIT_CARD_SUCCESS';
export const CREATE_CREDIT_CARD_ERROR = 'app/paymentMethods/CREATE_CREDIT_CARD_ERROR';

export const FETCH_DEFAULT_PAYMENT_REQUEST = 'app/paymentMethods/FETCH_DEFAULT_PAYMENT_REQUEST';
export const FETCH_DEFAULT_PAYMENT_SUCCESS = 'app/paymentMethods/FETCH_DEFAULT_PAYMENT_SUCCESS';
export const FETCH_DEFAULT_PAYMENT_ERROR = 'app/paymentMethods/FETCH_DEFAULT_PAYMENT_ERROR';

export const CREATE_SETUP_INTENT_REQUEST = 'app/paymentMethods/CREATE_SETUP_INTENT_REQUEST';
export const CREATE_SETUP_INTENT_SUCCESS = 'app/paymentMethods/CREATE_SETUP_INTENT_SUCCESS';
export const CREATE_SETUP_INTENT_ERROR = 'app/paymentMethods/CREATE_SETUP_INTENT_ERROR';

export const CONFIRM_SETUP_INTENT_REQUEST = 'app/paymentMethods/CONFIRM_SETUP_INTENT_REQUEST';
export const CONFIRM_SETUP_INTENT_SUCCESS = 'app/paymentMethods/CONFIRM_SETUP_INTENT_SUCCESS';
export const CONFIRM_SETUP_INTENT_ERROR = 'app/paymentMethods/CONFIRM_SETUP_INTENT_ERROR';

// ================ Reducer ================ //

const initialState = {
  createBankAccountError: null,
  createBankAccountInProgress: false,
  createBankAccountSuccess: false,
  createCreditCardError: null,
  createCreditCardInProgress: false,
  createCreditCardSuccess: false,
  createStripeCustomerError: null,
  createStripeCustomerInProgress: null,
  deletePaymentMethodError: null,
  deletePaymentMethodInProgress: null,
  deletedPaymentMethod: null,
  stripeCustomer: null,
  defaultPaymentMethods: null,
  defaultPaymentFetched: false,
  fetchDefaultPaymentError: null,
  fetchDefaultPaymentInProgress: false,
  createSetupIntentInProgress: false,
  createSetupIntentError: null,
  setupIntent: null,
  confirmSetupIntentInProgress: false,
  confirmSetupIntentError: null,
  createdPaymentMethod: null,
};

export default function payoutMethodsPageReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case SET_INITIAL_VALUES:
      return { ...initialState, ...payload };
    case CREATE_STRIPE_CUSTOMER_REQUEST:
      return { ...state, createStripeCustomerError: null, createStripeCustomerInProgress: true };
    case CREATE_STRIPE_CUSTOMER_SUCCESS:
      return {
        ...state,
        createStripeCustomerInProgress: false,
        stripeCustomer: payload,
      };
    case CREATE_STRIPE_CUSTOMER_ERROR:
      console.error(payload);
      return {
        ...state,
        createStripeCustomerError: payload,
        createStripeCustomerInProgress: false,
      };
    case ADD_PAYMENT_METHOD_REQUEST:
      return { ...state, addPaymentMethodError: null, addPaymentMethodInProgress: true };
    case ADD_PAYMENT_METHOD_SUCCESS:
      return {
        ...state,
        addPaymentMethodInProgress: false,
        stripeCustomer: payload,
      };
    case ADD_PAYMENT_METHOD_ERROR:
      console.error(payload);
      return {
        ...state,
        addPaymentMethodError: payload,
        addPaymentMethodInProgress: false,
      };

    case DELETE_PAYMENT_METHOD_REQUEST:
      return {
        ...state,
        deletePaymentMethodError: null,
        deletePaymentMethodInProgress: true,
        deletedPaymentMethod: null,
      };
    case DELETE_PAYMENT_METHOD_SUCCESS:
      return {
        ...state,
        deletePaymentMethodInProgress: false,
        deletedPaymentMethod: payload,
      };
    case DELETE_PAYMENT_METHOD_ERROR:
      return {
        ...state,
        deletePaymentMethodError: payload,
        deletePaymentMethodInProgress: false,
      };

    case CREATE_BANK_ACCOUNT_REQUEST:
      return {
        ...state,
        createBankAccountError: null,
        createBankAccountInProgress: true,
        createBankAccountSuccess: false,
      };
    case CREATE_BANK_ACCOUNT_SUCCESS:
      return {
        ...state,
        createBankAccountSuccess: true,
        createBankAccountInProgress: false,
      };
    case CREATE_BANK_ACCOUNT_ERROR:
      console.error(payload);
      return {
        ...state,
        createBankAccountError: payload,
        createBankAccountInProgress: false,
      };

    case CREATE_CREDIT_CARD_REQUEST:
      return {
        ...state,
        createCreditCardError: null,
        createCreditCardInProgress: true,
        createCreditCardSuccess: false,
      };
    case CREATE_CREDIT_CARD_SUCCESS:
      return {
        ...state,
        createCreditCardSuccess: true,
        createCreditCardInProgress: false,
      };
    case CREATE_CREDIT_CARD_ERROR:
      console.error(payload);
      return {
        ...state,
        createCreditCardError: payload,
        createCreditCardInProgress: false,
      };

    case FETCH_DEFAULT_PAYMENT_REQUEST:
      return { ...state, fetchDefaultPaymentInProgress: true, fetchDefaultPaymentError: null };
    case FETCH_DEFAULT_PAYMENT_SUCCESS:
      const cards = payload.filter(p => p.type === 'card');
      const bankAccounts = payload.filter(p => p.type === 'us_bank_account');
      return {
        ...state,
        fetchDefaultPaymentInProgress: false,
        defaultPaymentMethods: {
          cards,
          bankAccounts,
        },
        defaultPaymentFetched: true,
      };
    case FETCH_DEFAULT_PAYMENT_ERROR:
      return {
        ...state,
        fetchDefaultPaymentInProgress: false,
        fetchDefaultPaymentError: payload,
        defaultPaymentFetched: true,
      };

    case CREATE_SETUP_INTENT_REQUEST:
      return { ...state, createSetupIntentInProgress: true, createSetupIntentError: null };
    case CREATE_SETUP_INTENT_SUCCESS:
      return {
        ...state,
        createSetupIntentInProgress: false,
        setupIntent: payload,
      };
    case CREATE_SETUP_INTENT_ERROR:
      return {
        ...state,
        createSetupIntentInProgress: false,
        createSetupIntentError: payload,
      };
    case CONFIRM_SETUP_INTENT_REQUEST:
      return { ...state, confirmSetupIntentInProgress: true, confirmSetupIntentError: null };
    case CONFIRM_SETUP_INTENT_SUCCESS:
      return {
        ...state,
        confirmSetupIntentInProgress: false,
        createdPaymentMethod: payload,
      };
    case CONFIRM_SETUP_INTENT_ERROR:
      return {
        ...state,
        confirmSetupIntentInProgress: false,
        confirmSetupIntentError: payload,
      };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const setInitialValues = initialValues => ({
  type: SET_INITIAL_VALUES,
  payload: pick(initialValues, Object.keys(initialState)),
});

export const stripeCustomerCreateRequest = () => ({ type: CREATE_STRIPE_CUSTOMER_REQUEST });

export const stripeCustomerCreateSuccess = stripeCustomer => ({
  type: CREATE_STRIPE_CUSTOMER_SUCCESS,
  payload: stripeCustomer,
});

export const stripeCustomerCreateError = e => ({
  type: CREATE_STRIPE_CUSTOMER_ERROR,
  payload: e,
  error: true,
});

export const addPaymentMethodRequest = () => ({ type: ADD_PAYMENT_METHOD_REQUEST });

export const addPaymentMethodSuccess = stripeCustomer => ({
  type: ADD_PAYMENT_METHOD_SUCCESS,
  payload: stripeCustomer,
});

export const addPaymentMethodError = e => ({
  type: ADD_PAYMENT_METHOD_ERROR,
  payload: e,
  error: true,
});

export const deletePaymentMethodRequest = () => ({ type: DELETE_PAYMENT_METHOD_REQUEST });

export const deletePaymentMethodSuccess = paymentMethod => ({
  type: DELETE_PAYMENT_METHOD_SUCCESS,
  payload: paymentMethod,
});

export const deletePaymentMethodError = e => ({
  type: DELETE_PAYMENT_METHOD_ERROR,
  payload: e,
  error: true,
});

export const createBankAccountRequest = () => ({ type: CREATE_BANK_ACCOUNT_REQUEST });

export const createBankAccountSuccess = () => ({
  type: CREATE_BANK_ACCOUNT_SUCCESS,
});

export const createBankAccountError = e => ({
  type: CREATE_BANK_ACCOUNT_ERROR,
  payload: e,
  error: true,
});

export const createCreditCardRequest = () => ({ type: CREATE_CREDIT_CARD_REQUEST });

export const createCreditCardSuccess = () => ({
  type: CREATE_CREDIT_CARD_SUCCESS,
});

export const createCreditCardError = e => ({
  type: CREATE_CREDIT_CARD_ERROR,
  payload: e,
  error: true,
});

export const fetchDefaultPaymentRequest = () => ({ type: FETCH_DEFAULT_PAYMENT_REQUEST });
export const fetchDefaultPaymentSuccess = defaultPayment => ({
  type: FETCH_DEFAULT_PAYMENT_SUCCESS,
  payload: defaultPayment,
});
export const fetchDefaultPaymentError = e => ({
  type: FETCH_DEFAULT_PAYMENT_ERROR,
  error: true,
  payload: e,
});

export const createSetupIntentRequest = () => ({ type: CREATE_SETUP_INTENT_REQUEST });
export const createSetupIntentSuccess = setupIntent => ({
  type: CREATE_SETUP_INTENT_SUCCESS,
  payload: setupIntent,
});
export const createSetupIntentError = e => ({
  type: CREATE_SETUP_INTENT_ERROR,
  error: true,
  payload: e,
});

export const confirmSetupIntentRequest = () => ({ type: CONFIRM_SETUP_INTENT_REQUEST });
export const confirmSetupIntentSuccess = paymentMethod => ({
  type: CONFIRM_SETUP_INTENT_SUCCESS,
  payload: paymentMethod,
});
export const confirmSetupIntentError = e => ({
  type: CONFIRM_SETUP_INTENT_ERROR,
  error: true,
  payload: e,
});

// ================ Thunks ================ //

export const createStripeCustomer = stripePaymentMethodId => (dispatch, getState, sdk) => {
  dispatch(stripeCustomerCreateRequest());

  const currentUser = getState().user.currentUser;
  const email = currentUser?.attributes?.email;

  if (stripePaymentMethodId) {
    return sdk.stripeCustomer
      .create({ stripePaymentMethodId }, { expand: true, include: ['defaultPaymentMethod'] })
      .then(response => {
        dispatch();
        const stripeCustomer = response.data.data;
        dispatch(fetchCurrentUser());
        dispatch(stripeCustomerCreateSuccess(response));
        return stripeUpdateCustomer({
          stripeCustomerId: stripeCustomer?.attributes?.stripeCustomerId,
          update: {
            email,
            address: {
              country: 'US',
            },
          },
        });
      })
      .catch(e => {
        log.error(storableError(e), 'create-stripe-user-failed');
        dispatch(stripeCustomerCreateError(storableError(e)));
      });
  } else {
    return sdk.stripeCustomer
      .create({}, { expand: true })
      .then(res => {
        const stripeCustomerId = res.data?.data?.attributes?.stripeCustomerId;
        return stripeUpdateCustomer({
          stripeCustomerId,
          params: {
            email,
            address: {
              country: 'US',
            },
          },
        });
      })
      .then(response => {
        dispatch(fetchCurrentUser());
        dispatch(stripeCustomerCreateSuccess(response));
        return response;
      })
      .catch(e => {
        log.error(storableError(e), 'create-stripe-user-failed');
        dispatch(stripeCustomerCreateError(storableError(e)));
      });
  }
};

export const addPaymentMethod = stripePaymentMethodId => (dispatch, getState, sdk) => {
  dispatch(addPaymentMethodRequest());
  return sdk.stripeCustomer
    .addPaymentMethod({ stripePaymentMethodId }, { expand: true })
    .then(response => {
      const stripeCustomer = response.data.data;
      dispatch(addPaymentMethodSuccess(stripeCustomer));
      return stripeCustomer;
    })
    .catch(e => {
      log.error(storableError(e), 'add-payment-method-failed');
      dispatch(addPaymentMethodError(storableError(e)));
    });
};

export const deletePaymentMethod = paymentMethodId => (dispatch, getState, sdk) => {
  dispatch(deletePaymentMethodRequest());

  return stripeDetachPaymentMethod({ paymentMethodId })
    .then(response => {
      dispatch(deletePaymentMethodSuccess(response.data));
      return response;
    })
    .catch(e => {
      log.error(storableError(e), 'delete-payment-method-failed');
      dispatch(deletePaymentMethodError(storableError(e)));
    });
};

export const createBankAccount = (stripeCustomerId, stripe, currentUser) => async (
  dispatch,
  getState,
  sdk
) => {
  dispatch(createBankAccountRequest());

  const savePromise = !stripeCustomerId
    ? dispatch(createStripeCustomer())
    : stripeCreateSetupIntent({ stripeCustomerId });

  try {
    const response = await savePromise;

    let setupIntentResponse;

    if (!stripeCustomerId) {
      dispatch(stripeCustomer());
      setupIntentResponse = await stripeCreateSetupIntent({ stripeCustomerId: response.id });
    } else {
      setupIntentResponse = response;
    }

    const firstName = currentUser.attributes.profile.firstName;
    const lastName = currentUser.attributes.profile.lastName;
    const name = `${firstName} ${lastName}`;
    const email = currentUser.attributes.email;

    const bankAccountSetupResponse = await stripe.collectBankAccountForSetup({
      clientSecret: setupIntentResponse.client_secret,
      params: {
        payment_method_type: 'us_bank_account',
        payment_method_data: {
          billing_details: {
            name,
            email,
          },
        },
      },
      expand: ['payment_method'],
    });

    if (bankAccountSetupResponse?.error) {
      throw new Error(bankAccountSetupResponse.error.message);
    }

    if (bankAccountSetupResponse.setupIntent.status === 'requires_confirmation') {
      const confirmResponse = await stripe.confirmUsBankAccountSetup(
        bankAccountSetupResponse.setupIntent.client_secret
      );

      if (confirmResponse?.error) {
        throw new Error(confirmResponse.error.message);
      }
    }

    dispatch(createBankAccountSuccess());
  } catch (e) {
    log.error(storableError(e), 'create-bank-account-failed');
    dispatch(createBankAccountError(storableError(e)));
  }
};

export const createCreditCard = (
  stripeCustomerId,
  stripe,
  billing_details,
  cardElement,
  userId
) => (dispatch, getState, sdk) => {
  dispatch(createCreditCardRequest());

  const savePromise = !stripeCustomerId
    ? dispatch(createStripeCustomer())
    : stripeCreateSetupIntent({ stripeCustomerId });

  // TODO: Need to test for error handling
  return savePromise
    .then(response => {
      if (!stripeCustomerId) {
        dispatch(fetchCurrentUser());
        return stripeCreateSetupIntent({ stripeCustomerId: response.id }).then(response => {
          return stripe.confirmCardSetup(response.client_secret, {
            payment_method: {
              card: cardElement,
              billing_details,
            },
          });
        });
      } else {
        return stripe.confirmCardSetup(response.client_secret, {
          payment_method: {
            card: cardElement,
            billing_details,
          },
        });
      }
    })
    .catch(e => {
      log.error(storableError(e), 'create-credit-card-failed');
      dispatch(createCreditCardError(storableError(e)));
    });
};

export const fetchDefaultPayment = stripeCustomerId => (dispatch, getState, sdk) => {
  dispatch(fetchDefaultPaymentRequest());

  const handleSuccess = response => {
    dispatch(fetchDefaultPaymentSuccess(response.data.data));
    return response;
  };

  const handleError = e => {
    dispatch(fetchDefaultPaymentError(storableError(e)));
    log.error(e, 'fetch-default-payment-failed', {});
  };

  const customerId =
    stripeCustomerId || getState().user.currentUser.stripeCustomer?.attributes.stripeCustomerId;

  return stripePaymentMethods({ stripeCustomerId: customerId })
    .then(handleSuccess)
    .catch(handleError);
};

export const createSetupIntent = (stripeCustomerId, params) => async (dispatch, getState, sdk) => {
  dispatch(createSetupIntentRequest());

  try {
    const setupIntent = await stripeCreateSetupIntent({ stripeCustomerId, params });

    dispatch(createSetupIntentSuccess(setupIntent));
  } catch (e) {
    dispatch(createSetupIntentError(storableError(e)));
    log.error(e, 'create-setup-intent-failed', {});
  }
};

export const confirmSetupIntent = (stripe, setupIntentClientSecret, elements) => async (
  dispatch,
  getState,
  sdk
) => {
  dispatch(confirmSetupIntentRequest());

  try {
    const response = await stripe.confirmSetup({
      elements,
      confirmParams: {
        // Return URL where the customer should be redirected after the SetupIntent is confirmed.]
        payment_method_data: {
          billing_details: {
            address: {
              country: 'US',
            },
          },
        },
        return_url: process.env.REACT_APP_CANONICAL_ROOT_URL,
      },
      redirect: 'if_required',
    });

    dispatch(confirmSetupIntentSuccess(response?.setupIntent?.payment_method));
  } catch (e) {
    dispatch(confirmSetupIntentError(storableError(e)));
    log.error(e, 'confirm-setup-intent-failed', {});
  }
};
