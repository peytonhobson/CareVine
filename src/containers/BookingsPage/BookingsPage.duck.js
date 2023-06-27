import { CAREGIVER } from '../../util/constants';
import { denormalisedResponseEntities } from '../../util/data';
import { storableError } from '../../util/errors';
import {
  TRANSITION_REQUEST_BOOKING,
  TRANSITION_ACCEPT_BOOKING,
  TRANSITION_COMPLETE,
  TRANSITION_PAY_CAREGIVER,
  TRANSITION_DISPUTE,
  TRANSITION_RESOLVE_DISPUTE,
  TRANSITION_REVIEW,
  TRANSITION_EXPIRE_REVIEW_PERIOD,
  TRANSITION_CANCEL_BOOKING_PROVIDER,
  TRANSITION_CANCEL_BOOKING_CUSTOMER,
  TRANSITION_CANCEL_BOOKING_OPERATOR,
  TRANSITION_COMPLETE_CANCELED,
  TRANSITION_CANCEL_BOOKING_REQUEST,
  TRANSITION_CANCEL_ACTIVE_PROVIDER,
  TRANSITION_CANCEL_ACTIVE_CUSTOMER,
} from '../../util/transaction';
import * as log from '../../util/log';
import {
  stripeCreateRefund,
  updateTransactionMetadata,
  sendgridStandardEmail,
  updateListingMetadata,
} from '../../util/api';
import { addTimeToStartOfDay } from '../../util/dates';
import moment from 'moment';

const requestBookingTransitions = [TRANSITION_REQUEST_BOOKING];

const activeOrUpcomingBookingTransitions = [TRANSITION_ACCEPT_BOOKING];

const pastBookingTransitions = [
  TRANSITION_COMPLETE,
  TRANSITION_COMPLETE_CANCELED,
  TRANSITION_DISPUTE,
  TRANSITION_RESOLVE_DISPUTE,
  TRANSITION_PAY_CAREGIVER,
  TRANSITION_EXPIRE_REVIEW_PERIOD,
  TRANSITION_REVIEW,
];

// TODO: Check if this is correct. It may be end of array instead of start of array.
const isActive = booking => {
  const { lineItems } = booking.attributes.metadata;
  const sortedLineItemsByDate = lineItems.sort((a, b) => new Date(a.date) - new Date(b.date));
  const startTimeAsDate = addTimeToStartOfDay(
    sortedLineItemsByDate[0].date,
    sortedLineItemsByDate[0].startTime
  );
  const endTimeAsDate = addTimeToStartOfDay(
    sortedLineItemsByDate[sortedLineItemsByDate.length - 1].date,
    sortedLineItemsByDate[sortedLineItemsByDate.length - 1].endTime
  );
  return startTimeAsDate < new Date() && endTimeAsDate > new Date();
};

const filterActiveOrUpcomingBookings = bookings => {
  const active = bookings.filter(booking => isActive(booking));
  const upcoming = bookings.filter(b => !active.find(ab => ab.id.uuid === b.id.uuid));

  return { active, upcoming };
};

const mapLineItemsForCancellation = lineItems => {
  // Half the amount of the line item if it is within 72 hours of the start time.
  // Remove line items that are more than 72 hours away.
  // This is to create the correct amount for caregiver payout
  return lineItems
    .map(lineItem => {
      const startTime = addTimeToStartOfDay(lineItem.date, lineItem.startTime);
      const isWithin72Hours =
        startTime - moment().toDate() < 72 * 36e5 && startTime > moment().toDate();
      if (isWithin72Hours) {
        return {
          ...lineItem,
          amount: lineItem.amount / 2,
        };
      }

      return lineItem;
    })
    .filter(lineItem => {
      const startTime = addTimeToStartOfDay(lineItem.date, lineItem.startTime);
      return startTime - moment().toDate() < 72 * 36e5;
    });
};

const roundDateToNearest5Minutes = date => {
  const currentTimestamp = Math.floor(date.getTime() / 1000);

  // Convert the current timestamp to the number of minutes
  const currentMinutes = Math.floor(currentTimestamp / 60);

  // Calculate the remainder when dividing the current minutes by 5
  const remainder = currentMinutes % 5;

  // Determine the number of minutes to add to the current timestamp to round it up to the nearest 5 minutes
  const minutesToAdd = remainder !== 0 ? 5 - remainder : 0;

  // Add the minutes to the current timestamp
  const roundedTimestamp = (currentMinutes + minutesToAdd) * 60;

  return roundedTimestamp * 1000;
};

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
  bookings: {
    requests: [],
    upcoming: [],
    active: [],
    past: [],
  },
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

  const params = {
    userId: currentUser.id.uuid,
    include,
  };

  const queryFunc = await sdk.transactions.query;

  try {
    const response = await Promise.all([
      queryFunc({ ...params, lastTransitions: requestBookingTransitions }),
      queryFunc({ ...params, lastTransitions: activeOrUpcomingBookingTransitions }),
      queryFunc({ ...params, lastTransitions: pastBookingTransitions }),
    ]);

    const denormalizedBookings = response.map(b => {
      return denormalisedResponseEntities(b);
    });

    const { active, upcoming } = filterActiveOrUpcomingBookings(denormalizedBookings[1]);

    const sortedBookings = {
      requests: denormalizedBookings[0],
      active,
      upcoming,
      past: denormalizedBookings[2],
    };

    dispatch(fetchBookingsSuccess(sortedBookings));
    return sortedBookings;
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
  const { paymentIntentId, lineItems } = booking.attributes.metadata;
  const listingId = booking.listing.id.uuid;

  const isBookingActive = isActive(booking);

  const transition = isAccepted
    ? userType === CAREGIVER
      ? isBookingActive
        ? TRANSITION_CANCEL_ACTIVE_PROVIDER
        : TRANSITION_CANCEL_BOOKING_PROVIDER
      : isBookingActive
      ? TRANSITION_CANCEL_ACTIVE_CUSTOMER
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

      // Update line items so caregiver is paid out correct amount after refund
      await updateTransactionMetadata({
        txId: bookingId,
        metadata: { lineItems: mapLineItemsForCancellation(lineItems) },
      });
    }

    if (isAccepted && !paymentIntentId) {
      throw new Error('Missing payment intent id');
    }

    // Create new booking end so cancel-active goes to delivered after transitioning
    let newBookingEnd = null;
    let newBookingStart = null;
    if (isBookingActive) {
      // Add 10 minutes to booking end to give time for backend to process transition to delivered
      newBookingEnd = moment(roundDateToNearest5Minutes(new Date()))
        .add(10, 'minutes')
        .toDate();
      newBookingStart = moment(newBookingEnd)
        .subtract(1, 'hours')
        .toDate();
    }

    const response = await sdk.transactions.transition({
      id: bookingId,
      transition,
      params: {
        bookingStart: newBookingStart,
        bookingEnd: newBookingEnd,
      },
    });

    // Update listing metadata to remove cancelled booking dates
    if (isAccepted) {
      try {
        const bookedDates = booking.listing.attributes.metadata.bookedDates ?? [];
        const bookingDates = booking.attributes.metadata.lineItems.map(lineItem => lineItem.date);
        const newBookedDates = bookedDates.filter(
          date => !bookingDates.includes(date) || new Date(date) < new Date()
        );
        await updateListingMetadata({ listingId, metadata: { bookedDates: newBookedDates } });
      } catch (e) {
        log.error(e, 'update-caregiver-booking-dates-failed', {});
      }
    }

    const bookingResponse = denormalisedResponseEntities(response);

    dispatch(cancelBookingSuccess());
    dispatch(fetchBookings());
    return bookingResponse;
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
      html: `${JSON.stringify(disputeReason).replace('"', '')}<br><br>
      txId: ${bookingId}<br>`,
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
