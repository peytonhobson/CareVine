import { fetchCurrentUser } from '../../ducks/user.duck';
import { setInitialValues as setInitialValuesForPaymentMethods } from '../../ducks/paymentMethods.duck';
import { storableError } from '../../util/errors';
import { stripePaymentMethods } from '../../util/api';
import * as log from '../../util/log';

// ================ Action types ================ //

export const STRIPE_CUSTOMER_REQUEST = 'app/PaymentMethodsPage/STRIPE_CUSTOMER_REQUEST';
export const STRIPE_CUSTOMER_SUCCESS = 'app/PaymentMethodsPage/STRIPE_CUSTOMER_SUCCESS';
export const STRIPE_CUSTOMER_ERROR = 'app/PaymentMethodsPage/STRIPE_CUSTOMER_ERROR';

export const FETCH_DEFAULT_PAYMENT_REQUEST = 'app/PaymentMethodsPage/FETCH_DEFAULT_PAYMENT_REQUEST';
export const FETCH_DEFAULT_PAYMENT_SUCCESS = 'app/PaymentMethodsPage/FETCH_DEFAULT_PAYMENT_SUCCESS';
export const FETCH_DEFAULT_PAYMENT_ERROR = 'app/PaymentMethodsPage/FETCH_DEFAULT_PAYMENT_ERROR';
export const DEFAULT_PAYMENT_FETCHED = 'app/PaymentMethodsPage/DEFAULT_PAYMENT_FETCHED';

// ================ Reducer ================ //

const initialState = {
  stripeCustomerFetched: false,
  defaultPaymentMethods: null,
  defaultPaymentFetched: false,
  fetchDefaultPaymentError: null,
  fetchDefaultPaymentInProgress: false,
};

export default function payoutMethodsPageReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case STRIPE_CUSTOMER_REQUEST:
      return { ...state, stripeCustomerFetched: false };
    case STRIPE_CUSTOMER_SUCCESS:
      return { ...state, stripeCustomerFetched: true };
    case STRIPE_CUSTOMER_ERROR:
      console.error(payload); // eslint-disable-line no-console
      return { ...state, stripeCustomerFetchError: payload };

    case FETCH_DEFAULT_PAYMENT_REQUEST:
      return { ...state, fetchDefaultPaymentInProgress: true, fetchDefaultPaymentError: null };
    case FETCH_DEFAULT_PAYMENT_SUCCESS:
      const card = payload.find(p => p.type === 'card');
      const bankAccount = payload.find(p => p.type === 'us_bank_account');
      return {
        ...state,
        fetchDefaultPaymentInProgress: false,
        defaultPaymentMethods: {
          card,
          bankAccount,
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
    case DEFAULT_PAYMENT_FETCHED:
      return { ...state, defaultPaymentFetched: true };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const stripeCustomerRequest = () => ({ type: STRIPE_CUSTOMER_REQUEST });
export const stripeCustomerSuccess = () => ({ type: STRIPE_CUSTOMER_SUCCESS });
export const stripeCustomerError = e => ({
  type: STRIPE_CUSTOMER_ERROR,
  error: true,
  payload: e,
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
export const defaultPaymentFetched = () => ({ type: DEFAULT_PAYMENT_FETCHED });

// ================ Thunks ================ //

export const stripeCustomer = () => (dispatch, getState, sdk) => {
  dispatch(stripeCustomerRequest());

  return dispatch(fetchCurrentUser({ include: ['stripeCustomer.defaultPaymentMethod'] }))
    .then(() => {
      dispatch(stripeCustomerSuccess());
    })
    .catch(e => {
      const error = storableError(e);
      log.error(error, 'fetch-stripe-customer-failed');
      dispatch(stripeCustomerError(error));
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
    throw e;
  };

  return stripePaymentMethods({ stripeCustomerId })
    .then(handleSuccess)
    .catch(handleError);
};

export const loadData = () => (dispatch, getState, sdk) => {
  dispatch(setInitialValuesForPaymentMethods());

  return dispatch(stripeCustomer()).then(() => {
    const stripeCustomer = getState().user.currentUser.stripeCustomer;
    dispatch(fetchCurrentUser());
    if (stripeCustomer) {
      return dispatch(fetchDefaultPayment(stripeCustomer.attributes.stripeCustomerId));
    } else {
      return dispatch(defaultPaymentFetched());
    }
  });
};
