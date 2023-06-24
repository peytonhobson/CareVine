import { CAREGIVER } from '../../util/constants';
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
  TRANSITION_CANCEL_BOOKING_PROVIDER,
  TRANSITION_CANCEL_BOOKING_CUSTOMER,
  TRANSITION_CANCEL_BOOKING_REQUEST,
} from '../../util/transaction';
import * as log from '../../util/log';
import {
  stripeCreateRefund,
  updateTransactionMetadata,
  sendgridStandardEmail,
} from '../../util/api';

// ================ Action types ================ //

export const FETCH_BOOKINGS_REQUEST = 'app/BookingsPage/FETCH_BOOKINGS_REQUEST';
export const FETCH_BOOKINGS_SUCCESS = 'app/BookingsPage/FETCH_BOOKINGS_SUCCESS';
export const FETCH_BOOKINGS_ERROR = 'app/BookingsPage/FETCH_BOOKINGS_ERROR';

export const CANCEL_BOOKING_REQUEST = 'app/BookingsPage/CANCEL_BOOKING_REQUEST';
export const CANCEL_BOOKING_SUCCESS = 'app/BookingsPage/CANCEL_BOOKING_SUCCESS';
export const CANCEL_BOOKING_ERROR = 'app/BookingsPage/CANCEL_BOOKING_ERROR';

export const DISPUTE_BOOKING_REQUEST = 'app/BookingsPage/DISPUTE_BOOKING_REQUEST';
export const DISPUTE_BOOKING_SUCCESS = 'app/BookingsPage/DISPUTE_BOOKING_SUCCESS';
export const DISPUTE_BOOKING_ERROR = 'app/BookingsPage/DISPUTE_BOOKING_ERROR';

// ================ Reducer ================ //

const initialState = {
  fetchBookingsInProgress: false,
  fetchBookingsError: null,
  bookings: [],
  cancelBookingInProgress: false,
  cancelBookingError: null,
  disputeBookingInProgress: false,
  disputeBookingError: null,
  disputeBookingSuccess: false,
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

    case CANCEL_BOOKING_REQUEST:
      return { ...state, cancelBookingInProgress: true, cancelBookingError: null };
    case CANCEL_BOOKING_SUCCESS:
      return { ...state, cancelBookingInProgress: false };
    case CANCEL_BOOKING_ERROR:
      return { ...state, cancelBookingInProgress: false, cancelBookingError: payload };

    case DISPUTE_BOOKING_REQUEST:
      return {
        ...state,
        disputeBookingInProgress: true,
        disputeBookingError: null,
        disputeBookingSuccess: false,
      };
    case DISPUTE_BOOKING_SUCCESS:
      return { ...state, disputeBookingInProgress: false, disputeBookingSuccess: true };
    case DISPUTE_BOOKING_ERROR:
      return { ...state, disputeBookingInProgress: false, disputeBookingError: payload };

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

export const cancelBookingRequest = () => ({ type: CANCEL_BOOKING_REQUEST });
export const cancelBookingSuccess = () => ({ type: CANCEL_BOOKING_SUCCESS });
export const cancelBookingError = e => ({
  type: CANCEL_BOOKING_ERROR,
  error: true,
  payload: e,
});

export const disputeBookingRequest = () => ({ type: DISPUTE_BOOKING_REQUEST });
export const disputeBookingSuccess = () => ({ type: DISPUTE_BOOKING_SUCCESS });
export const disputeBookingError = e => ({
  type: DISPUTE_BOOKING_ERROR,
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
      'booking',
    ],
    'filter[customer]': currentUser.id,
    // TODO: add pagination
  };

  try {
    const response = await sdk.transactions.query(params);

    const bookings = denormalisedResponseEntities(response);

    dispatch(fetchBookingsSuccess(bookings));
    return bookings;
  } catch (e) {
    log.error(e, 'fetch-bookings-failed', { params });
    dispatch(fetchBookingsError(storableError(e)));
  }
};

export const cancelBooking = (booking, refundAmount) => async (dispatch, getState, sdk) => {
  dispatch(cancelBookingRequest());

  const userType = getState().user.currentUser.attributes.profile.metadata.userType;
  const isAccepted = booking.attributes.lastTransition === TRANSITION_ACCEPT_BOOKING;
  const bookingId = booking.id.uuid;
  const { paymentIntentId } = booking.attributes.metadata;

  const transition = isAccepted
    ? userType === CAREGIVER
      ? TRANSITION_CANCEL_BOOKING_PROVIDER
      : TRANSITION_CANCEL_BOOKING_CUSTOMER
    : TRANSITION_CANCEL_BOOKING_REQUEST;

  try {
    await updateTransactionMetadata({
      txId: bookingId,
      metadata: { refundAmount },
    });

    if (isAccepted && paymentIntentId && refundAmount > 0) {
      await stripeCreateRefund({
        paymentIntentId,
        amount: refundAmount,
        reason: 'requested_by_customer',
      });
    }

    const response = await sdk.transactions.transition({ id: bookingId, transition, params: {} });
    const booking = denormalisedResponseEntities(response);

    dispatch(cancelBookingSuccess());
    dispatch(fetchBookings());
    return booking;
  } catch (e) {
    log.error(e, 'cancel-booking-failed', { transition, bookingId });
    dispatch(cancelBookingError(storableError(e)));
  }
};

export const disputeBooking = (booking, disputeReason) => async (dispatch, getState, sdk) => {
  dispatch(disputeBookingRequest());

  const bookingId = booking.id.uuid;

  try {
    await updateTransactionMetadata({
      txId: bookingId,
      metadata: { disputeReason },
    });

    await sendgridStandardEmail({
      fromEmail: 'admin-notification@carevine-mail.us',
      receiverEmail: 'peyton.hobson@carevine.us',
      subject: 'Booking Dispute',
      html: JSON.stringify(disputeReason).replace('"', ''),
    });

    await sdk.transactions.transition({
      id: bookingId,
      transition: TRANSITION_DISPUTE,
      params: {},
    });

    dispatch(disputeBookingSuccess());
    dispatch(fetchBookings());
    return booking;
  } catch (e) {
    log.error(e, 'dispute-booking-failed', { bookingId });
    dispatch(disputeBookingError(storableError(e)));
  }
};

export const loadData = () => (dispatch, getState, sdk) => {
  return dispatch(fetchBookings()).then(bookings => {
    return bookings;
  });
};
