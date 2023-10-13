import { CAREGIVER, BOOKING_FEE_PERCENTAGE } from '../../util/constants';
import { denormalisedResponseEntities } from '../../util/data';
import { storableError } from '../../util/errors';
import {
  TRANSITION_REQUEST_BOOKING,
  TRANSITION_ACCEPT_BOOKING,
  TRANSITION_DECLINE_BOOKING,
  TRANSITION_COMPLETE,
  TRANSITION_COMPLETE_CANCELED,
  TRANSITION_CANCEL_BOOKING_REQUEST,
  TRANSITION_CANCEL_ACCEPTED_BOOKING_CUSTOMER,
  TRANSITION_CANCEL_ACCEPTED_BOOKING_PROVIDER,
  TRANSITION_CANCEL_CHARGED_BOOKING_CUSTOMER,
  TRANSITION_CANCEL_CHARGED_BOOKING_PROVIDER,
  TRANSITION_CANCEL_ACTIVE_BOOKING_CUSTOMER,
  TRANSITION_CANCEL_ACTIVE_BOOKING_PROVIDER,
  TRANSITION_START,
  TRANSITION_CHARGE,
  TRANSITION_START_UPDATE_TIMES,
} from '../../util/transaction';
import * as log from '../../util/log';
import {
  stripeCreateRefund,
  updateTransactionMetadata,
  sendgridStandardEmail,
  updateListingMetadata,
  sendgridTemplateEmail,
  transitionPrivileged,
  updateUser,
  updatePendingPayouts,
} from '../../util/api';
import { addTimeToStartOfDay } from '../../util/dates';
import moment from 'moment';
import { SET_INITIAL_STATE } from '../ProfilePage/ProfilePage.duck';

const requestBookingTransitions = [TRANSITION_REQUEST_BOOKING];

const upcomingBookingTransitions = [TRANSITION_ACCEPT_BOOKING, TRANSITION_CHARGE];

const activeBookingTransitions = [TRANSITION_START, TRANSITION_START_UPDATE_TIMES];

const pastBookingTransitions = [TRANSITION_COMPLETE, TRANSITION_COMPLETE_CANCELED];

const cancelBookingTransitions = {
  employer: {
    requested: TRANSITION_CANCEL_BOOKING_REQUEST,
    accepted: TRANSITION_CANCEL_ACCEPTED_BOOKING_CUSTOMER,
    charged: TRANSITION_CANCEL_CHARGED_BOOKING_CUSTOMER,
    active: TRANSITION_CANCEL_ACTIVE_BOOKING_CUSTOMER,
  },
  caregiver: {
    requested: TRANSITION_CANCEL_BOOKING_REQUEST,
    accepted: TRANSITION_CANCEL_ACCEPTED_BOOKING_PROVIDER,
    charged: TRANSITION_CANCEL_CHARGED_BOOKING_PROVIDER,
    active: TRANSITION_CANCEL_ACTIVE_BOOKING_PROVIDER,
  },
};

const mapLineItemsForCancellationCustomer = lineItems => {
  // Half the amount of the line item if it is within 48 hours of the start time.
  // Remove line items that are more than 48 hours away.
  // This is to create the correct amount for caregiver payout
  return lineItems
    .map(lineItem => {
      const startTime = addTimeToStartOfDay(lineItem.date, lineItem.startTime);
      const isWithin48Hours =
        startTime - moment().toDate() < 48 * 36e5 && startTime > moment().toDate();
      if (isWithin48Hours) {
        return {
          ...lineItem,
          amount: parseFloat(lineItem.amount / 2).toFixed(2),
          isFifty: true,
        };
      }

      return lineItem;
    })
    .filter(lineItem => {
      const startTime = addTimeToStartOfDay(lineItem.date, lineItem.startTime);
      return startTime - moment().toDate() < 48 * 36e5;
    });
};

const mapLineItemsForCancellationProvider = lineItems => {
  // Filter out all line items that occur after now.
  return lineItems.filter(lineItem => {
    const startTime = addTimeToStartOfDay(lineItem.date, lineItem.startTime);
    return startTime < moment().toDate();
  });
};

const mapRefundItems = (lineItems, isCaregiver) => {
  return lineItems.map(lineItem => {
    const startTime = addTimeToStartOfDay(lineItem.date, lineItem.startTime);
    const isWithin48Hours =
      startTime - moment().toDate() < 48 * 36e5 && startTime > moment().toDate();
    const isFifty = isWithin48Hours && !isCaregiver;

    const base = isFifty
      ? parseFloat(lineItem.amount / 2).toFixed(2)
      : parseFloat(lineItem.amount).toFixed(2);
    const bookingFee = parseFloat(base * BOOKING_FEE_PERCENTAGE).toFixed(2);
    return {
      isFifty,
      base,
      bookingFee,
      amount: parseFloat(Number(base) + Number(bookingFee)).toFixed(2),
      date: moment(lineItem.date).format('MM/DD'),
    };
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

export const ACCEPT_BOOKING_REQUEST = 'app/BookingsPage/ACCEPT_BOOKING_REQUEST';
export const ACCEPT_BOOKING_SUCCESS = 'app/BookingsPage/ACCEPT_BOOKING_SUCCESS';
export const ACCEPT_BOOKING_ERROR = 'app/BookingsPage/ACCEPT_BOOKING_ERROR';

export const DECLINE_BOOKING_REQUEST = 'app/BookingsPage/DECLINE_BOOKING_REQUEST';
export const DECLINE_BOOKING_SUCCESS = 'app/BookingsPage/DECLINE_BOOKING_SUCCESS';
export const DECLINE_BOOKING_ERROR = 'app/BookingsPage/DECLINE_BOOKING_ERROR';

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
  cancelBookingSuccess: false,
  disputeBookingInProgress: false,
  disputeBookingError: null,
  disputeBookingSuccess: false,
  acceptBookingError: null,
  acceptBookingInProgress: false,
  acceptBookingSuccess: false,
  declineBookingError: null,
  declineBookingInProgress: false,
  declineBookingSuccess: false,
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

    case ACCEPT_BOOKING_REQUEST:
      return {
        ...state,
        acceptBookingInProgress: true,
        acceptBookingError: null,
        acceptBookingSuccess: false,
      };
    case ACCEPT_BOOKING_SUCCESS:
      return { ...state, acceptBookingInProgress: false, acceptBookingSuccess: true };
    case ACCEPT_BOOKING_ERROR:
      return { ...state, acceptBookingInProgress: false, acceptBookingError: payload };

    case DECLINE_BOOKING_REQUEST:
      return {
        ...state,
        declineBookingInProgress: true,
        declineBookingError: null,
        declineBookingSuccess: false,
      };
    case DECLINE_BOOKING_SUCCESS:
      return { ...state, declineBookingInProgress: false, declineBookingSuccess: true };
    case DECLINE_BOOKING_ERROR:
      return { ...state, declineBookingInProgress: false, declineBookingError: payload };

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

export const acceptBookingRequest = () => ({ type: ACCEPT_BOOKING_REQUEST });
export const acceptBookingSuccess = () => ({ type: ACCEPT_BOOKING_SUCCESS });
export const acceptBookingError = e => ({
  type: ACCEPT_BOOKING_ERROR,
  error: true,
  payload: e,
});

export const declineBookingRequest = () => ({ type: DECLINE_BOOKING_REQUEST });
export const declineBookingSuccess = () => ({ type: DECLINE_BOOKING_SUCCESS });
export const declineBookingError = e => ({
  type: DECLINE_BOOKING_ERROR,
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

  try {
    const response = await sdk.transactions.query({
      ...params,
      lastTransitions: [
        TRANSITION_ACCEPT_BOOKING,
        TRANSITION_REQUEST_BOOKING,
        TRANSITION_CHARGE,
        TRANSITION_START,
        TRANSITION_START_UPDATE_TIMES,
        TRANSITION_COMPLETE,
        TRANSITION_COMPLETE_CANCELED,
      ],
    });

    const denormalizedBookings = denormalisedResponseEntities(response);

    const sortedBookings = {
      requests: denormalizedBookings.filter(b =>
        requestBookingTransitions.includes(b.attributes.lastTransition)
      ),
      active: denormalizedBookings.filter(b =>
        activeBookingTransitions.includes(b.attributes.lastTransition)
      ),
      upcoming: denormalizedBookings.filter(b =>
        upcomingBookingTransitions.includes(b.attributes.lastTransition)
      ),
      past: denormalizedBookings.filter(b =>
        pastBookingTransitions.includes(b.attributes.lastTransition)
      ),
    };

    dispatch(fetchBookingsSuccess(sortedBookings));
    return sortedBookings;
  } catch (e) {
    log.error(e, 'fetch-bookings-failed', { params });
    dispatch(fetchBookingsError(storableError(e)));
  }
};

export const cancelBooking = booking => async (dispatch, getState, sdk) => {
  dispatch(cancelBookingRequest());

  const userType = getState().user.currentUser.attributes.profile.metadata.userType;
  const bookingId = booking.id.uuid;
  const { paymentIntentId, lineItems, bookingFee } = booking.attributes.metadata;
  const listingId = booking.listing.id.uuid;
  const totalAmount = lineItems.reduce((acc, curr) => acc + parseFloat(curr.amount), 0) * 100;

  const refundItems = mapRefundItems(lineItems, userType === CAREGIVER);
  const refundAmount = parseInt(
    refundItems.reduce((acc, curr) => acc + parseFloat(curr.base), 0) * 100
  );

  const lastTransition = booking.attributes.lastTransition;
  let bookingState = null;

  switch (lastTransition) {
    case TRANSITION_ACCEPT_BOOKING:
      bookingState = 'accepted';
      break;
    case TRANSITION_CHARGE:
      bookingState = 'charged';
      break;
    case TRANSITION_START:
      bookingState = 'active';
      break;
    case TRANSITION_START_UPDATE_TIMES:
      bookingState = 'active';
      break;
    case TRANSITION_REQUEST_BOOKING:
      bookingState = 'requested';
      break;
    default:
      bookingState = null;
  }

  const isCaregiver = userType === CAREGIVER;

  const transition = cancelBookingTransitions[userType][bookingState];

  try {
    if (bookingState !== 'requested' && bookingState !== 'accepted' && !paymentIntentId) {
      throw new Error('Missing payment intent id');
    }

    if (paymentIntentId && refundAmount > 0) {
      const applicationFeeRefund = parseInt(
        (parseFloat(refundAmount) / parseFloat(totalAmount)) * bookingFee * 100
      );

      await stripeCreateRefund({
        paymentIntentId,
        amount: refundAmount,
        applicationFeeRefund,
      });

      const newLineItems = isCaregiver
        ? mapLineItemsForCancellationProvider(lineItems)
        : mapLineItemsForCancellationCustomer(lineItems);
      const payout = newLineItems.reduce((acc, item) => acc + parseFloat(item.amount), 0);

      // Update line items so caregiver is paid out correct amount after refund
      await updateTransactionMetadata({
        txId: bookingId,
        metadata: {
          lineItems: newLineItems,
          refundAmount: parseFloat(refundAmount / 100).toFixed(2),
          payout: parseInt(payout) === 0 ? 0 : parseFloat(payout).toFixed(2),
          refundItems,
          bookingFeeRefundAmount: parseFloat(applicationFeeRefund / 100).toFixed(2),
          totalRefund: parseFloat(refundAmount / 100 + applicationFeeRefund / 100).toFixed(2),
        },
      });
    } else {
      await updateTransactionMetadata({
        txId: bookingId,
        metadata: {
          lineItems: [],
          refundAmount: 0,
          payout: 0,
          refundItems: [],
        },
      });
    }

    // Create new booking end so cancel-active goes to delivered after transitioning
    let newBookingEnd = null;
    let newBookingStart = null;
    if (bookingState === 'active') {
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
    if (bookingState !== 'requested') {
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
    return bookingResponse;
  } catch (e) {
    log.error(e, 'cancel-booking-failed', { transition, bookingId });
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

const generateBookingNumber = async (transaction, sdk) => {
  const listingId = transaction.listing.id?.uuid;

  try {
    const fullListingResponse = await sdk.listings.show({
      id: listingId,
      'fields.listing': ['metadata'],
    });

    const fullListing = fullListingResponse.data.data;
    const bookingNumbers = fullListing.attributes.metadata.bookingNumbers ?? [];

    let bookingNumber = Math.floor(Math.random() * 100000000);

    while (bookingNumbers.includes(bookingNumber)) {
      bookingNumber = Math.floor(Math.random() * 100000000);
    }

    return { bookingNumber, bookingNumbers };
  } catch (e) {
    log.error(e, 'generate-booking-number-failed', {});
  }
};

export const acceptBooking = transaction => async (dispatch, getState, sdk) => {
  dispatch(acceptBookingRequest());

  const txId = transaction.id.uuid;
  const listingId = transaction.listing.id.uuid;

  try {
    const { bookingNumber, bookingNumbers } = await generateBookingNumber(transaction, sdk);

    await transitionPrivileged({
      bodyParams: {
        id: txId,
        transition: TRANSITION_ACCEPT_BOOKING,
        params: {
          metadata: {
            bookingNumber,
          },
        },
      },
    });

    const bookedDates = transaction.listing.attributes.metadata.bookedDates ?? [];
    const bookingDates = transaction.attributes.metadata.lineItems.map(lineItem => lineItem.date);
    const newBookedDates = [...bookedDates, ...bookingDates];

    await updateListingMetadata({
      listingId,
      metadata: { bookedDates: newBookedDates, bookingNumbers: [...bookingNumbers, bookingNumber] },
    });

    dispatch(acceptBookingSuccess());
    return;
  } catch (e) {
    log.error(e, 'accept-booking-failed', { txId });
    dispatch(acceptBookingError(storableError(e)));
  }
};

export const declineBooking = transaction => async (dispatch, getState, sdk) => {
  dispatch(declineBookingRequest());

  const txId = transaction.id.uuid;

  try {
    await sdk.transactions.transition({
      id: txId,
      transition: TRANSITION_DECLINE_BOOKING,
      params: {},
    });

    dispatch(declineBookingSuccess());
    return;
  } catch (e) {
    log.error(e, 'decline-booking-failed', { txId });
    dispatch(declineBookingError(storableError(e)));
  }
};

export const loadData = () => (dispatch, getState, sdk) => {
  return dispatch(fetchBookings()).then(bookings => {
    return bookings;
  });
};
