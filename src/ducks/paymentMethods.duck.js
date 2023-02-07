import pick from 'lodash/pick';
import { storableError } from '../util/errors';
import {
  stripeDetachPaymentMethod,
  stripeCreateSetupIntent,
  stripeUpdateCustomer,
} from '../util/api';
import * as log from '../util/log';

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
  deletePaymentMethodSuccess: false,
  stripeCustomer: null,
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
        deletePaymentMethodSuccess: false,
      };
    case DELETE_PAYMENT_METHOD_SUCCESS:
      return {
        ...state,
        deletePaymentMethodInProgress: false,
        deletePaymentMethodSuccess: true,
      };
    case DELETE_PAYMENT_METHOD_ERROR:
      console.error(payload);
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

export const deletePaymentMethodSuccess = () => ({
  type: DELETE_PAYMENT_METHOD_SUCCESS,
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

// ================ Thunks ================ //

export const createStripeCustomer = stripePaymentMethodId => (dispatch, getState, sdk) => {
  dispatch(stripeCustomerCreateRequest());

  if (stripePaymentMethodId) {
    return sdk.stripeCustomer
      .create({ stripePaymentMethodId }, { expand: true, include: ['defaultPaymentMethod'] })
      .then(response => {
        const stripeCustomer = response.data.data;
        dispatch(stripeCustomerCreateSuccess(response));
        return sdk.ownListings.query({}).then(res => {
          // const postal_code = res.data.data[0].attributes.publicData.location.zipcode;
          return stripeUpdateCustomer({
            stripeCustomerId: stripeCustomer.attributes.stripeCustomerId,
            update: {
              address: {
                // postal_code,
                country: 'US',
              },
            },
          });
        });
      })
      .catch(e => {
        log.error(storableError(e), 'create-stripe-user-failed');
        dispatch(stripeCustomerCreateError(storableError(e)));
      });
  } else {
    return sdk.stripeCustomer
      .create({}, { expand: true })
      .then(response => {
        const stripeCustomer = response.data.data;
        return sdk.ownListings.query({}).then(res => {
          // const postal_code = res.data.data[0].attributes.publicData.location.zipcode;
          return stripeUpdateCustomer({
            stripeCustomerId: stripeCustomer.attributes.stripeCustomerId,
            update: {
              address: {
                // postal_code,
                country: 'US',
              },
            },
          });
        });
      })
      .then(response => {
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
      dispatch(deletePaymentMethodSuccess());
      return response;
    })
    .catch(e => {
      log.error(storableError(e), 'delete-payment-method-failed');
      dispatch(deletePaymentMethodError(storableError(e)));
    });
};

export const createBankAccount = (stripeCustomerId, stripe, currentUser) => (
  dispatch,
  getState,
  sdk
) => {
  dispatch(createBankAccountRequest());

  const userId = currentUser.id.uuid;

  const savePromise = !stripeCustomerId
    ? dispatch(createStripeCustomer())
    : stripeCreateSetupIntent({ stripeCustomerId });

  // TODO: Need to test for error handling
  return savePromise
    .then(response => {
      if (!stripeCustomerId) {
        return stripeCreateSetupIntent({ stripeCustomerId });
      } else {
        return response;
      }
    })
    .then(response => {
      const firstName = currentUser.attributes.profile.firstName;
      const lastName = currentUser.attributes.profile.lastName;
      const name = `${firstName} ${lastName}`;
      const email = currentUser.attributes.email;

      return stripe
        .collectBankAccountForSetup({
          clientSecret: response.client_secret,
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
        })
        .then(response => {
          if (response.setupIntent.status === 'requires_confirmation') {
            return stripe.confirmUsBankAccountSetup(response.setupIntent.client_secret);
          }
        });
    })
    .then(response => {
      if (!!response && !!response.error) {
        throw new Error(response.error.message);
      }

      dispatch(createBankAccountSuccess());
    })
    .catch(e => {
      log.error(storableError(e), 'create-bank-account-failed');
      dispatch(createBankAccountError(storableError(e)));
    });
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
    .then(response => {
      dispatch(createCreditCardSuccess());
    })
    .catch(e => {
      log.error(storableError(e), 'create-credit-card-failed');
      dispatch(createCreditCardError(storableError(e)));
    });
};
