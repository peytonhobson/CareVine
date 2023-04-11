import { fetchCurrentUser } from '../../ducks/user.duck';
import {
  setInitialValues as setInitialValuesForPaymentMethods,
  fetchDefaultPayment,
} from '../../ducks/paymentMethods.duck';
import { storableError } from '../../util/errors';
import { stripeUpdateSubscriptionItem } from '../../util/api';
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

// ================ Reducer ================ //

const initialState = {
  stripeCustomerFetched: false,
  updateSubscriptionItemInProgress: false,
  updateSubscriptionItemError: null,
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

export const loadData = () => (dispatch, getState, sdk) => {
  dispatch(setInitialValuesForPaymentMethods());

  return dispatch(stripeCustomer()).then(() => {
    const stripeCustomer = getState().user.currentUser.stripeCustomer;
    dispatch(fetchCurrentUser());
    if (stripeCustomer) {
      return dispatch(fetchDefaultPayment(stripeCustomer.attributes.stripeCustomerId));
    }
  });
};

export const updateSubscriptionItem = (subscriptionId, priceId) => async (
  dispatch,
  getState,
  sdk
) => {
  dispatch(updateSubscriptionItemRequest());

  try {
    const response = await stripeUpdateSubscriptionItem({
      subscriptionId,
      params: { price: priceId },
    });

    dispatch(updateSubscriptionItemSuccess());
  } catch (e) {
    log.error(e, 'update-subscription-item-failed');
    dispatch(updateSubscriptionItemError(e));
  }
};
