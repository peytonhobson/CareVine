import pick from 'lodash/pick';
import config from '../../config';
import { types as sdkTypes } from '../../util/sdkLoader';
import { storableError } from '../../util/errors';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import * as log from '../../util/log';
import { TRANSITION_INITIAL_MESSAGE } from '../../util/transaction';
import {
  LISTING_PAGE_DRAFT_VARIANT,
  LISTING_PAGE_PENDING_APPROVAL_VARIANT,
} from '../../util/urlHelpers';
import { fetchCurrentUser } from '../../ducks/user.duck';
import { createResourceLocatorString } from '../../util/routes';
import { v4 as uuidv4 } from 'uuid';
import { updateUserNotifications, transactionLineItems } from '../../util/api';
import { NOTIFICATION_TYPE_NEW_MESSAGE } from '../../util/constants';
import { parse } from '../../util/urlHelpers';
import { findNextBoundary, nextMonthFn, monthIdStringInTimeZone } from '../../util/dates';
import { denormalisedResponseEntities } from '../../util/data';

const { UUID } = sdkTypes;

// ================ Action types ================ //

export const SET_INITIAL_VALUES = 'app/ListingPage/SET_INITIAL_VALUES';
export const SET_ORIGIN = 'app/ListingPage/SET_ORIGIN';

export const SHOW_LISTING_REQUEST = 'app/ListingPage/SHOW_LISTING_REQUEST';
export const SHOW_LISTING_ERROR = 'app/ListingPage/SHOW_LISTING_ERROR';

export const SEND_ENQUIRY_REQUEST = 'app/ListingPage/SEND_ENQUIRY_REQUEST';
export const SEND_ENQUIRY_SUCCESS = 'app/ListingPage/SEND_ENQUIRY_SUCCESS';
export const SEND_ENQUIRY_ERROR = 'app/ListingPage/SEND_ENQUIRY_ERROR';

export const SEND_MESSAGE_REQUEST = 'app/ListingPage/SEND_MESSAGE_REQUEST';
export const SEND_MESSAGE_SUCCESS = 'app/ListingPage/SEND_MESSAGE_SUCCESS';
export const SEND_MESSAGE_ERROR = 'app/ListingPage/SEND_MESSAGE_ERROR';

export const FETCH_EXISTING_CONVERSATION_REQUEST =
  'app/ListingPage/FETCH_EXISTING_CONVERSATION_REQUEST';
export const FETCH_EXISTING_CONVERSATION_SUCCESS =
  'app/ListingPage/FETCH_EXISTING_CONVERSATION_SUCCESS';
export const FETCH_EXISTING_CONVERSATION_ERROR =
  'app/ListingPage/FETCH_EXISTING_CONVERSATION_ERROR';

export const CLOSE_LISTING_REQUEST = 'app/ListingPage/CLOSE_LISTING_REQUEST';
export const CLOSE_LISTING_SUCCESS = 'app/ListingPage/CLOSE_LISTING_SUCCESS';
export const CLOSE_LISTING_ERROR = 'app/ListingPage/CLOSE_LISTING_ERROR';

export const OPEN_LISTING_REQUEST = 'app/ListingPage/OPEN_LISTING_REQUEST';
export const OPEN_LISTING_SUCCESS = 'app/ListingPage/OPEN_LISTING_SUCCESS';
export const OPEN_LISTING_ERROR = 'app/ListingPage/OPEN_LISTING_ERROR';

export const FETCH_TIME_SLOTS_REQUEST = 'app/ListingPage/FETCH_TIME_SLOTS_REQUEST';
export const FETCH_TIME_SLOTS_SUCCESS = 'app/ListingPage/FETCH_TIME_SLOTS_SUCCESS';
export const FETCH_TIME_SLOTS_ERROR = 'app/ListingPage/FETCH_TIME_SLOTS_ERROR';

export const FETCH_LINE_ITEMS_REQUEST = 'app/ListingPage/FETCH_LINE_ITEMS_REQUEST';
export const FETCH_LINE_ITEMS_SUCCESS = 'app/ListingPage/FETCH_LINE_ITEMS_SUCCESS';
export const FETCH_LINE_ITEMS_ERROR = 'app/ListingPage/FETCH_LINE_ITEMS_ERROR';

// ================ Reducer ================ //

const initialState = {
  id: null,
  showListingError: null,
  sendEnquiryInProgress: false,
  sendEnquiryError: null,
  sendMessageInProgress: false,
  sendMessageError: null,
  fetchExistingConversationInProgress: false,
  fetchExistingConversationError: null,
  existingConversation: null,
  closeListingInProgress: false,
  closeListingError: null,
  openListingInProgress: false,
  openListingError: null,
  origin: null,
  timeSlots: null,
  monthlyTimeSlots: {
    // '2019-12': {
    //   timeSlots: [],
    //   fetchTimeSlotsError: null,
    //   fetchTimeSlotsInProgress: null,
    // },
  },
  lineItems: null,
  fetchLineItemsInProgress: false,
  fetchLineItemsError: null,
};

const listingPageReducer = (state = initialState, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case SET_INITIAL_VALUES:
      return { ...initialState, ...payload };
    case SET_ORIGIN:
      return { ...state, origin: payload };

    case SHOW_LISTING_REQUEST:
      return { ...state, id: payload.id, showListingError: null };
    case SHOW_LISTING_ERROR:
      return { ...state, showListingError: payload };

    case SEND_ENQUIRY_REQUEST:
      return { ...state, sendEnquiryInProgress: true, sendEnquiryError: null };
    case SEND_ENQUIRY_SUCCESS:
      return { ...state, sendEnquiryInProgress: false };
    case SEND_ENQUIRY_ERROR:
      return { ...state, sendEnquiryInProgress: false, sendEnquiryError: payload };

    case SEND_MESSAGE_REQUEST:
      return { ...state, sendMessageInProgress: true, sendMessageError: null };
    case SEND_MESSAGE_SUCCESS:
      return { ...state, sendMessageInProgress: false };
    case SEND_MESSAGE_ERROR:
      return { ...state, sendMessageInProgress: false, sendMessageError: payload };

    case FETCH_EXISTING_CONVERSATION_REQUEST:
      return {
        ...state,
        fetchExistingConversationInProgress: true,
        fetchExistingConversationError: null,
      };
    case FETCH_EXISTING_CONVERSATION_SUCCESS:
      return {
        ...state,
        fetchExistingConversationInProgress: false,
        existingConversation: payload,
      };
    case FETCH_EXISTING_CONVERSATION_ERROR:
      return {
        ...state,
        fetchExistingConversationInProgress: false,
        fetchExistingConversationError: payload,
      };

    case CLOSE_LISTING_REQUEST:
      return { ...state, closeListingInProgress: true, closeListingError: null };
    case CLOSE_LISTING_SUCCESS:
      return { ...state, closeListingInProgress: false };
    case CLOSE_LISTING_ERROR:
      return { ...state, closeListingInProgress: false, closeListingError: payload };

    case OPEN_LISTING_REQUEST:
      return { ...state, openListingInProgress: true, openListingError: null };
    case OPEN_LISTING_SUCCESS:
      return { ...state, openListingInProgress: false };
    case OPEN_LISTING_ERROR:
      return { ...state, openListingInProgress: false, openListingError: payload };

    case FETCH_TIME_SLOTS_REQUEST: {
      const monthlyTimeSlots = {
        ...state.monthlyTimeSlots,
        [payload]: {
          ...state.monthlyTimeSlots[payload],
          fetchTimeSlotsError: null,
          fetchTimeSlotsInProgress: true,
        },
      };
      return { ...state, monthlyTimeSlots };
    }
    case FETCH_TIME_SLOTS_SUCCESS: {
      const monthId = payload.monthId;
      const monthlyTimeSlots = {
        ...state.monthlyTimeSlots,
        [monthId]: {
          ...state.monthlyTimeSlots[monthId],
          fetchTimeSlotsInProgress: false,
          timeSlots: payload.timeSlots,
        },
      };
      return { ...state, monthlyTimeSlots };
    }
    case FETCH_TIME_SLOTS_ERROR: {
      const monthId = payload.monthId;
      const monthlyTimeSlots = {
        ...state.monthlyTimeSlots,
        [monthId]: {
          ...state.monthlyTimeSlots[monthId],
          fetchTimeSlotsInProgress: false,
          fetchTimeSlotsError: payload.error,
        },
      };
      return { ...state, monthlyTimeSlots };
    }

    case FETCH_LINE_ITEMS_REQUEST:
      return { ...state, fetchLineItemsInProgress: true, fetchLineItemsError: null };
    case FETCH_LINE_ITEMS_SUCCESS:
      return { ...state, fetchLineItemsInProgress: false, lineItems: payload };
    case FETCH_LINE_ITEMS_ERROR:
      return { ...state, fetchLineItemsInProgress: false, fetchLineItemsError: payload };

    default:
      return state;
  }
};

export default listingPageReducer;

// ================ Action creators ================ //

export const setInitialValues = initialValues => ({
  type: SET_INITIAL_VALUES,
  payload: pick(initialValues, Object.keys(initialState)),
});

export const setOrigin = origin => ({
  type: SET_ORIGIN,
  payload: origin,
});

export const showListingRequest = id => ({
  type: SHOW_LISTING_REQUEST,
  payload: { id },
});

export const showListingError = e => ({
  type: SHOW_LISTING_ERROR,
  error: true,
  payload: e,
});

export const sendEnquiryRequest = () => ({ type: SEND_ENQUIRY_REQUEST });
export const sendEnquirySuccess = () => ({ type: SEND_ENQUIRY_SUCCESS });
export const sendEnquiryError = e => ({ type: SEND_ENQUIRY_ERROR, error: true, payload: e });

export const sendMessageRequest = () => ({ type: SEND_MESSAGE_REQUEST });
export const sendMessageSuccess = () => ({ type: SEND_MESSAGE_SUCCESS });
export const sendMessageError = e => ({ type: SEND_MESSAGE_ERROR, error: true, payload: e });

export const fetchExistingConversationRequest = () => ({
  type: FETCH_EXISTING_CONVERSATION_REQUEST,
});
export const fetchExistingConversationSuccess = conversation => ({
  type: FETCH_EXISTING_CONVERSATION_SUCCESS,
  payload: conversation,
});
export const fetchExistingConversationError = e => ({
  type: FETCH_EXISTING_CONVERSATION_ERROR,
  error: true,
  payload: e,
});

export const closeListingRequest = () => ({ type: CLOSE_LISTING_REQUEST });
export const closeListingSuccess = () => ({ type: CLOSE_LISTING_SUCCESS });
export const closeListingError = e => ({ type: CLOSE_LISTING_ERROR, error: true, payload: e });

export const openListingRequest = () => ({ type: OPEN_LISTING_REQUEST });
export const openListingSuccess = () => ({ type: OPEN_LISTING_SUCCESS });
export const openListingError = e => ({ type: OPEN_LISTING_ERROR, error: true, payload: e });

export const fetchTimeSlotsRequest = monthId => ({
  type: FETCH_TIME_SLOTS_REQUEST,
  payload: monthId,
});
export const fetchTimeSlotsSuccess = (monthId, timeSlots) => ({
  type: FETCH_TIME_SLOTS_SUCCESS,
  payload: { timeSlots, monthId },
});
export const fetchTimeSlotsError = (monthId, error) => ({
  type: FETCH_TIME_SLOTS_ERROR,
  error: true,
  payload: { monthId, error },
});

export const fetchLineItemsRequest = () => ({ type: FETCH_LINE_ITEMS_REQUEST });
export const fetchLineItemsSuccess = lineItems => ({
  type: FETCH_LINE_ITEMS_SUCCESS,
  payload: lineItems,
});
export const fetchLineItemsError = error => ({
  type: FETCH_LINE_ITEMS_ERROR,
  error: true,
  payload: error,
});

export const fetchTransactionLineItems = ({ bookingData, listingId, isOwnListing }) => dispatch => {
  dispatch(fetchLineItemsRequest());
  transactionLineItems({ bookingData, listingId, isOwnListing })
    .then(response => {
      const lineItems = response.data;
      dispatch(fetchLineItemsSuccess(lineItems));
    })
    .catch(e => {
      dispatch(fetchLineItemsError(storableError(e)));
      log.error(e, 'fetching-line-items-failed', {
        listingId: listingId.uuid,
        bookingData: bookingData,
      });
    });
};

// ================ Thunks ================ //

export const showListing = (listingId, isOwn = false) => (dispatch, getState, sdk) => {
  dispatch(showListingRequest(listingId));
  dispatch(fetchCurrentUser());
  const params = {
    id: listingId,
    include: ['author', 'author.profileImage'],
    'fields.image': [
      // Avatars
      'variants.square-small',
      'variants.square-small2x',
    ],
  };

  const show = isOwn ? sdk.ownListings.show(params) : sdk.listings.show(params);

  return show
    .then(response => {
      dispatch(addMarketplaceEntities(response));
      return response;
    })
    .catch(e => {
      dispatch(showListingError(storableError(e)));
    });
};

export const sendEnquiry = (listing, message, history, routes) => async (
  dispatch,
  getState,
  sdk
) => {
  dispatch(sendEnquiryRequest());

  const listingId = listing.id.uuid;

  const bodyParams = {
    transition: TRANSITION_INITIAL_MESSAGE,
    processAlias: config.messageProcessAlias,
    params: { listingId },
  };

  try {
    const response = await sdk.transactions.initiate(bodyParams);

    const transactionId = response.data.data.id;

    await sdk.messages.send({ transactionId, content: message });

    history.push(
      createResourceLocatorString('InboxPageWithId', routes, { id: transactionId.uuid })
    );

    const senderName = getState().user.currentUser.attributes.profile.displayName;
    const newNotification = {
      id: uuidv4(),
      type: NOTIFICATION_TYPE_NEW_MESSAGE,
      createdAt: new Date().getTime(),
      read: false,
      metadata: {
        senderName,
        conversationId: transactionId.uuid,
      },
    };
    const otherUserId = listing.author.id.uuid;

    updateUserNotifications({ userId: otherUserId, newNotification });

    dispatch(sendEnquirySuccess());
  } catch (e) {
    log.error(e, 'send-enquiry-failed', { listingId: listingId.uuid, message });
    dispatch(sendEnquiryError(storableError(e)));
  }
};

export const sendMessage = (txId, message) => async (dispatch, getState, sdk) => {
  dispatch(sendMessageRequest());

  try {
    await sdk.messages.send({ transactionId: txId, content: message });

    dispatch(sendMessageSuccess());
  } catch (e) {
    log.error(e, 'send-message-failed', { txId, message });
    dispatch(sendMessageError(storableError(e)));
  }
};

export const fetchExistingConversation = (listingId, otherUserId) => async (
  dispatch,
  getState,
  sdk
) => {
  dispatch(fetchExistingConversationRequest());

  let authorId = otherUserId;

  if (!authorId) {
    try {
      const response = await sdk.listings.show({
        id: listingId,
        include: ['author'],
        'fields.user': ['id'],
      });
      const user = response.data?.data?.relationships?.author?.data;
      authorId = user?.id?.uuid;
    } catch (e) {
      log.error(e, 'fetch-existing-conversation-author-failed', { listingId, otherUserId });
      dispatch(fetchExistingConversationError(storableError(e)));
    }
  }

  const params = {
    lastTransitions: [TRANSITION_INITIAL_MESSAGE],
    include: ['provider', 'customer'],
    userId: authorId,
  };

  try {
    const response = await sdk.transactions.query(params);
    const tx = response.data.data.length > 0 && response.data.data[0];
    dispatch(fetchExistingConversationSuccess(tx));
  } catch (e) {
    log.error(e, 'fetch-existing-conversation-failed', { listingId, otherUserId });
    dispatch(fetchExistingConversationError(storableError(e)));
  }
};

export const closeListing = listingId => (dispatch, getState, sdk) => {
  dispatch(closeListingRequest());

  sdk.ownListings
    .close(
      {
        id: listingId,
      },
      {
        expand: true,
      }
    )
    .then(response => {
      dispatch(closeListingSuccess());
      dispatch(showListing(listingId));
    })
    .catch(e => {
      log.error(e, 'close-listing-failed', { listingId });
      dispatch(closeListingError(storableError(e)));
    });
};

export const openListing = listingId => (dispatch, getState, sdk) => {
  dispatch(openListingRequest());

  sdk.ownListings
    .open(
      {
        id: listingId,
      },
      {
        expand: true,
      }
    )
    .then(response => {
      dispatch(openListingSuccess());
      dispatch(showListing(listingId));
    })
    .catch(e => {
      log.error(e, 'open-listing-failed', { listingId });
      dispatch(openListingError(storableError(e)));
    });
};

const timeSlotsRequest = params => (dispatch, getState, sdk) => {
  return sdk.timeslots.query(params).then(response => {
    return denormalisedResponseEntities(response);
  });
};

export const fetchTimeSlots = (listingId, start, end, timeZone) => (dispatch, getState, sdk) => {
  const monthId = monthIdStringInTimeZone(start, timeZone);

  dispatch(fetchTimeSlotsRequest(monthId));

  // The maximum pagination page size for timeSlots is 500
  const extraParams = {
    per_page: 500,
    page: 1,
  };

  return dispatch(timeSlotsRequest({ listingId, start, end, ...extraParams }))
    .then(timeSlots => {
      dispatch(fetchTimeSlotsSuccess(monthId, timeSlots));
    })
    .catch(e => {
      dispatch(fetchTimeSlotsError(monthId, storableError(e)));
    });
};

const fetchMonthlyTimeSlots = (dispatch, listing) => {
  const hasWindow = typeof window !== 'undefined';
  const attributes = listing.attributes;
  // Listing could be ownListing entity too, so we just check if attributes key exists
  const hasTimeZone =
    attributes && attributes.availabilityPlan && attributes.availabilityPlan.timezone;

  // Fetch time-zones on client side only.
  if (hasWindow && listing.id && hasTimeZone) {
    const tz = listing.attributes.availabilityPlan.timezone;
    const nextBoundary = findNextBoundary(tz, new Date());

    const nextMonth = nextMonthFn(nextBoundary, tz);
    const nextAfterNextMonth = nextMonthFn(nextMonth, tz);

    return Promise.all([
      dispatch(fetchTimeSlots(listing.id, nextBoundary, nextMonth, tz)),
      dispatch(fetchTimeSlots(listing.id, nextMonth, nextAfterNextMonth, tz)),
    ]);
  }

  // By default return an empty array
  return Promise.all([]);
};

export const loadData = (params, search) => (dispatch, getState, sdk) => {
  const listingId = new UUID(params.id);

  const queryParams = parse(search, {
    latlng: ['origin'],
  });

  const { origin, ...rest } = queryParams;

  const ownListingVariants = [LISTING_PAGE_DRAFT_VARIANT, LISTING_PAGE_PENDING_APPROVAL_VARIANT];
  if (ownListingVariants.includes(params.variant)) {
    return dispatch(showListing(listingId, true));
  }

  const currentUser = getState().user.currentUser;

  return Promise.all([
    dispatch(showListing(listingId)),
    currentUser?.id && dispatch(fetchExistingConversation(listingId)),
    dispatch(setOrigin(origin)),
  ]).then(responses => {
    if (responses[0] && responses[0].data && responses[0].data.data) {
      const listing = responses[0].data.data;

      // Fetch timeSlots.
      // This can happen parallel to loadData.
      // We are not interested to return them from loadData call.
      fetchMonthlyTimeSlots(dispatch, listing);
    }
    return responses;
  });
};
