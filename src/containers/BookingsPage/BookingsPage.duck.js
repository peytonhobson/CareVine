import { denormalisedResponseEntities } from '../../util/data';
import { storableError } from '../../util/errors';
import {
  TRANSITION_REQUEST_BOOKING,
  TRANSITION_ACCEPT_BOOKING,
  TRANSITION_COMPLETE,
  TRANSITION_PAY_CAREGIVER_AFTER_COMPLETION,
  TRANSITION_DISPUTE,
  TRANSITION_DISPUTE_RESOLVED,
  TRANSITION_REVIEW_BY_CUSTOMER,
  TRANSITION_EXPIRE_REVIEW_PERIOD,
} from '../../util/transaction';

// ================ Action types ================ //

export const FETCH_BOOKINGS_REQUEST = 'app/BookingsPage/FETCH_BOOKINGS_REQUEST';
export const FETCH_BOOKINGS_SUCCESS = 'app/BookingsPage/FETCH_BOOKINGS_SUCCESS';
export const FETCH_BOOKINGS_ERROR = 'app/BookingsPage/FETCH_BOOKINGS_ERROR';

// ================ Reducer ================ //

const initialState = {
  fetchBookingsInProgress: false,
  fetchBookingsError: null,
  bookings: [],
};

export default function bookingsPageReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case FETCH_BOOKINGS_REQUEST:
      return { ...state, fetchBookingsInProgress: true, fetchBookingsError: null };
    case FETCH_BOOKINGS_SUCCESS:
      return { ...state, fetchBookingsInProgress: false, bookings: payload };
    case FETCH_BOOKINGS_ERROR:
      return { ...state, fetchBookingsInProgress: false, fetchBookingsError: payload };

    default:
      return state;
  }
}

// ================ Selectors ================ //

// ================ Action creators ================ //

export const fetchBookingsRequest = () => ({ type: FETCH_BOOKINGS_REQUEST });
export const fetchBookingsSuccess = bookings => ({
  type: FETCH_BOOKINGS_SUCCESS,
  payload: bookings,
});
export const fetchBookingsError = e => ({
  type: FETCH_BOOKINGS_ERROR,
  error: true,
  payload: e,
});

/* ================ Thunks ================ */

export const fetchBookings = () => async (dispatch, getState, sdk) => {
  dispatch(fetchBookingsRequest());
  let currentUser = getState().user.currentUser;

  while (!currentUser) {
    await new Promise(resolve => setTimeout(resolve, 100));
    currentUser = getState().user.currentUser;
  }

  const params = {
    userId: currentUser.id.uuid,
    lastTransitions: [
      TRANSITION_REQUEST_BOOKING,
      TRANSITION_ACCEPT_BOOKING,
      TRANSITION_COMPLETE,
      TRANSITION_PAY_CAREGIVER_AFTER_COMPLETION,
      TRANSITION_DISPUTE,
      TRANSITION_DISPUTE_RESOLVED,
      TRANSITION_REVIEW_BY_CUSTOMER,
      TRANSITION_EXPIRE_REVIEW_PERIOD,
    ],
    include: [
      'author',
      'customer',
      'customer.profileImage',
      'listing',
      'listing.author',
      'provider',
      'provider.profileImage',
    ],
    'filter[customer]': currentUser.id,
    'page[limit]': 100,
    'page[offset]': 0,
  };

  try {
    const response = await sdk.transactions.query(params);

    const bookings = denormalisedResponseEntities(response);

    dispatch(fetchBookingsSuccess(bookings));
    return bookings;
  } catch (e) {
    dispatch(fetchBookingsError(storableError(e)));
  }
};

export const loadData = () => (dispatch, getState, sdk) => {
  return dispatch(fetchBookings()).then(bookings => {
    return bookings;
  });
};
