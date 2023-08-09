import { ensureTransaction } from './data';

/**
 * Transitions
 *
 * These strings must sync with values defined in Flex API,
 * since transaction objects given by API contain info about last transitions.
 * All the actions in API side happen in transitions,
 * so we need to understand what those strings mean.
 */

// Single Action Process Transitions
export const TRANSITION_REQUEST_PAYMENT = 'transition/request-payment';
export const TRANSITION_NOTIFY_FOR_PAYMENT = 'transition/notify-for-payment';

// Messaging Process Transitions
export const TRANSITION_INITIAL_MESSAGE = 'transition/initial-message';
export const TRANSITION_CUSTOMER_DELETE_CONVERSATION = 'transition/customer-delete-conversation';
export const TRANSITION_PROVIDER_DELETE_CONVERSATION = 'transition/provider-delete-conversation';

// Booking Process Transitions
export const TRANSITION_REQUEST_BOOKING = 'transition/request-booking';
export const TRANSITION_DECLINE_BOOKING = 'transition/decline';
export const TRANSITION_EXPIRE_BOOKING = 'transition/expire';
export const TRANSITION_ACCEPT_BOOKING = 'transition/accept';
export const TRANSITION_CANCEL_BOOKING_REQUEST = 'transition/cancel-request';
export const TRANSITION_CANCEL_ACCEPTED_BOOKING_CUSTOMER =
  'transition/cancel-accepted-booking-customer';
export const TRANSITION_CANCEL_ACCEPTED_BOOKING_PROVIDER =
  'transition/cancel-accepted-booking-provider';
export const TRANSITION_CANCEL_ACCEPTED_BOOKING_OPERATOR =
  'transition/cancel-accepted-booking-operator';
export const TRANSITION_CHARGE = 'transition/charge';
export const TRANSITION_CANCEL_CHARGED_BOOKING_CUSTOMER =
  'transition/cancel-charged-booking-customer';
export const TRANSITION_CANCEL_CHARGED_BOOKING_PROVIDER =
  'transition/cancel-charged-booking-provider';
export const TRANSITION_CANCEL_CHARGED_BOOKING_OPERATOR =
  'transition/cancel-charged-booking-operator';
export const TRANSITION_START = 'transition/start';
export const TRANSITION_START_UPDATE_TIMES = 'transition/start-update-times';
export const TRANSITION_CANCEL_ACTIVE_BOOKING_CUSTOMER =
  'transition/cancel-active-booking-customer';
export const TRANSITION_CANCEL_ACTIVE_BOOKING_PROVIDER =
  'transition/cancel-active-booking-provider';
export const TRANSITION_CANCEL_ACTIVE_BOOKING_OPERATOR =
  'transition/cancel-active-booking-operator';
export const TRANSITION_COMPLETE_CANCELED = 'transition/complete-canceled';
export const TRANSITION_COMPLETE = 'transition/complete';
export const TRANSITION_PAY_CAREGIVER = 'transition/pay-caregiver';
export const TRANSITION_DISPUTE = 'transition/dispute';
export const TRANSITION_RESOLVE_DISPUTE = 'transition/resolve-dispute';
export const TRANSITION_MAKE_REVIEWABLE = 'transition/make-reviewable';
export const TRANSITION_REVIEW = 'transition/review';
export const TRANSITION_EXPIRE_REVIEW_PERIOD = 'transition/expire-review-period';
export const TRANSITION_DECLINE_PAYMENT = 'transition/decline-payment';
export const TRANSITION_CANCEL_PAY_CAREGIVER = 'transition/cancel-pay-caregiver';

/**
 * Actors
 *
 * There are 4 different actors that might initiate transitions:
 */

// Roles of actors that perform transaction transitions
export const TX_TRANSITION_ACTOR_CUSTOMER = 'customer';
export const TX_TRANSITION_ACTOR_PROVIDER = 'provider';
export const TX_TRANSITION_ACTOR_SYSTEM = 'system';
export const TX_TRANSITION_ACTOR_OPERATOR = 'operator';

export const TX_TRANSITION_ACTORS = [
  TX_TRANSITION_ACTOR_CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER,
  TX_TRANSITION_ACTOR_SYSTEM,
  TX_TRANSITION_ACTOR_OPERATOR,
];

export const STATE_INITIAL = 'initial';
export const STATE_BOOKING_REQUESTED = 'booking-requested';
export const STATE_ACCEPTED = 'accepted';
export const STATE_DECLINED = 'declined';
export const STATE_CANCELED = 'canceled';
export const STATE_CHARGED = 'charged';
export const STATE_ACTIVE = 'active';
export const STATE_DELIVERED = 'delivered';
export const STATE_PAID_OUT = 'paid-out';
export const STATE_DISPUTE_REVIEW = 'dispute-review';
export const STATE_REVIEWABLE = 'reviewable';
export const STATE_REVIEWED = 'reviewed';
export const STATE_PAYMENT_FAILED = 'payment-failed';
export const STATE_ACTIVE_CANCELED = 'active-canceled';
export const STATE_CANCELED_PAID_OUT = 'canceled-paid-out';
export const STATE_REQUEST_CANCELED = 'request-canceled';

const STATE_NOTIFIED_FOR_PAYMENT = 'notified-for-payment';
const STATE_PAYMENT_CONFIRMED = 'payment-confirmed';
const STATE_PAYMENT_REQUESTED = 'payment-requested';

/**
 * Description of transaction process
 *
 * You should keep this in sync with transaction process defined in Marketplace API
 *
 * Note: we don't use yet any state machine library,
 *       but this description format is following Xstate (FSM library)
 *       https://xstate.js.org/docs/
 */
const stateDescriptionSingle = {
  // id is defined only to support Xstate format.
  // However if you have multiple transaction processes defined,
  // it is best to keep them in sync with transaction process aliases.
  // id: 'instant-care-payment-process/release-8',

  // This 'initial' state is a starting point for new transaction
  initial: STATE_INITIAL,

  // States
  states: {
    [STATE_INITIAL]: {
      on: {
        [TRANSITION_NOTIFY_FOR_PAYMENT]: STATE_NOTIFIED_FOR_PAYMENT,
        [TRANSITION_REQUEST_PAYMENT]: STATE_PAYMENT_REQUESTED,
      },
    },
  },
};

const stateDescription = {
  // id is defined only to support Xstate format.
  // However if you have multiple transaction processes defined,
  // it is best to keep them in sync with transaction process aliases.
  id: 'booking-process/active',

  // This 'initial' state is a starting point for new transaction
  initial: STATE_INITIAL,

  // States
  states: {
    [STATE_INITIAL]: {
      on: {
        [TRANSITION_REQUEST_BOOKING]: STATE_BOOKING_REQUESTED,
      },
    },
    [STATE_BOOKING_REQUESTED]: {
      on: {
        [TRANSITION_ACCEPT_BOOKING]: STATE_ACCEPTED,
        [TRANSITION_DECLINE_BOOKING]: STATE_DECLINED,
        [TRANSITION_EXPIRE_BOOKING]: STATE_DECLINED,
        [TRANSITION_CANCEL_BOOKING_REQUEST]: STATE_REQUEST_CANCELED,
      },
    },
    [STATE_ACCEPTED]: {
      on: {
        [TRANSITION_CANCEL_ACCEPTED_BOOKING_CUSTOMER]: STATE_CANCELED,
        [TRANSITION_CANCEL_ACCEPTED_BOOKING_PROVIDER]: STATE_CANCELED,
        [TRANSITION_CANCEL_ACCEPTED_BOOKING_OPERATOR]: STATE_CANCELED,
        [TRANSITION_CHARGE]: STATE_CHARGED,
        [TRANSITION_DECLINE_PAYMENT]: STATE_PAYMENT_FAILED,
      },
    },
    [STATE_CHARGED]: {
      on: {
        [TRANSITION_CANCEL_CHARGED_BOOKING_CUSTOMER]: STATE_CANCELED,
        [TRANSITION_CANCEL_CHARGED_BOOKING_PROVIDER]: STATE_CANCELED,
        [TRANSITION_CANCEL_CHARGED_BOOKING_OPERATOR]: STATE_CANCELED,
        [TRANSITION_START]: STATE_ACTIVE,
      },
    },
    [STATE_ACTIVE]: {
      on: {
        [TRANSITION_CANCEL_ACTIVE_BOOKING_CUSTOMER]: STATE_ACTIVE_CANCELED,
        [TRANSITION_CANCEL_ACTIVE_BOOKING_PROVIDER]: STATE_ACTIVE_CANCELED,
        [TRANSITION_CANCEL_ACTIVE_BOOKING_OPERATOR]: STATE_ACTIVE_CANCELED,
        [TRANSITION_COMPLETE]: STATE_DELIVERED,
      },
    },
    [STATE_CANCELED]: {
      on: {
        [TRANSITION_CANCEL_PAY_CAREGIVER]: STATE_CANCELED_PAID_OUT,
      },
    },
    [STATE_ACTIVE_CANCELED]: {
      on: {
        [TRANSITION_COMPLETE_CANCELED]: STATE_DELIVERED,
      },
    },
    [STATE_DELIVERED]: {
      on: {
        [TRANSITION_PAY_CAREGIVER]: STATE_PAID_OUT,
        [TRANSITION_DISPUTE]: STATE_DISPUTE_REVIEW,
      },
    },
    [STATE_DISPUTE_REVIEW]: {
      on: {
        [TRANSITION_RESOLVE_DISPUTE]: STATE_PAID_OUT,
      },
    },
    [STATE_PAID_OUT]: {
      on: {
        [TRANSITION_MAKE_REVIEWABLE]: STATE_REVIEWABLE,
      },
    },
    [STATE_REVIEWABLE]: {
      on: {
        [TRANSITION_REVIEW]: STATE_REVIEWED,
        [TRANSITION_EXPIRE_REVIEW_PERIOD]: STATE_REVIEWED,
      },
    },
    [STATE_DECLINED]: { type: 'final' },
    [STATE_REVIEWED]: { type: 'final' },
    [STATE_PAYMENT_FAILED]: { type: 'final' },
    [STATE_CANCELED_PAID_OUT]: { type: 'final' },
    [STATE_REQUEST_CANCELED]: { type: 'final' },
  },
};

// Note: currently we assume that state description doesn't contain nested states.
const statesFromStateDescription = description => description.states || {};

// Get all the transitions from states object in an array
const getTransitions = states => {
  const stateNames = Object.keys(states);

  const transitionsReducer = (transitionArray, name) => {
    const stateTransitions = states[name] && states[name].on;
    const transitionKeys = stateTransitions ? Object.keys(stateTransitions) : [];
    return [
      ...transitionArray,
      ...transitionKeys.map(key => ({ key, value: stateTransitions[key] })),
    ];
  };

  return stateNames.reduce(transitionsReducer, []);
};

// This is a list of all the transitions that this app should be able to handle.
export const TRANSITIONS = getTransitions(statesFromStateDescription(stateDescription)).map(
  t => t.key
);

// This function returns a function that has given stateDesc in scope chain.
const getTransitionsToStateFn = stateDesc => state =>
  getTransitions(statesFromStateDescription(stateDesc))
    .filter(t => t.value === state)
    .map(t => t.key);

// Get all the transitions that lead to specified state.
const getTransitionsToState = getTransitionsToStateFn(stateDescription);

// This is needed to fetch transactions that need response from provider.
// I.e. transactions which provider needs to accept or decline
export const transitionsToRequested = getTransitionsToState(STATE_DELIVERED);

/**
 * Helper functions to figure out if transaction is in a specific state.
 * State is based on lastTransition given by transaction object and state description.
 */

const txLastTransition = tx => ensureTransaction(tx).attributes.lastTransition;

export const txIsEnquired = tx =>
  getTransitionsToState(STATE_ENQUIRY).includes(txLastTransition(tx));

export const txIsPaymentPending = tx =>
  getTransitionsToState(STATE_PAYMENT_PENDING).includes(txLastTransition(tx));

export const txIsPaymentExpired = tx =>
  getTransitionsToState(STATE_PAYMENT_EXPIRED).includes(txLastTransition(tx));

// Note: state name used in Marketplace API docs (and here) is actually preauthorized
// However, word "requested" is used in many places so that we decided to keep it.
export const txIsRequested = tx =>
  getTransitionsToState(STATE_PREAUTHORIZED).includes(txLastTransition(tx));

export const txIsAccepted = tx =>
  getTransitionsToState(STATE_ACCEPTED).includes(txLastTransition(tx));

export const txIsDeclined = tx =>
  getTransitionsToState(STATE_DECLINED).includes(txLastTransition(tx));

export const txIsCanceled = tx =>
  getTransitionsToState(STATE_CANCELED).includes(txLastTransition(tx));

export const txIsDelivered = tx =>
  getTransitionsToState(STATE_DELIVERED).includes(txLastTransition(tx));

const firstReviewTransitions = [...getTransitionsToState(STATE_REVIEWED)];
export const txIsInFirstReview = tx => firstReviewTransitions.includes(txLastTransition(tx));

export const txIsReviewed = tx =>
  getTransitionsToState(STATE_REVIEWED).includes(txLastTransition(tx));

/**
 * Helper functions to figure out if transaction has passed a given state.
 * This is based on transitions history given by transaction object.
 */

const txTransitions = tx => ensureTransaction(tx).attributes.transitions || [];
const hasPassedTransition = (transitionName, tx) =>
  !!txTransitions(tx).find(t => t.transition === transitionName);

const hasPassedStateFn = state => tx =>
  getTransitionsToState(state).filter(t => hasPassedTransition(t, tx)).length > 0;

export const txHasBeenAccepted = hasPassedStateFn(STATE_ACCEPTED);
export const txHasBeenDelivered = hasPassedStateFn(STATE_DELIVERED);

/**
 * Other transaction related utility functions
 */

export const transitionIsReviewed = transition =>
  getTransitionsToState(STATE_REVIEWED).includes(transition);

export const transitionIsFirstReviewedBy = (transition, isCustomer) =>
  isCustomer ? getTransitionsToState(STATE_REVIEWED).includes(transition) : null;

export const getUserTxRole = (currentUserId, transaction) => {
  const tx = ensureTransaction(transaction);
  const customer = tx.customer;
  if (currentUserId && currentUserId.uuid && tx.id && customer.id) {
    // user can be either customer or provider
    return currentUserId.uuid === customer.id.uuid
      ? TX_TRANSITION_ACTOR_CUSTOMER
      : TX_TRANSITION_ACTOR_PROVIDER;
  } else {
    throw new Error(`Parameters for "userIsCustomer" function were wrong.
      currentUserId: ${currentUserId}, transaction: ${transaction}`);
  }
};

export const txRoleIsProvider = userRole => userRole === TX_TRANSITION_ACTOR_PROVIDER;
export const txRoleIsCustomer = userRole => userRole === TX_TRANSITION_ACTOR_CUSTOMER;
