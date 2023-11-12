import pick from 'lodash/pick';
import config from '../../config';
import { initiateBooking } from '../../util/api';
import { denormalisedResponseEntities } from '../../util/data';
import { storableError } from '../../util/errors';
import { TRANSITION_REQUEST_BOOKING } from '../../util/transaction';
import * as log from '../../util/log';
import { fetchCurrentUserHasOrdersSuccess } from '../../ducks/user.duck';
import {
  setInitialValues as setInitialValuesForPaymentMethods,
  fetchDefaultPayment,
} from '../../ducks/paymentMethods.duck';
import { NOTIFICATION_TYPE_BOOKING_REQUESTED } from '../../util/constants';
import { v4 as uuidv4 } from 'uuid';
import { updateUserNotifications } from '../../util/api';
import { types as sdkTypes } from '../../util/sdkLoader';
import { stripeCustomer } from '../../ducks/stripe.duck';

const { UUID } = sdkTypes;

// ================ Action types ================ //

export const SET_INITIAL_VALUES = 'app/CheckoutPage/SET_INITIAL_VALUES';

export const SET_STATE_VALUES = 'app/CheckoutPage/SET_STATE_VALUES';

export const INITIATE_ORDER_REQUEST = 'app/CheckoutPage/INITIATE_ORDER_REQUEST';
export const INITIATE_ORDER_SUCCESS = 'app/CheckoutPage/INITIATE_ORDER_SUCCESS';
export const INITIATE_ORDER_ERROR = 'app/CheckoutPage/INITIATE_ORDER_ERROR';

export const STRIPE_CUSTOMER_REQUEST = 'app/CheckoutPage/STRIPE_CUSTOMER_REQUEST';
export const STRIPE_CUSTOMER_SUCCESS = 'app/CheckoutPage/STRIPE_CUSTOMER_SUCCESS';
export const STRIPE_CUSTOMER_ERROR = 'app/CheckoutPage/STRIPE_CUSTOMER_ERROR';

export const UPDATE_BOOKING_DRAFT_REQUEST = 'app/CheckoutPage/UPDATE_BOOKING_DRAFT_REQUEST';
export const UPDATE_BOOKING_DRAFT_SUCCESS = 'app/CheckoutPage/UPDATE_BOOKING_DRAFT_SUCCESS';
export const UPDATE_BOOKING_DRAFT_ERROR = 'app/CheckoutPage/UPDATE_BOOKING_DRAFT_ERROR';

export const SHOW_LISTING_REQUEST = 'app/CheckoutPage/SHOW_LISTING_REQUEST';
export const SHOW_LISTING_SUCCESS = 'app/CheckoutPage/SHOW_LISTING_SUCCESS';
export const SHOW_LISTING_ERROR = 'app/CheckoutPage/SHOW_LISTING_ERROR';

// ================ Reducer ================ //

const initialState = {
  listing: null,
  showListingInProgress: false,
  showListingError: null,
  transaction: null,
  initiateOrderError: null,
  initiateOrderInProgress: false,
  stripeCustomerFetched: false,
  updateBookingDraftInProgress: false,
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

    case UPDATE_BOOKING_DRAFT_REQUEST:
      return { ...state, updateBookingDraftInProgress: true, updateBookingDraftError: null };
    case UPDATE_BOOKING_DRAFT_SUCCESS:
      return { ...state, updateBookingDraftInProgress: false };
    case UPDATE_BOOKING_DRAFT_ERROR:
      return { ...state, updateBookingDraftInProgress: false, updateBookingDraftError: payload };

    case SHOW_LISTING_REQUEST:
      return { ...state, showListingInProgress: true, showListingError: null };
    case SHOW_LISTING_SUCCESS:
      return { ...state, showListingInProgress: false, listing: payload };
    case SHOW_LISTING_ERROR:
      return { ...state, showListingInProgress: false, showListingError: payload };

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

const updateBookingDraftRequest = () => ({ type: UPDATE_BOOKING_DRAFT_REQUEST });
const updateBookingDraftSuccess = () => ({ type: UPDATE_BOOKING_DRAFT_SUCCESS });
const updateBookingDraftError = e => ({
  type: UPDATE_BOOKING_DRAFT_ERROR,
  error: true,
  payload: e,
});

const showListingRequest = () => ({ type: SHOW_LISTING_REQUEST });
const showListingSuccess = response => ({
  type: SHOW_LISTING_SUCCESS,
  payload: response,
});
const showListingError = e => ({
  type: SHOW_LISTING_ERROR,
  error: true,
  payload: e,
});

/* ================ Thunks ================ */

export const initiateOrder = (orderParams, metadata, listing, draftId) => async (
  dispatch,
  getState,
  sdk
) => {
  dispatch(initiateOrderRequest());

  const currentUserDisplayName = getState().user.currentUser.attributes.profile.displayName;

  const bodyParams = {
    processAlias:
      metadata.type === 'recurring'
        ? config.recurringBookingProcessAlias
        : config.singleBookingProcessAlias,
    transition: TRANSITION_REQUEST_BOOKING,
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
  };

  const notificationId = uuidv4();
  const newNotification = {
    id: notificationId,
    type: NOTIFICATION_TYPE_BOOKING_REQUESTED,
    createdAt: new Date().getTime(),
    isRead: false,
  };

  try {
    const transactionResponse = await initiateBooking({
      bodyParams: {
        ...bodyParams,
        params: { ...orderParams, metadata: { notificationId, ...metadata } },
      },
      queryParams,
    });

    handleSuccess(transactionResponse);

    await updateUserNotifications({
      userId: listing.author.id.uuid,
      newNotification: {
        ...newNotification,
        metadata: {
          txId: transactionResponse.data.data.id.uuid,
          senderName: currentUserDisplayName,
        },
      },
    });
  } catch (e) {
    handleError(e);
  }

  const bookingDrafts =
    getState().user.currentUser.attributes.profile.privateData.bookingDrafts || [];

  const updatedBookingDrafts = bookingDrafts.filter(draft => draft.id !== draftId);

  try {
    await sdk.currentUser.updateProfile({
      privateData: {
        bookingDrafts: updatedBookingDrafts,
      },
    });
  } catch (e) {
    log.error(e, 'failed-to-update-booking-drafts', {});
  }
};

export const updateBookingDraft = (bookingData, draftId) => async (dispatch, getState, sdk) => {
  dispatch(updateBookingDraftRequest());

  const currentUser = getState().user.currentUser;
  if (!currentUser) return;

  const { bookingDrafts = [] } = currentUser.attributes.profile.privateData || [];

  const bookingDraft = bookingDrafts.find(draft => draft.id === draftId);

  if (!bookingDraft) return;

  const updatedBookingDraft = {
    ...bookingDraft,
    attributes: {
      ...bookingDraft.attributes,
      ...bookingData,
    },
  };

  const { bookingSchedule, dateTimes } = bookingData;
  console.log(bookingSchedule, dateTimes);
  const isEmptyDraft = !bookingSchedule.length && !dateTimes;

  const updatedBookingDrafts = isEmptyDraft
    ? bookingDrafts.filter(draft => draft.id !== draftId)
    : bookingDrafts.map(draft => (draft.id === draftId ? updatedBookingDraft : draft));

  try {
    await sdk.currentUser.updateProfile({
      privateData: {
        bookingDrafts: updatedBookingDrafts,
      },
    });

    dispatch(updateBookingDraftSuccess());
  } catch (e) {
    dispatch(updateBookingDraftError(storableError(e)));
  }
};

export const showListing = listingId => async (dispatch, getState, sdk) => {
  dispatch(showListingRequest(listingId));
  const params = {
    id: listingId,
    include: ['author', 'author.profileImage'],
    'fields.image': [
      // Avatars
      'variants.square-small',
      'variants.square-small2x',
    ],
  };

  try {
    const listingResponse = await sdk.listings.show(params);

    const listing = denormalisedResponseEntities(listingResponse)[0];

    dispatch(showListingSuccess(listing));
  } catch (e) {
    log.error(e, 'show-listing-failed', { listingId });
    dispatch(showListingError(storableError(e)));
  }
};

export const loadData = (params, search) => (dispatch, getState, sdk) => {
  dispatch(setInitialValuesForPaymentMethods());

  const listingId = new UUID(params.id);

  return Promise.all([dispatch(stripeCustomer()), dispatch(showListing(listingId)), dispatch]).then(
    () => {
      const stripeCustomer = getState().user.currentUser.stripeCustomer;
      if (stripeCustomer) {
        return dispatch(fetchDefaultPayment(stripeCustomer.attributes.stripeCustomerId));
      }
    }
  );
};
