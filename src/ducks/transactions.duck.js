import pick from 'lodash/pick';
import { storableError } from '../util/errors';
import * as log from '../util/log';
import { types as sdkTypes } from '../util/sdkLoader';
import { TRANSITION_ACCEPT_BOOKING, TRANSITION_DECLINE_BOOKING } from '../util/transaction';
import { updateListingMetadata, transitionPrivileged } from '../util/api';
import { fetchCurrentUser } from './user.duck';
import { denormalisedResponseEntities } from '../util/data';
const { UUID } = sdkTypes;

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
};

export default function payoutMethodsPageReducer(state = initialState, action = {}) {
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
      };
    case ACCEPT_BOOKING_ERROR:
      return {
        ...state,
        acceptBookingInProgress: false,
        acceptBookingError: payload,
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
