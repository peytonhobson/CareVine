import { denormalisedResponseEntities } from '../../util/data';
import { storableError } from '../../util/errors';
import {
  TRANSITION_REQUEST_BOOKING,
  TRANSITION_ACCEPT_BOOKING,
  TRANSITION_START,
  TRANSITION_CHARGE,
  TRANSITION_UPDATE_NEXT_WEEK_START,
  TRANSITION_ACTIVE_UPDATE_BOOKING_END,
  TRANSITION_DELIVERED_CANCEL,
  TRANSITION_ACTIVE_CANCEL,
  TRANSITION_WNFW_CANCEL,
  TRANSITION_WNFW_UPDATE_START,
  TRANSITION_ACCEPT_UPDATE_START,
} from '../../util/transaction';
import * as log from '../../util/log';
import {
  updateTransactionMetadata,
  sendgridStandardEmail,
  sendgridTemplateEmail,
  updatePendingPayouts,
  cancelBooking as apiCancelBooking,
} from '../../util/api';
import { SET_INITIAL_STATE } from '../ProfilePage/ProfilePage.duck';
import { fetchCurrentUser } from '../../ducks/user.duck';

const requestTransitions = [TRANSITION_REQUEST_BOOKING];

// Transitions not included because they are temporary for updates
// TRANSITION_COMPLETE
// TRANSITION_UPDATE_BOOKING_END
// TRANSITION_UPDATE_BOOKING_END_REPEAT

const bookingTransitions = [
  TRANSITION_ACCEPT_BOOKING,
  TRANSITION_CHARGE,
  TRANSITION_START,
  TRANSITION_UPDATE_NEXT_WEEK_START,
  TRANSITION_ACTIVE_UPDATE_BOOKING_END,
  TRANSITION_DELIVERED_CANCEL,
  TRANSITION_ACTIVE_CANCEL,
  TRANSITION_WNFW_CANCEL,
  TRANSITION_WNFW_UPDATE_START,
  TRANSITION_ACCEPT_UPDATE_START,
];

// ================ Action types ================ //

export const SET_INTIIAL_STATE = 'app/BookingsPage/SET_INTIIAL_STATE';

export const FETCH_BOOKINGS_REQUEST = 'app/BookingsPage/FETCH_BOOKINGS_REQUEST';
export const FETCH_BOOKINGS_SUCCESS = 'app/BookingsPage/FETCH_BOOKINGS_SUCCESS';
export const FETCH_BOOKINGS_ERROR = 'app/BookingsPage/FETCH_BOOKINGS_ERROR';

export const CANCEL_BOOKING_REQUEST = 'app/BookingsPage/CANCEL_BOOKING_REQUEST';
export const CANCEL_BOOKING_SUCCESS = 'app/BookingsPage/CANCEL_BOOKING_SUCCESS';
export const CANCEL_BOOKING_ERROR = 'app/BookingsPage/CANCEL_BOOKING_ERROR';

export const DISPUTE_BOOKING_REQUEST = 'app/BookingsPage/DISPUTE_BOOKING_REQUEST';
export const DISPUTE_BOOKING_SUCCESS = 'app/BookingsPage/DISPUTE_BOOKING_SUCCESS';
export const DISPUTE_BOOKING_ERROR = 'app/BookingsPage/DISPUTE_BOOKING_ERROR';

export const UPDATE_BOOKING_METADATA_REQUEST = 'app/BookingsPage/UPDATE_BOOKING_METADATA_REQUEST';
export const UPDATE_BOOKING_METADATA_SUCCESS = 'app/BookingsPage/UPDATE_BOOKING_METADATA_SUCCESS';
export const UPDATE_BOOKING_METADATA_ERROR = 'app/BookingsPage/UPDATE_BOOKING_METADATA_ERROR';

export const REMOVE_OLD_DRAFTS = 'app/BookingsPage/REMOVE_OLD_DRAFTS';

// ================ Reducer ================ //

const initialState = {
  fetchBookingsInProgress: false,
  fetchBookingsError: null,
  bookings: {
    requests: [],
    bookings: [],
  },
  cancelBookingInProgress: false,
  cancelBookingError: null,
  cancelBookingSuccess: false,
  disputeBookingInProgress: false,
  disputeBookingError: null,
  disputeBookingSuccess: false,
  updateBookingMetadataInProgress: false,
  updateBookingMetadataError: null,
  updateBookingMetadataSuccess: false,
};

export default function bookingsPageReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case SET_INITIAL_STATE:
      return { ...initialState, bookings: state.bookings };

    case FETCH_BOOKINGS_REQUEST:
      return { ...state, fetchBookingsInProgress: true, fetchBookingsError: null };
    case FETCH_BOOKINGS_SUCCESS:
      return { ...state, fetchBookingsInProgress: false, bookings: payload };
    case FETCH_BOOKINGS_ERROR:
      return { ...state, fetchBookingsInProgress: false, fetchBookingsError: payload };

    case CANCEL_BOOKING_REQUEST:
      return {
        ...state,
        cancelBookingInProgress: true,
        cancelBookingError: null,
        cancelBookingSuccess: false,
      };
    case CANCEL_BOOKING_SUCCESS:
      return { ...state, cancelBookingInProgress: false, cancelBookingSuccess: true };
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

    case UPDATE_BOOKING_METADATA_REQUEST:
      return {
        ...state,
        updateBookingMetadataInProgress: true,
        updateBookingMetadataError: null,
        updateBookingMetadataSuccess: false,
      };
    case UPDATE_BOOKING_METADATA_SUCCESS:
      return {
        ...state,
        updateBookingMetadataInProgress: false,
        updateBookingMetadataSuccess: true,
      };
    case UPDATE_BOOKING_METADATA_ERROR:
      return {
        ...state,
        updateBookingMetadataInProgress: false,
        updateBookingMetadataError: payload,
      };

    case REMOVE_OLD_DRAFTS:
      return {
        ...state,
      };

    default:
      return state;
  }
}

// ================ Selectors ================ //

// ================ Action creators ================ //

export const setInitialState = () => ({ type: SET_INITIAL_STATE });

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

export const updateBookingMetadataRequest = () => ({ type: UPDATE_BOOKING_METADATA_REQUEST });
export const updateBookingMetadataSuccess = () => ({ type: UPDATE_BOOKING_METADATA_SUCCESS });
export const updateBookingMetadataError = e => ({
  type: UPDATE_BOOKING_METADATA_ERROR,
  error: true,
  payload: e,
});

export const removeOldDrafts = () => ({ type: REMOVE_OLD_DRAFTS });

/* ================ Thunks ================ */

export const fetchBookings = () => async (dispatch, getState, sdk) => {
  dispatch(fetchBookingsRequest());
  let currentUser = getState().user.currentUser;

  while (!currentUser) {
    await new Promise(resolve => setTimeout(resolve, 50));
    currentUser = getState().user.currentUser;
  }

  const include = [
    'author',
    'customer',
    'customer.profileImage',
    'listing',
    'listing.author',
    'provider',
    'provider.profileImage',
    'booking',
  ];

  try {
    const response = await sdk.transactions.query({
      processNames: ['single-booking-process', 'booking-process'],
      userId: currentUser.id.uuid,
      include,
      lastTransitions: [...requestTransitions, ...bookingTransitions],
    });

    const denormalizedBookings = denormalisedResponseEntities(response);

    const sortedBookings = {
      requests: denormalizedBookings.filter(b =>
        requestTransitions.includes(b.attributes.lastTransition)
      ),
      bookings: denormalizedBookings.filter(b =>
        bookingTransitions.includes(b.attributes.lastTransition)
      ),
    };

    dispatch(fetchBookingsSuccess(sortedBookings));
    return sortedBookings;
  } catch (e) {
    log.error(e, 'fetch-bookings-failed', { params });
    dispatch(fetchBookingsError(storableError(e)));
  }
};

export const cancelBooking = transaction => async (dispatch, getState, sdk) => {
  dispatch(cancelBookingRequest());

  const userType = getState().user.currentUser.attributes.profile.metadata.userType;
  const txId = transaction.id.uuid;
  const listingId = transaction.listing.id.uuid;

  try {
    console.log('beforeCall');
    await apiCancelBooking({ txId, listingId, cancelingUserType: userType });

    dispatch(cancelBookingSuccess());
  } catch (e) {
    log.error(e, 'cancel-booking-failed', { txId });
    dispatch(fetchBookings());
    dispatch(cancelBookingError(storableError(e)));
  }
};

export const disputeBooking = (booking, disputeReason) => async (dispatch, getState, sdk) => {
  dispatch(disputeBookingRequest());

  const bookingId = booking.id.uuid;
  const bookingLedger = booking.attributes.metadata.ledger ?? [];
  const latestLedger = bookingLedger.length > 0 ? bookingLedger[bookingLedger.length - 1] : null;

  if (!latestLedger) return;

  const newBookingLegder = bookingLedger.map((ledger, index) => {
    if (index === bookingLedger.length - 1) {
      return {
        ...latestLedger,
        dispute: { date: Date.now(), disputeReason },
      };
    }
    return ledger;
  });

  try {
    await updateTransactionMetadata({
      txId: bookingId,
      metadata: { ledger: newBookingLegder },
    });

    await updatePendingPayouts({
      userId: booking.provider.id.uuid,
      params: { openDispute: true },
      txId: bookingId,
    });

    dispatch(disputeBookingSuccess());
  } catch (e) {
    log.error(e, 'dispute-booking-failed', { bookingId });
    dispatch(disputeBookingError(storableError(e)));
  }

  try {
    await sendgridStandardEmail({
      fromEmail: 'admin-notification@carevine-mail.us',
      receiverEmail: 'peyton.hobson@carevine.us',
      subject: 'Booking Dispute',
      html: `${JSON.stringify(disputeReason).replaceAll('"', '')}<br><br>
      txId: ${bookingId}<br>`,
    });

    await sendgridTemplateEmail({
      receiverId: booking.customer.id.uuid,
      templateData: {
        marketplaceUrl: process.env.REACT_APP_CANONICAL_ROOT_URL,
        providerName: booking.provider.attributes.profile.displayName,
        bookingId: bookingId,
      },
      templateName: 'dispute-in-review',
    });

    await sendgridTemplateEmail({
      receiverId: booking.provider.id.uuid,
      templateData: {
        marketplaceUrl: process.env.REACT_APP_CANONICAL_ROOT_URL,
        customerName: booking.customer.attributes.profile.displayName,
      },
      templateName: 'customer-disputed',
    });
  } catch (e) {
    log.error(e, 'dispute-booking-emails-failed', { bookingId });
  }
};

export const updateBookingMetadata = (booking, metadata) => async (dispatch, getState, sdk) => {
  dispatch(updateBookingMetadataRequest());

  const bookingId = booking.id.uuid;

  try {
    await updateTransactionMetadata({
      txId: bookingId,
      metadata,
    });

    dispatch(updateBookingMetadataSuccess());
  } catch (e) {
    log.error(e, 'update-booking-metadata-failed', { bookingId });
    dispatch(updateBookingMetadataError(storableError(e)));
  }
};

export const removeDrafts = () => async (dispatch, getState, sdk) => {
  const currentUser = getState().user.currentUser;
  if (!currentUser) return;

  const { bookingDrafts = [] } = currentUser.attributes.profile.privateData;

  // Remove any drafts older than 48 hours or don't have selected dates
  const newBookingDrafts = bookingDrafts.filter(
    draft =>
      new Date(draft.createdAt) > new Date() - 48 * 36e5 &&
      (draft.attributes?.bookingSchedule?.length || draft.attributes?.dateTimes)
  );

  if (newBookingDrafts.length === bookingDrafts.length) return;

  try {
    await sdk.currentUser.updateProfile({
      privateData: {
        bookingDrafts: newBookingDrafts,
      },
    });

    dispatch(fetchCurrentUser());
  } catch (e) {
    log.error(e, 'remove-drafts-failed', {});
  }
};

export const loadData = () => (dispatch, getState, sdk) => {
  return dispatch(fetchBookings()).then(bookings => {
    return bookings;
  });
};
