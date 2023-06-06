import { fetchCurrentUser } from '../../ducks/user.duck';
import {
  setInitialValues as setInitialValuesForPaymentMethods,
  fetchDefaultPayment,
} from '../../ducks/paymentMethods.duck';
import { storableError } from '../../util/errors';
import {
  stripeUpdateSubscriptionItem,
  fetchStripeSubscription,
  stripeRetrieveUpcomingInvoice,
} from '../../util/api';
import * as log from '../../util/log';

// ================ Action types ================ //

export const STRIPE_CUSTOMER_REQUEST = 'app/SubscriptionsPage/STRIPE_CUSTOMER_REQUEST';
export const STRIPE_CUSTOMER_SUCCESS = 'app/SubscriptionsPage/STRIPE_CUSTOMER_SUCCESS';
export const STRIPE_CUSTOMER_ERROR = 'app/SubscriptionsPage/STRIPE_CUSTOMER_ERROR';

export const UPDATE_SUBSCRIPTION_ITEM_REQUEST =
  'app/PaymentMethodsPage/UPDATE_SUBSCRIPTION_ITEM_REQUEST';
export const UPDATE_SUBSCRIPTION_ITEM_SUCCESS =
  'app/PaymentMethodsPage/UPDATE_SUBSCRIPTION_ITEM_SUCCESS';
export const UPDATE_SUBSCRIPTION_ITEM_ERROR =
  'app/PaymentMethodsPage/UPDATE_SUBSCRIPTION_ITEM_ERROR';

export const FETCH_STRIPE_SUBSCRIPTION_REQUEST =
  'app/SubscriptionsPage/FETCH_STRIPE_SUBSCRIPTION_REQUEST';
export const FETCH_STRIPE_SUBSCRIPTION_SUCCESS =
  'app/SubscriptionsPage/FETCH_STRIPE_SUBSCRIPTION_SUCCESS';
export const FETCH_STRIPE_SUBSCRIPTION_ERROR =
  'app/SubscriptionsPage/FETCH_STRIPE_SUBSCRIPTION_ERROR';

export const RETRIEVE_UPCOMING_INVOICE_REQUEST =
  'app/SubscriptionsPage/RETRIEVE_UPCOMING_INVOICE_REQUEST';
export const RETRIEVE_UPCOMING_INVOICE_SUCCESS =
  'app/SubscriptionsPage/RETRIEVE_UPCOMING_INVOICE_SUCCESS';
export const RETRIEVE_UPCOMING_INVOICE_ERROR =
  'app/SubscriptionsPage/RETRIEVE_UPCOMING_INVOICE_ERROR';

// ================ Reducer ================ //

const initialState = {
  stripeCustomerFetched: false,
  updateSubscriptionItemInProgress: false,
  updateSubscriptionItemError: null,
  subscription: null,
  fetchSubscriptionInProgress: false,
  fetchSubscriptionError: null,
  upcomingInvoice: null,
  upcomingInvoiceInProgress: false,
  upcomingInvoiceError: null,
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

    case UPDATE_SUBSCRIPTION_ITEM_REQUEST:
      return {
        ...state,
        updateSubscriptionItemInProgress: true,
        updateSubscriptionItemError: null,
      };
    case UPDATE_SUBSCRIPTION_ITEM_SUCCESS:
      return { ...state, updateSubscriptionItemInProgress: false };
    case UPDATE_SUBSCRIPTION_ITEM_ERROR:
      return {
        ...state,
        updateSubscriptionItemInProgress: false,
        updateSubscriptionItemError: payload,
      };

    case FETCH_STRIPE_SUBSCRIPTION_REQUEST:
      return {
        ...state,
        fetchSubscriptionInProgress: true,
        fetchSubscriptionError: null,
      };
    case FETCH_STRIPE_SUBSCRIPTION_SUCCESS:
      return {
        ...state,
        fetchSubscriptionInProgress: false,
        subscription: payload.data,
      };
    case FETCH_STRIPE_SUBSCRIPTION_ERROR:
      return {
        ...state,
        fetchSubscriptionInProgress: false,
        fetchSubscriptionError: payload,
      };

    case RETRIEVE_UPCOMING_INVOICE_REQUEST:
      return {
        ...state,
        upcomingInvoiceInProgress: true,
        upcomingInvoiceError: null,
      };
    case RETRIEVE_UPCOMING_INVOICE_SUCCESS:
      return {
        ...state,
        upcomingInvoiceInProgress: false,
        upcomingInvoice: payload,
      };
    case RETRIEVE_UPCOMING_INVOICE_ERROR:
      return {
        ...state,
        upcomingInvoiceInProgress: false,
        upcomingInvoiceError: payload,
      };

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

export const updateSubscriptionItemRequest = () => ({ type: UPDATE_SUBSCRIPTION_ITEM_REQUEST });
export const updateSubscriptionItemSuccess = () => ({ type: UPDATE_SUBSCRIPTION_ITEM_SUCCESS });
export const updateSubscriptionItemError = e => ({
  type: UPDATE_SUBSCRIPTION_ITEM_ERROR,
  error: true,
  payload: e,
});

export const fetchStripeSubscriptionRequest = () => ({ type: FETCH_STRIPE_SUBSCRIPTION_REQUEST });
export const fetchStripeSubscriptionSuccess = payload => ({
  type: FETCH_STRIPE_SUBSCRIPTION_SUCCESS,
  payload,
});
export const fetchStripeSubscriptionError = e => ({
  type: FETCH_STRIPE_SUBSCRIPTION_ERROR,
  error: true,
  payload: e,
});

export const retrieveUpcomingInvoiceRequest = () => ({ type: RETRIEVE_UPCOMING_INVOICE_REQUEST });
export const retrieveUpcomingInvoiceSuccess = payload => ({
  type: RETRIEVE_UPCOMING_INVOICE_SUCCESS,
  payload,
});
export const retrieveUpcomingInvoiceError = e => ({
  type: RETRIEVE_UPCOMING_INVOICE_ERROR,
  error: true,
  payload: e,
});

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

export const updateSubscriptionItem = (subscriptionId, priceId, params) => async (
  dispatch,
  getState,
  sdk
) => {
  dispatch(updateSubscriptionItemRequest());

  try {
    const response = await stripeUpdateSubscriptionItem({
      subscriptionId,
      params: { ...params, price: priceId },
    });

    dispatch(updateSubscriptionItemSuccess());
  } catch (e) {
    log.error(e, 'update-subscription-item-failed');
    dispatch(updateSubscriptionItemError(e));
  }
};

export const fetchSubscription = subscriptionId => async (dispatch, getState, sdk) => {
  dispatch(fetchStripeSubscriptionRequest());

  try {
    const response = await fetchStripeSubscription({ subscriptionId });

    dispatch(fetchStripeSubscriptionSuccess(response));
  } catch (e) {
    log.error(e, 'fetch-stripe-subscription-failed');
    dispatch(fetchStripeSubscriptionError(e));
  }
};

export const retrieveUpcomingInvoice = stripeCustomerId => async (dispatch, getState, sdk) => {
  dispatch(retrieveUpcomingInvoiceRequest());

  try {
    const response = await stripeRetrieveUpcomingInvoice({ stripeCustomerId });

    dispatch(retrieveUpcomingInvoiceSuccess(response));
  } catch (e) {
    log.error(e, 'retrieve-upcoming-invoice-failed');
    dispatch(retrieveUpcomingInvoiceError(e));
  }
};

export const loadData = () => (dispatch, getState, sdk) => {
  dispatch(setInitialValuesForPaymentMethods());

  return Promise.all([dispatch(stripeCustomer()), dispatch(fetchCurrentUser())]).then(() => {
    const currentUser = getState().user.currentUser;
    const backgroundCheckSubscription =
      currentUser?.attributes.profile.metadata?.backgroundCheckSubscription;
    const stripeCustomer = currentUser.stripeCustomer;

    if (stripeCustomer) {
      const stripeCustomerId = stripeCustomer.attributes.stripeCustomerId;
      return Promise.all([
        dispatch(fetchDefaultPayment(stripeCustomerId)),
        dispatch(retrieveUpcomingInvoice(stripeCustomerId)),
      ]);
    }
  });
};
