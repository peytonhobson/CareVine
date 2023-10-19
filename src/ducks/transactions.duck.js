import pick from 'lodash/pick';
import { storableError } from '../util/errors';
import * as log from '../util/log';
import { types as sdkTypes } from '../util/sdkLoader';
import {
  TRANSITION_ACCEPT_BOOKING,
  TRANSITION_DECLINE_BOOKING,
  TRANSITION_START,
  TRANSITION_ACTIVE_UPDATE_BOOKING_END,
  TRANSITION_REQUEST_BOOKING,
} from '../util/transaction';
import {
  updateListingMetadata,
  transitionPrivileged,
  updateTransactionMetadata,
  sendBookingModifiedNotification,
} from '../util/api';
import moment from 'moment';
import { addTimeToStartOfDay } from '../util/dates';
import { denormalisedResponseEntities } from '../util/data';
import { ISO_OFFSET_FORMAT } from '../util/constants';
const { UUID } = sdkTypes;
import { constructBookingMetadataRecurring, updateBookedDays } from '../util/bookings';
import { fetchBookings } from '../containers/BookingsPage/BookingsPage.duck';

// ================ Action types ================ //

export const SET_INITIAL_VALUES = 'app/transactions/SET_INITIAL_VALUES';

export const FETCH_CURRENT_USER_TRANSACTIONS_REQUEST =
  'app/transactions/FETCH_CURRENT_USER_TRANSACTIONS_REQUEST';
export const FETCH_CURRENT_USER_TRANSACTIONS_SUCCESS =
  'app/transactions/FETCH_CURRENT_USER_TRANSACTIONS_SUCCESS';
export const FETCH_CURRENT_USER_TRANSACTIONS_ERROR =
  'app/transactions/FETCH_CURRENT_USER_TRANSACTIONS_ERROR';

export const FETCH_TRANSACTION_REQUEST = 'app/transactions/FETCH_TRANSACTION_REQUEST';
export const FETCH_TRANSACTION_SUCCESS = 'app/transactions/FETCH_TRANSACTION_SUCCESS';
export const FETCH_TRANSACTION_ERROR = 'app/transactions/FETCH_TRANSACTION_ERROR';

export const TRANSITION_TRANSACTION_REQUEST = 'app/transactions/TRANSITION_TRANSACTION_REQUEST';
export const TRANSITION_TRANSACTION_SUCCESS = 'app/transactions/TRANSITION_TRANSACTION_SUCCESS';
export const TRANSITION_TRANSACTION_ERROR = 'app/transactions/TRANSITION_TRANSACTION_ERROR';

export const ACCEPT_BOOKING_REQUEST = 'app/transactions/ACCEPT_BOOKING_REQUEST';
export const ACCEPT_BOOKING_SUCCESS = 'app/transactions/ACCEPT_BOOKING_SUCCESS';
export const ACCEPT_BOOKING_ERROR = 'app/transactions/ACCEPT_BOOKING_ERROR';

export const DECLINE_BOOKING_REQUEST = 'app/BookingsPage/DECLINE_BOOKING_REQUEST';
export const DECLINE_BOOKING_SUCCESS = 'app/BookingsPage/DECLINE_BOOKING_SUCCESS';
export const DECLINE_BOOKING_ERROR = 'app/BookingsPage/DECLINE_BOOKING_ERROR';

export const UPDATE_BOOKING_END_DATE_REQUEST = 'app/transactions/UPDATE_BOOKING_END_DATE_REQUEST';
export const UPDATE_BOOKING_END_DATE_SUCCESS = 'app/transactions/UPDATE_BOOKING_END_DATE_SUCCESS';
export const UPDATE_BOOKING_END_DATE_ERROR = 'app/transactions/UPDATE_BOOKING_END_DATE_ERROR';

export const UPDATE_BOOKING_SCHEDULE_REQUEST = 'app/transactions/UPDATE_BOOKING_SCHEDULE_REQUEST';
export const UPDATE_BOOKING_SCHEDULE_SUCCESS = 'app/transactions/UPDATE_BOOKING_SCHEDULE_SUCCESS';
export const UPDATE_BOOKING_SCHEDULE_ERROR = 'app/transactions/UPDATE_BOOKING_SCHEDULE_ERROR';

export const REQUEST_BOOKING_SCHEDULE_CHANGE_REQUEST =
  'app/transactions/REQUEST_BOOKING_SCHEDULE_CHANGE_REQUEST';
export const REQUEST_BOOKING_SCHEDULE_CHANGE_SUCCESS =
  'app/transactions/REQUEST_BOOKING_SCHEDULE_CHANGE_SUCCESS';
export const REQUEST_BOOKING_SCHEDULE_CHANGE_ERROR =
  'app/transactions/REQUEST_BOOKING_SCHEDULE_CHANGE_ERROR';

export const SET_CURRENT_TRANSACTION = 'app/transactions/SET_CURRENT_TRANSACTION';

// ================ Reducer ================ //

const initialState = {
  fetchCurrentUserTransactionsInProgress: false,
  fetchCurrentUserTransactionsError: false,
  currentUserTransactions: [],
  fetchTransactionInProgress: false,
  fetchTransactionError: false,
  currentTransaction: null,
  transitionTransactionInProgress: false,
  transitionTransactionError: null,
  acceptBookingInProgress: false,
  acceptBookingError: null,
  acceptBookingSuccess: null,
  declineBookingError: null,
  declineBookingInProgress: false,
  declineBookingSuccess: false,
  updateBookingEndDateInProgress: false,
  updateBookingEndDateError: null,
  updateBookingEndDateSuccess: null,
  updateBookingScheduleInProgress: false,
  updateBookingScheduleError: null,
  updateBookingScheduleSuccess: null,
  requestBookingScheduleChangeInProgress: false,
  requestBookingScheduleChangeError: null,
  requestBookingScheduleChangeSuccess: null,
};

export default function transactionsReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case SET_INITIAL_VALUES:
      return { ...initialState, ...payload };
    case FETCH_CURRENT_USER_TRANSACTIONS_REQUEST:
      return { ...state, fetchCurrentUserTransactionsInProgress: true };
    case FETCH_CURRENT_USER_TRANSACTIONS_SUCCESS:
      return {
        ...state,
        fetchCurrentUserTransactionInProgress: false,
        currentUserTransactions: payload,
      };
    case FETCH_CURRENT_USER_TRANSACTIONS_ERROR:
      console.error(payload);
      return {
        ...state,
        fetchCurrentUserTransactionsError: payload,
        fetchCurrentUserTransactionsInProgress: false,
      };
    case FETCH_TRANSACTION_REQUEST:
      return { ...state, fetchTransactionInProgress: true };
    case FETCH_TRANSACTION_SUCCESS:
      return {
        ...state,
        fetchTransactionInProgress: false,
        currentTransaction: payload,
      };
    case FETCH_TRANSACTION_ERROR:
      console.error(payload);
      return {
        ...state,
        fetchTransactionError: payload,
        fetchTransactionInProgress: false,
      };
    case SET_CURRENT_TRANSACTION:
      return {
        ...state,
        currentTransaction: payload,
      };

    case TRANSITION_TRANSACTION_REQUEST:
      return {
        ...state,
        transitionTransactionInProgress: payload,
        transitionTransactionError: null,
      };
    case TRANSITION_TRANSACTION_SUCCESS:
      return {
        ...state,
        transitionTransactionInProgress: false,
        currentTransaction: payload,
      };
    case TRANSITION_TRANSACTION_ERROR:
      return {
        ...state,
        transitionTransactionInProgress: false,
        transitionTransactionError: payload,
      };

    case ACCEPT_BOOKING_REQUEST:
      return {
        ...state,
        acceptBookingInProgress: true,
        acceptBookingError: null,
      };
    case ACCEPT_BOOKING_SUCCESS:
      return {
        ...state,
        acceptBookingInProgress: false,
        acceptBookingSuccess: true,
      };
    case ACCEPT_BOOKING_ERROR:
      return {
        ...state,
        acceptBookingInProgress: false,
        acceptBookingError: payload,
      };

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

    case UPDATE_BOOKING_END_DATE_REQUEST:
      return {
        ...state,
        updateBookingEndDateInProgress: true,
        updateBookingEndDateError: null,
        updateBookingEndDateSuccess: false,
      };
    case UPDATE_BOOKING_END_DATE_SUCCESS:
      return {
        ...state,
        updateBookingEndDateInProgress: false,
        updateBookingEndDateSuccess: true,
      };
    case UPDATE_BOOKING_END_DATE_ERROR:
      return {
        ...state,
        updateBookingEndDateInProgress: false,
        updateBookingEndDateError: payload,
      };

    case UPDATE_BOOKING_SCHEDULE_REQUEST:
      return {
        ...state,
        updateBookingScheduleInProgress: true,
        updateBookingScheduleError: null,
        updateBookingScheduleSuccess: false,
      };
    case UPDATE_BOOKING_SCHEDULE_SUCCESS:
      return {
        ...state,
        updateBookingScheduleInProgress: false,
        updateBookingScheduleSuccess: true,
      };
    case UPDATE_BOOKING_SCHEDULE_ERROR:
      return {
        ...state,
        updateBookingScheduleInProgress: false,
        updateBookingScheduleError: payload,
      };

    case REQUEST_BOOKING_SCHEDULE_CHANGE_REQUEST:
      return {
        ...state,
        requestBookingScheduleChangeInProgress: true,
        requestBookingScheduleChangeError: null,
        requestBookingScheduleChangeSuccess: false,
      };
    case REQUEST_BOOKING_SCHEDULE_CHANGE_SUCCESS:
      return {
        ...state,
        requestBookingScheduleChangeInProgress: false,
        requestBookingScheduleChangeSuccess: true,
      };
    case REQUEST_BOOKING_SCHEDULE_CHANGE_ERROR:
      return {
        ...state,
        requestBookingScheduleChangeInProgress: false,
        requestBookingScheduleChangeError: payload,
      };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const setInitialValues = initialValues => ({
  type: SET_INITIAL_VALUES,
  payload: pick(initialValues, Object.keys(initialState)),
});

export const fetchCurrentUserTransactionsRequest = () => ({
  type: FETCH_CURRENT_USER_TRANSACTIONS_REQUEST,
});
export const fetchCurrentUserTransactionsSuccess = transactions => ({
  type: FETCH_CURRENT_USER_TRANSACTIONS_SUCCESS,
  payload: transactions,
});
export const fetchCurrentUserTransactionsError = e => ({
  type: FETCH_CURRENT_USER_TRANSACTIONS_ERROR,
  payload: e,
  error: true,
});

export const fetchTransactionRequest = () => ({
  type: FETCH_TRANSACTION_REQUEST,
});
export const fetchTransactionSuccess = transaction => ({
  type: FETCH_TRANSACTION_SUCCESS,
  payload: transaction,
});
export const fetchTransactionError = e => ({
  type: FETCH_TRANSACTION_ERROR,
  payload: e,
  error: true,
});

export const transitionTransactionRequest = transition => ({
  type: TRANSITION_TRANSACTION_REQUEST,
  payload: transition,
});
export const transitionTransactionSuccess = transaction => ({
  type: TRANSITION_TRANSACTION_SUCCESS,
  payload: transaction,
});
export const transitionTransactionError = e => ({
  type: TRANSITION_TRANSACTION_ERROR,
  payload: e,
  error: true,
});

export const acceptBookingRequest = () => ({
  type: ACCEPT_BOOKING_REQUEST,
});
export const acceptBookingSuccess = () => ({
  type: ACCEPT_BOOKING_SUCCESS,
});
export const acceptBookingError = e => ({
  type: ACCEPT_BOOKING_ERROR,
  payload: e,
  error: true,
});

export const declineBookingRequest = () => ({ type: DECLINE_BOOKING_REQUEST });
export const declineBookingSuccess = () => ({ type: DECLINE_BOOKING_SUCCESS });
export const declineBookingError = e => ({
  type: DECLINE_BOOKING_ERROR,
  error: true,
  payload: e,
});

export const updateBookingEndDateRequest = () => ({ type: UPDATE_BOOKING_END_DATE_REQUEST });
export const updateBookingEndDateSuccess = () => ({ type: UPDATE_BOOKING_END_DATE_SUCCESS });
export const updateBookingEndDateError = e => ({
  type: UPDATE_BOOKING_END_DATE_ERROR,
  error: true,
  payload: e,
});

export const updateBookingScheduleRequest = () => ({ type: UPDATE_BOOKING_SCHEDULE_REQUEST });
export const updateBookingScheduleSuccess = () => ({ type: UPDATE_BOOKING_SCHEDULE_SUCCESS });
export const updateBookingScheduleError = e => ({
  type: UPDATE_BOOKING_SCHEDULE_ERROR,
  error: true,
  payload: e,
});

export const requestBookingScheduleChangeRequest = () => ({
  type: REQUEST_BOOKING_SCHEDULE_CHANGE_REQUEST,
});
export const requestBookingScheduleChangeSuccess = () => ({
  type: REQUEST_BOOKING_SCHEDULE_CHANGE_SUCCESS,
});
export const requestBookingScheduleChangeError = e => ({
  type: REQUEST_BOOKING_SCHEDULE_CHANGE_ERROR,
  error: true,
  payload: e,
});

export const setCurrentTransaction = transaction => ({
  type: SET_CURRENT_TRANSACTION,
  payload: transaction,
});

// ================ Thunks ================ //

export const fetchCurrentUserTransactions = () => (dispatch, getState, sdk) => {
  dispatch(fetchCurrentUserTransactionsRequest());
  return sdk.transactions
    .query({
      lastTransitions: [
        'transition/enquire',
        'transition/request-payment',
        'transition/request-payment-after-enquiry',
        'transition/accept',
      ],
    })
    .then(response => {
      const transactions = response.data.data;
      dispatch(fetchCurrentUserTransactionsSuccess(transactions));
      return transactions;
    })
    .catch(e => {
      log.error(storableError(e), 'fetch-current-user-transactions-failed');
      dispatch(fetchCurrentUserTransactionsError(storableError(e)));
    });
};

export const fetchTransaction = txId => (dispatch, getState, sdk) => {
  dispatch(fetchTransactionRequest());
  return sdk.transactions
    .show({
      id: new UUID(txId),
      include: ['booking', 'customer', 'provider', 'listing'],
    })
    .then(response => {
      const transaction = denormalisedResponseEntities(response)[0];
      dispatch(fetchTransactionSuccess(transaction));
      return transaction;
    })
    .catch(e => {
      log.error(storableError(e), 'fetch-transaction-failed');
      dispatch(fetchTransactionError(storableError(e)));
    });
};

export const transitionTransaction = params => async (dispatch, getState, sdk) => {
  const { transaction, transition, bookingStart, bookingEnd, include } = params;

  const txId = transaction.id.uuid;
  const listing = transaction.listing;
  const listingId = listing.id.uuid;
  const lineItems = transaction.attributes.metadata.lineItems;
  const prevBookedDates = listing.attributes.metadata.bookedDates ?? [];
  const bookingDates = lineItems.reduce((acc, lineItem) => {
    return [...acc, lineItem.date];
  }, []);

  dispatch(transitionTransactionRequest(transition));

  try {
    const transitionResponse = await sdk.transactions.transition(
      {
        id: txId,
        transition,
        params: {
          bookingStart,
          bookingEnd,
        },
      },
      {
        expand: true,
        include,
      }
    );

    const updatedTransaction = denormalisedResponseEntities(transitionResponse)[0];

    if (transition === TRANSITION_ACCEPT_BOOKING) {
      await updateListingMetadata({
        listingId,
        metadata: {
          bookedDates: [...bookingDates, ...prevBookedDates],
        },
      });
    }

    dispatch(transitionTransactionSuccess(updatedTransaction));
  } catch (e) {
    log.error(e, 'transition-transaction-failed');
    dispatch(transitionTransactionError(storableError(e)));
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

    dispatch(fetchTransaction(txId));

    const {
      bookingSchedule = [],
      lineItems = [],
      startDate,
      endDate,
      type,
      exceptions,
    } = transaction.attributes.metadata;
    const txBookedDays = {
      days: bookingSchedule.map(b => b.dayOfWeek),
      startDate,
      endDate,
      txId,
      exceptions,
    };
    const currentBookedDays = transaction.listing.attributes.metadata.bookedDays ?? [];
    const currentBookedDates = transaction.listing.attributes.metadata.bookedDates ?? [];
    const newBookedDays = [...currentBookedDays, txBookedDays];

    const bookingDates = lineItems.map(lineItem => lineItem.date);
    const newBookedDates = [...currentBookedDates, ...bookingDates];

    const newSchedule =
      type === 'recurring' ? { bookedDays: newBookedDays } : { bookedDates: newBookedDates };

    await updateListingMetadata({
      listingId,
      metadata: { ...newSchedule, bookingNumbers: [...bookingNumbers, bookingNumber] },
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
    dispatch(fetchTransaction(txId));
    return;
  } catch (e) {
    log.error(e, 'decline-booking-failed', { txId });
    dispatch(declineBookingError(storableError(e)));
  }
};

export const updateBookingEndDate = (txId, endDate) => async (dispatch, getState, sdk) => {
  dispatch(updateBookingEndDateRequest());

  try {
    const transaction = (
      await sdk.transactions.show({
        id: txId,
        include: ['listing'],
      })
    ).data.data;

    const tenYearsAhead = moment().add(10, 'years');
    const {
      lineItems = [],
      endDate: oldEndDate,
      bookingSchedule,
      exceptions,
    } = transaction.attributes.metadata;

    const endingLineItem = lineItems.find(l => moment(l.date).isSame(endDate, 'day'));

    const formattedEndDate = moment(endDate)
      .startOf('day')
      .format(ISO_OFFSET_FORMAT);
    const newEndDateLater = moment(formattedEndDate).isAfter(oldEndDate || tenYearsAhead);
    const lastTransition = transaction.attributes.lastTransition;
    const isRequest = lastTransition === TRANSITION_REQUEST_BOOKING;
    const needsApproval = !isRequest && newEndDateLater;

    if (
      (lastTransition === TRANSITION_START ||
        lastTransition === TRANSITION_ACTIVE_UPDATE_BOOKING_END) &&
      endingLineItem &&
      !needsApproval
    ) {
      const bookingEnd = addTimeToStartOfDay(formattedEndDate, endingLineItem?.endTime).format(
        ISO_OFFSET_FORMAT
      );
      const bookingStart = moment(bookingEnd)
        .subtract(5, 'minutes')
        .format(ISO_OFFSET_FORMAT);

      // Need to do loop transition to update booking start and end if active
      await transitionPrivileged({
        bodyParams: {
          id: txId,
          transition: TRANSITION_ACTIVE_UPDATE_BOOKING_END,
          params: {
            bookingEnd,
            bookingStart,
            metadata: {
              endDate: formattedEndDate,
            },
          },
        },
      });

      await updateBookedDays({
        txId,
        endDate,
        sdk,
      });

      await sendBookingModifiedNotification({
        txId,
        modification: { endDate: formattedEndDate },
        isRequest: false,
        previousMetadata: {
          endDate: oldEndDate,
          bookingSchedule,
          exceptions,
        },
      });
    } else if (!needsApproval) {
      await updateTransactionMetadata({
        txId,
        metadata: {
          endDate: formattedEndDate,
        },
      });

      // Don't send notification if booking is a request
      if (!isRequest) {
        await updateBookedDays({
          txId,
          endDate,
          sdk,
        });

        await sendBookingModifiedNotification({
          txId,
          modification: { endDate: formattedEndDate },
          isRequest: false,
          previousMetadata: {
            endDate: oldEndDate,
            bookingSchedule,
            exceptions,
          },
        });
      }
    } else {
      // If booking is not a request and end date is later, we need to send request to caregiver
      await sendBookingModifiedNotification({
        txId,
        modification: { endDate: formattedEndDate },
        isRequest: true,
        previousMetadata: {
          endDate: oldEndDate,
          bookingSchedule,
          exceptions,
        },
      });
    }

    dispatch(updateBookingEndDateSuccess());
    return;
  } catch (e) {
    log.error(e, 'update-booking-end-date-failed', { txId });
    dispatch(updateBookingEndDateError(storableError(e)));
  }
};

// Used if employer updates request
export const updateBookingSchedule = (txId, modification) => async (dispatch, getState, sdk) => {
  dispatch(updateBookingScheduleRequest());

  try {
    const transaction = (
      await sdk.transactions.show({
        id: txId,
      })
    ).data.data;

    const {
      bookingSchedule: oldBookingSchedule,
      endDate: oldEndDate,
      exceptions: oldExceptions,
      bookingRate,
      paymentMethodType,
      startDate,
    } = transaction.attributes.metadata;

    const lastTransition = transaction.attributes.lastTransition;

    const isRequest = lastTransition === TRANSITION_REQUEST_BOOKING;

    if (!isRequest) {
      dispatch(fetchBookings());
      throw new Error('Cannot update booking schedule if booking is not a request');
    }

    const bookingSchedule = modification.bookingSchedule || oldBookingSchedule;
    const endDate = modification.endDate || oldEndDate;
    const exceptions = modification.exceptions || oldExceptions;

    const newMetadata = constructBookingMetadataRecurring(
      bookingSchedule,
      startDate,
      endDate,
      bookingRate,
      paymentMethodType,
      exceptions
    );

    await updateTransactionMetadata({
      txId,
      metadata: {
        ...newMetadata,
        exceptions,
        endDate,
      },
    });

    dispatch(updateBookingScheduleSuccess());
  } catch (e) {
    log.error(e, 'update-booking-schedule-failed', { txId });
    dispatch(updateBookingScheduleError(storableError(e)));
  }
};

export const requestBookingScheduleChange = (txId, modification) => async (
  dispatch,
  getState,
  sdk
) => {
  dispatch(requestBookingScheduleChangeRequest());

  try {
    // Fetch new transaction in case old one is stale
    const transaction = (
      await sdk.transactions.show({
        id: txId,
      })
    ).data.data;

    const { endDate: oldEndDate, bookingSchedule, exceptions } = transaction.attributes.metadata;

    await sendBookingModifiedNotification({
      txId,
      modification,
      isRequest: true,
      previousMetadata: {
        endDate: oldEndDate,
        bookingSchedule,
        exceptions,
      },
    });

    dispatch(requestBookingScheduleChangeSuccess());
  } catch (e) {
    log.error(e, 'update-booking-schedule-failed', { txId });
    dispatch(requestBookingScheduleChangeError(storableError(e)));
  }
};
