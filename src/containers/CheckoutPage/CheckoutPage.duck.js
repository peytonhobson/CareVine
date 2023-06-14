import pick from 'lodash/pick';
import config from '../../config';
import { updateTransactionMetadata } from '../../util/api';
import { denormalisedResponseEntities } from '../../util/data';
import { storableError } from '../../util/errors';
import { TRANSITION_REQUEST_BOOKING } from '../../util/transaction';
import * as log from '../../util/log';
import { fetchCurrentUserHasOrdersSuccess, fetchCurrentUser } from '../../ducks/user.duck';
import {
  setInitialValues as setInitialValuesForPaymentMethods,
  fetchDefaultPayment,
} from '../../ducks/paymentMethods.duck';

// ================ Action types ================ //

export const SET_INITIAL_VALUES = 'app/CheckoutPage/SET_INITIAL_VALUES';

export const SET_STATE_VALUES = 'app/CheckoutPage/SET_STATE_VALUES';

export const INITIATE_ORDER_REQUEST = 'app/CheckoutPage/INITIATE_ORDER_REQUEST';
export const INITIATE_ORDER_SUCCESS = 'app/CheckoutPage/INITIATE_ORDER_SUCCESS';
export const INITIATE_ORDER_ERROR = 'app/CheckoutPage/INITIATE_ORDER_ERROR';

export const STRIPE_CUSTOMER_REQUEST = 'app/CheckoutPage/STRIPE_CUSTOMER_REQUEST';
export const STRIPE_CUSTOMER_SUCCESS = 'app/CheckoutPage/STRIPE_CUSTOMER_SUCCESS';
export const STRIPE_CUSTOMER_ERROR = 'app/CheckoutPage/STRIPE_CUSTOMER_ERROR';

// ================ Reducer ================ //

const initialState = {
  listing: null,
  bookingRate: null,
  bookingDates: null,
  transaction: null,
  initiateOrderError: null,
  initiateOrderInProgress: false,
  stripeCustomerFetched: false,
};

export default function checkoutPageReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case SET_INITIAL_VALUES:
      return { ...initialState, ...payload };

    case SET_STATE_VALUES:
      return { ...state, ...payload };

    case INITIATE_ORDER_REQUEST:
      return { ...state, initiateOrderError: null, initiateOrderInProgress: true };
    case INITIATE_ORDER_SUCCESS:
      return { ...state, transaction: payload, initiateOrderInProgress: false };
    case INITIATE_ORDER_ERROR:
      console.error(payload); // eslint-disable-line no-console
      return { ...state, initiateOrderError: payload, initiateOrderInProgress: false };

    case STRIPE_CUSTOMER_REQUEST:
      return { ...state, stripeCustomerFetched: false };
    case STRIPE_CUSTOMER_SUCCESS:
      return { ...state, stripeCustomerFetched: true };
    case STRIPE_CUSTOMER_ERROR:
      console.error(payload); // eslint-disable-line no-console
      return { ...state, stripeCustomerFetchError: payload };

    default:
      return state;
  }
}

// ================ Selectors ================ //

// ================ Action creators ================ //

export const setInitialValues = initialValues => ({
  type: SET_INITIAL_VALUES,
  payload: pick(initialValues, Object.keys(initialState)),
});

export const setStateValues = stateValues => ({
  type: SET_STATE_VALUES,
  payload: pick(stateValues, Object.keys(initialState)),
});

const initiateOrderRequest = () => ({ type: INITIATE_ORDER_REQUEST });

const initiateOrderSuccess = order => ({
  type: INITIATE_ORDER_SUCCESS,
  payload: order,
});

const initiateOrderError = e => ({
  type: INITIATE_ORDER_ERROR,
  error: true,
  payload: e,
});

export const stripeCustomerRequest = () => ({ type: STRIPE_CUSTOMER_REQUEST });
export const stripeCustomerSuccess = () => ({ type: STRIPE_CUSTOMER_SUCCESS });
export const stripeCustomerError = e => ({
  type: STRIPE_CUSTOMER_ERROR,
  error: true,
  payload: e,
});

/* ================ Thunks ================ */

export const initiateOrder = (orderParams, metadata) => async (dispatch, getState, sdk) => {
  dispatch(initiateOrderRequest());

  const bodyParams = {
    processAlias: config.bookingProcessAlias,
    transition: TRANSITION_REQUEST_BOOKING,
    params: orderParams,
  };
  const queryParams = {
    include: ['booking', 'provider'],
    expand: true,
  };

  const handleSuccess = response => {
    const entities = denormalisedResponseEntities(response);
    const order = entities[0];
    dispatch(initiateOrderSuccess(order));
    dispatch(fetchCurrentUserHasOrdersSuccess(true));
    return order;
  };

  const handleError = e => {
    dispatch(initiateOrderError(storableError(e)));
    log.error(e, 'initiate-order-failed', {
      listingId: orderParams.listingId.uuid,
    });
    throw e;
  };

  try {
    const response = await sdk.transactions.initiate(bodyParams, queryParams);

    console.log(response.data.data);

    await updateTransactionMetadata({ txId: response.data.data.id.uuid, metadata });

    return handleSuccess(response);
  } catch (e) {
    return handleError(e);
  }
};

// StripeCustomer is a relantionship to currentUser
// We need to fetch currentUser with correct params to include relationship
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

export const loadData = () => (dispatch, getState, sdk) => {
  dispatch(setInitialValuesForPaymentMethods());

  return dispatch(stripeCustomer()).then(() => {
    const stripeCustomer = getState().user.currentUser.stripeCustomer;
    if (stripeCustomer) {
      return dispatch(fetchDefaultPayment(stripeCustomer.attributes.stripeCustomerId));
    }
  });
};
