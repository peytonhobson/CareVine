import reverse from 'lodash/reverse';
import sortBy from 'lodash/sortBy';
import { storableError } from '../../util/errors';
import { parse } from '../../util/urlHelpers';
import {
  TRANSITION_INITIAL_MESSAGE,
  TRANSITION_REQUEST_PAYMENT,
  TRANSITION_CUSTOMER_DELETE_CONVERSATION,
  TRANSITION_PROVIDER_DELETE_CONVERSATION,
} from '../../util/transaction';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { denormalisedResponseEntities, userDisplayNameAsString } from '../../util/data';
import { types as sdkTypes } from '../../util/sdkLoader';
import pick from 'lodash/pick';
import pickBy from 'lodash/pickBy';
import isEmpty from 'lodash/isEmpty';
import queryString from 'query-string';
import * as log from '../../util/log';
import { v4 as uuidv4 } from 'uuid';
import { updateUserNotifications, updateUser, sendgridTemplateEmail } from '../../util/api';
import config from '../../config';
import { NOTIFICATION_TYPE_PAYMENT_REQUESTED } from '../../util/constants';

const MESSAGES_PAGE_SIZE = 10;
const { UUID } = sdkTypes;

export const sortedTransactions = txs =>
  reverse(
    sortBy(txs, tx => {
      return tx.attributes ? tx.attributes.lastTransitionedAt : null;
    })
  );

// ================ Action types ================ //

export const SET_INITIAL_VALUES = 'app/InboxPage/SET_INITIAL_VALUES';

export const FETCH_MESSAGES_REQUEST = 'app/InboxPage/FETCH_MESSAGES_REQUEST';
export const FETCH_MESSAGES_SUCCESS = 'app/InboxPage/FETCH_MESSAGES_SUCCESS';
export const FETCH_MESSAGES_ERROR = 'app/InboxPage/FETCH_MESSAGES_ERROR';

export const FETCH_LAST_MESSAGES_REQUEST = 'app/InboxPage/FETCH_LAST_MESSAGES_REQUEST';
export const FETCH_LAST_MESSAGES_SUCCESS = 'app/InboxPage/FETCH_LAST_MESSAGES_SUCCESS';
export const FETCH_LAST_MESSAGES_ERROR = 'app/InboxPage/FETCH_LAST_MESSAGES_ERROR';

export const SEND_MESSAGE_REQUEST = 'app/InboxPage/SEND_MESSAGE_REQUEST';
export const SEND_MESSAGE_SUCCESS = 'app/InboxPage/SEND_MESSAGE_SUCCESS';
export const SEND_MESSAGE_ERROR = 'app/InboxPage/SEND_MESSAGE_ERROR';

export const FETCH_OTHER_USER_LISTING_REQUEST = 'app/InboxPage/FETCH_OTHER_USER_LISTING_REQUEST';
export const FETCH_OTHER_USER_LISTING_SUCCESS = 'app/InboxPage/FETCH_OTHER_USER_LISTING_SUCCESS';
export const FETCH_OTHER_USER_LISTING_ERROR = 'app/InboxPage/FETCH_OTHER_USER_LISTING_ERROR';

export const FETCH_INITIAL_CONVERSATIONS_REQUEST =
  'app/InboxPage/FETCH_INITIAL_CONVERSATIONS_REQUEST';
export const FETCH_INITIAL_CONVERSATIONS_SUCCESS =
  'app/InboxPage/FETCH_INITIAL_CONVERSATIONS_SUCCESS';
export const FETCH_INITIAL_CONVERSATIONS_ERROR = 'app/InboxPage/FETCH_INITIAL_CONVERSATIONS_ERROR';

export const FETCH_CONVERSATIONS_REQUEST = 'app/InboxPage/FETCH_CONVERSATIONS_REQUEST';
export const FETCH_CONVERSATIONS_SUCCESS = 'app/InboxPage/FETCH_CONVERSATIONS_SUCCESS';
export const FETCH_CONVERSATIONS_ERROR = 'app/InboxPage/FETCH_CONVERSATIONS_ERROR';

export const SEND_REQUEST_FOR_PAYMENT_REQUEST =
  'app/StripePaymentModal/SEND_REQUEST_FOR_PAYMENT_REQUEST';
export const SEND_REQUEST_FOR_PAYMENT_SUCCESS =
  'app/StripePaymentModal/SEND_REQUEST_FOR_PAYMENT_SUCCESS';
export const SEND_REQUEST_FOR_PAYMENT_ERROR =
  'app/StripePaymentModal/SEND_REQUEST_FOR_PAYMENT_ERROR';

export const TRANSITION_TO_REQUEST_PAYMENT_REQUEST =
  'app/InboxPage/TRANSITION_TO_REQUEST_PAYMENT_REQUEST';
export const TRANSITION_TO_REQUEST_PAYMENT_SUCCESS =
  'app/InboxPage/TRANSITION_TO_REQUEST_PAYMENT_SUCCESS';
export const TRANSITION_TO_REQUEST_PAYMENT_ERROR =
  'app/InboxPage/TRANSITION_TO_REQUEST_PAYMENT_ERROR';

export const DELETE_CONVERSATION_REQUEST = 'app/InboxPage/DELETE_CONVERSATION_REQUEST';
export const DELETE_CONVERSATION_SUCCESS = 'app/InboxPage/DELETE_CONVERSATION_SUCCESS';
export const DELETE_CONVERSATION_ERROR = 'app/InboxPage/DELETE_CONVERSATION_ERROR';

export const CLEAR_MESSAGES_SUCCESS = 'app/InboxPage/CLEAR_MESSAGES_SUCCESS';

// ================ Reducer ================ //

const entityRefs = entities =>
  entities.map(entity => ({
    id: entity.id,
    type: entity.type,
  }));

const initialState = {
  pagination: null,
  transactionRefs: [],
  fetchMessagesInProgress: false,
  fetchMessagesError: null,
  totalMessages: new Map(),
  totalMessagePages: new Map(),
  oldestMessagePageFetched: new Map(),
  messages: new Map(),
  initialMessageFailedToTransaction: null,
  sendMessageInProgress: false,
  sendMessageError: null,
  otherUserListing: null,
  fetchOtherUserListingInProgress: false,
  fetchOtherUserListingError: false,
  fetchConversationsInProgress: false,
  fetchConversationsError: null,
  fetchInitialConversationsInProgress: false,
  fetchInitialConversationsError: null,
  sendRequestForPaymentError: null,
  sendRequestForPaymentInProgress: false,
  sendRequestForPaymentSuccess: false,
  transitionToRequestPaymentError: null,
  transitionToRequestPaymentInProgress: false,
  transitionToRequestPaymentSuccess: false,
  deleteConversationInProgress: false,
  deleteConversationError: null,
};

const mergeEntityArrays = (a, b) => {
  return a.filter(aEntity => !b.find(bEntity => aEntity.id.uuid === bEntity.id.uuid)).concat(b);
};

export default function checkoutPageReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case SET_INITIAL_VALUES:
      return { ...initialState, ...payload };

    case FETCH_MESSAGES_REQUEST:
      return { ...state, fetchMessagesInProgress: true, fetchMessagesError: null };
    case FETCH_MESSAGES_SUCCESS: {
      const oldestMessagePageFetched =
        state.oldestMessagePageFetched.get(payload.txId) > payload.page
          ? state.oldestMessagePageFetched.get(payload.txId)
          : payload.page;
      const oldestMessagePageFetchedMap = state.oldestMessagePageFetched;
      oldestMessagePageFetchedMap.set(payload.txId, oldestMessagePageFetched);

      const oldMessages = state.messages;
      const currentTransactionMessages = oldMessages.get(payload.txId) || [];
      oldMessages.set(
        payload.txId,
        mergeEntityArrays(currentTransactionMessages, payload.messages)
      );

      const oldTotalPagesMap = state.totalMessagePages;
      oldTotalPagesMap.set(payload.txId, payload.totalPages);

      const oldTotalMessagesMap = state.totalMessages;
      oldTotalMessagesMap.set(payload.txId, payload.totalItems);

      return {
        ...state,
        fetchMessagesInProgress: false,
        messages: oldMessages,
        totalMessages: oldTotalMessagesMap,
        totalMessagePages: oldTotalPagesMap,
        oldestMessagePageFetchedMap,
      };
    }
    case FETCH_MESSAGES_ERROR:
      return { ...state, fetchMessagesInProgress: false, fetchMessagesError: payload };
    case SEND_MESSAGE_REQUEST:
      return {
        ...state,
        sendMessageInProgress: true,
        sendMessageError: null,
        initialMessageFailedToTransaction: null,
      };
    case SEND_MESSAGE_SUCCESS:
      return { ...state, sendMessageInProgress: false };
    case SEND_MESSAGE_ERROR:
      return { ...state, sendMessageInProgress: false, sendMessageError: payload };
    case CLEAR_MESSAGES_SUCCESS:
      return { ...state, messages: [] };
    case FETCH_OTHER_USER_LISTING_REQUEST:
      return { ...state, fetchOtherUserListingInProgress: true, fetchOtherUserListingError: false };
    case FETCH_OTHER_USER_LISTING_SUCCESS:
      return {
        ...state,
        otherUserListing: payload,
        fetchOtherUserListingInProgress: false,
      };
    case FETCH_OTHER_USER_LISTING_ERROR:
      return {
        ...state,
        fetchOtherUserListingProgress: false,
        fetchOtherUserListingError: payload,
      };

    case FETCH_CONVERSATIONS_REQUEST:
      return {
        ...state,
        fetchConversationsInProgress: true,
        fetchConversationsError: null,
        fetchInitialConversationsError: null,
      };
    case FETCH_CONVERSATIONS_SUCCESS:
      return {
        ...state,
        transactionRefs: entityRefs(payload.data.data),
        fetchConversationsInProgress: false,
      };
    case FETCH_CONVERSATIONS_ERROR:
      return {
        ...state,
        fetchConversationsInProgress: false,
        fetchConversationsError: payload,
      };

    case FETCH_INITIAL_CONVERSATIONS_REQUEST:
      return {
        ...state,
        fetchInitialConversationsInProgress: true,
        fetchInitialConversationsError: null,
      };
    case FETCH_INITIAL_CONVERSATIONS_SUCCESS:
      return {
        ...state,
        transactionRefs: entityRefs(payload.data.data),
        fetchInitialConversationsInProgress: false,
      };
    case FETCH_INITIAL_CONVERSATIONS_ERROR:
      return {
        ...state,
        fetchInitialConversationsInProgress: false,
        fetchInitialConversationsError: payload,
      };

    case SEND_REQUEST_FOR_PAYMENT_REQUEST:
      return {
        ...state,
        sendRequestForPaymentInProgress: true,
        sendRequestForPaymentError: null,
        sendRequestForPaymentSuccess: false,
      };
    case SEND_REQUEST_FOR_PAYMENT_SUCCESS:
      return {
        ...state,
        sendRequestForPaymentInProgress: false,
        sendRequestForPaymentSuccess: payload,
      };
    case SEND_REQUEST_FOR_PAYMENT_ERROR:
      return {
        ...state,
        sendRequestForPaymentInProgress: false,
        sendRequestForPaymentError: payload,
      };

    case TRANSITION_TO_REQUEST_PAYMENT_REQUEST:
      return {
        ...state,
        transitionToRequestPaymentInProgress: true,
        transitionToRequestPaymentError: null,
      };
    case TRANSITION_TO_REQUEST_PAYMENT_SUCCESS:
      return {
        ...state,
        transitionToRequestPaymentSuccess: true,
        transitionToRequestPaymentInProgress: false,
      };
    case TRANSITION_TO_REQUEST_PAYMENT_ERROR:
      return {
        ...state,
        transitionToRequestPaymentInProgress: false,
        transitionToRequestPaymentError: payload,
      };

    case DELETE_CONVERSATION_REQUEST:
      return {
        ...state,
        deleteConversationInProgress: true,
        deleteConversationError: null,
      };
    case DELETE_CONVERSATION_SUCCESS:
      return {
        ...state,
        deleteConversationInProgress: false,
      };
    case DELETE_CONVERSATION_ERROR:
      return {
        ...state,
        deleteConversationInProgress: false,
        deleteConversationError: payload,
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

const fetchMessagesRequest = () => ({ type: FETCH_MESSAGES_REQUEST });
const fetchMessagesSuccess = (txId, messages, pagination) => ({
  type: FETCH_MESSAGES_SUCCESS,
  payload: { txId, messages, ...pagination },
});
const fetchMessagesError = e => ({ type: FETCH_MESSAGES_ERROR, error: true, payload: e });

const sendMessageRequest = () => ({ type: SEND_MESSAGE_REQUEST });
const sendMessageSuccess = () => ({ type: SEND_MESSAGE_SUCCESS });
const sendMessageError = e => ({ type: SEND_MESSAGE_ERROR, error: true, payload: e });

const clearMessagesSuccess = () => ({ type: CLEAR_MESSAGES_SUCCESS });

const fetchOtherUserListingRequest = () => ({ type: FETCH_OTHER_USER_LISTING_REQUEST });
const fetchOtherUserListingSuccess = response => ({
  type: FETCH_OTHER_USER_LISTING_SUCCESS,
  payload: response[0],
});
const fetchOtherUserListingError = e => ({
  type: FETCH_OTHER_USER_LISTING_ERROR,
  error: true,
  payload: e,
});

const fetchInitialConversationsRequest = () => ({ type: FETCH_INITIAL_CONVERSATIONS_REQUEST });
const fetchInitialConversationsSuccess = response => ({
  type: FETCH_INITIAL_CONVERSATIONS_SUCCESS,
  payload: response,
});
const fetchInitialConversationsError = e => ({
  type: FETCH_INITIAL_CONVERSATIONS_ERROR,
  error: true,
  payload: e,
});

const fetchConversationsRequest = () => ({ type: FETCH_CONVERSATIONS_REQUEST });
const fetchConversationsSuccess = response => ({
  type: FETCH_CONVERSATIONS_SUCCESS,
  payload: response,
});
const fetchConversationsError = e => ({
  type: FETCH_CONVERSATIONS_ERROR,
  error: true,
  payload: e,
});

export const sendRequestForPaymentRequest = () => ({
  type: SEND_REQUEST_FOR_PAYMENT_REQUEST,
});
export const sendRequestForPaymentSuccess = payload => ({
  type: SEND_REQUEST_FOR_PAYMENT_SUCCESS,
  payload,
});
export const sendRequestForPaymentError = e => ({
  type: SEND_REQUEST_FOR_PAYMENT_ERROR,
  error: true,
  payload: e,
});

export const transitionToRequestPaymentRequest = () => ({
  type: TRANSITION_TO_REQUEST_PAYMENT_REQUEST,
});
export const transitionToRequestPaymentSuccess = () => ({
  type: TRANSITION_TO_REQUEST_PAYMENT_SUCCESS,
});
export const transitionToRequestPaymentError = e => ({
  type: TRANSITION_TO_REQUEST_PAYMENT_ERROR,
  error: true,
  payload: e,
});

export const deleteConversationRequest = () => ({ type: DELETE_CONVERSATION_REQUEST });
export const deleteConversationSuccess = () => ({ type: DELETE_CONVERSATION_SUCCESS });
export const deleteConversationError = e => ({
  type: DELETE_CONVERSATION_ERROR,
  error: true,
  payload: e,
});

// ================ Thunks ================ //

const INBOX_PAGE_SIZE = 10;

const fetchMessages = (txId, page) => (dispatch, getState, sdk) => {
  const paging = { page, per_page: MESSAGES_PAGE_SIZE };
  dispatch(fetchMessagesRequest());
  return txId.uuid !== ''
    ? sdk.messages
        .query({
          transaction_id: txId,
          include: ['sender', 'sender.profileImage'],
          ...IMAGE_VARIANTS,
          ...paging,
        })
        .then(response => {
          const messages = denormalisedResponseEntities(response);
          const { totalItems, totalPages, page: fetchedPage } = response.data.meta;
          const pagination = { totalItems, totalPages, page: fetchedPage };
          const totalMessages = getState().InboxPage.totalMessages.get(txId.uuid);

          // Original fetchMessages call succeeded
          dispatch(fetchMessagesSuccess(txId.uuid, messages, pagination));

          // Check if totalItems has changed between fetched pagination pages
          // if totalItems has changed, fetch first page again to include new incoming messages.
          // TODO if there're more than 100 incoming messages,
          // this should loop through most recent pages instead of fetching just the first one.
          if (totalItems > totalMessages && page > 1) {
            dispatch(fetchMessages(txId, 1))
              .then(() => {
                // Original fetch was enough as a response for user action,
                // this just includes new incoming messages
              })
              .catch(() => {
                // Background update, no need to to do anything atm.
              });
          }
        })
        .catch(e => {
          dispatch(fetchMessagesError(storableError(e)));
          throw e;
        })
    : null;
};

export const fetchMoreMessages = txId => (dispatch, getState, sdk) => {
  const state = getState();
  const { oldestMessagePageFetched, totalMessagePages } = state.InboxPage;
  const hasMoreOldMessages =
    totalMessagePages.get(txId.uuid) > oldestMessagePageFetched.get(txId.uuid);

  // In case there're no more old pages left we default to fetching the current cursor position
  const nextPage = hasMoreOldMessages
    ? oldestMessagePageFetched.get(txId.uuid) + 1
    : oldestMessagePageFetched.get(txId.uuid);

  return dispatch(fetchMessages(txId, nextPage));
};

export const sendMessage = (tx, message) => async (dispatch, getState, sdk) => {
  dispatch(sendMessageRequest());

  const txId = tx.id;

  let receiverId = null;

  try {
    const messageId = (await sdk.messages.send({ transactionId: txId, content: message })).data.data
      ?.id;

    if (!messageId) return;

    const sendWebsocketMessage = getState().TopbarContainer.sendWebsocketMessage;

    if (sendWebsocketMessage) {
      const currentUserId = getState().user.currentUser?.id?.uuid;
      receiverId =
        currentUserId === tx.customer.id.uuid ? tx.provider.id.uuid : tx.customer.id.uuid;
      await sendWebsocketMessage(
        JSON.stringify({
          type: 'message/sent',
          receiverId,
        })
      );
    }
    // We fetch the first page again to add sent message to the page data
    // and update possible incoming messages too.
    // TODO if there're more than 100 incoming messages,
    // this should loop through most recent pages instead of fetching just the first one.
    dispatch(fetchMessages(txId, 1));
    dispatch(sendMessageSuccess());
  } catch (e) {
    dispatch(sendMessageError(storableError(e)));
    // Rethrow so the page can track whether the sending failed, and
    // keep the message in the form for a retry.
    throw e;
  }

  if (receiverId) {
    try {
      const messagesResponse = await sdk.messages.query({
        transactionId: txId,
        perPage: 2,
        page: 1,
        include: ['sender'],
        'fields.message': ['createdAt'],
        'fields.user': ['profile.displayName'],
      });

      const messages = denormalisedResponseEntities(messagesResponse);

      const lastMessage = messages[messages.length - 1];

      const lastMessageMoreThan1HourAgo =
        new Date().getTime() - new Date(lastMessage.attributes.createdAt).getTime() >
        1000 * 60 * 60;

      const previewMessage = message.length > 160 ? `${message.substring(0, 160)}...` : message;

      if (lastMessageMoreThan1HourAgo) {
        await sendgridTemplateEmail({
          receiverId,
          templateData: {
            marketplaceUrl: process.env.REACT_APP_CANONICAL_ROOT_URL,
            message: previewMessage,
            senderName: lastMessage.sender.attributes.profile.displayName,
            txId: txId?.uuid,
          },
          templateName: 'new-message',
        });
      }
    } catch (err) {
      log.error(e, 'send-new-message-notification-failed', { txId, message });
    }
  }
};

export const clearMessages = () => (dispatch, getState, sdk) => {
  dispatch(clearMessagesSuccess());
};

export const fetchOtherUserListing = userId => (dispatch, getState, sdk) => {
  dispatch(fetchOtherUserListingRequest());

  return sdk.listings
    .query({ authorId: userId })
    .then(response => {
      dispatch(fetchOtherUserListingSuccess(response.data.data));
    })
    .catch(e => {
      dispatch(fetchOtherUserListingError(e));
      throw e;
    });
};

export const sendRequestForPayment = (
  currentUser,
  conversationId,
  otherUserListing,
  otherUser,
  amount
) => async (dispatch, getState, sdk) => {
  dispatch(sendRequestForPaymentRequest());

  const senderName = userDisplayNameAsString(currentUser);
  const userId = otherUser.id.uuid;
  const notificationId = uuidv4();
  const newNotification = {
    id: notificationId,
    type: NOTIFICATION_TYPE_PAYMENT_REQUESTED,
    createdAt: new Date().getTime(),
    isRead: false,
    metadata: {
      senderName,
      conversationId,
      senderId: currentUser.id.uuid,
      amount,
    },
  };

  try {
    await updateUserNotifications({
      userId,
      newNotification,
    });

    const currentTime = new Date().getTime();
    const oldRequestsForPayment =
      currentUser.attributes.profile.privateData?.sentRequestsForPayment?.filter(
        o => o.createdAt > currentTime - 1000 * 60 * 60 * 24
      ) || [];

    const newSentRequestsForPayment = [
      ...oldRequestsForPayment,
      { userId, createdAt: currentTime },
    ];

    await updateUser({
      userId: currentUser.id.uuid,
      privateData: {
        sentRequestsForPayment: newSentRequestsForPayment,
      },
    });

    dispatch(sendRequestForPaymentSuccess(otherUser?.id?.uuid));
    dispatch(transitionToRequestPayment(otherUserListing, notificationId));
  } catch (e) {
    log.error(e, 'send-request-for-payment-failed');
    dispatch(sendRequestForPaymentError(e));
  }
};

export const transitionToRequestPayment = (otherUserListing, notificationId) => (
  dispatch,
  getState,
  sdk
) => {
  dispatch(transitionToRequestPaymentRequest());

  const listingId = otherUserListing?.id?.uuid;

  const bodyParams = {
    transition: TRANSITION_REQUEST_PAYMENT,
    processAlias: config.singleActionProcessAlias,
    params: { listingId, protectedData: { notificationId } },
  };
  return sdk.transactions
    .initiate(bodyParams)
    .then(response => {
      dispatch(transitionToRequestPaymentSuccess());
      return response;
    })
    .catch(e => {
      log.error(e, 'transition-to-request-payment-failed');
      dispatch(transitionToRequestPaymentError(storableError(e)));
      throw e;
    });
};

export const deleteConversation = (tx, currentUser) => async (dispatch, getState, sdk) => {
  dispatch(deleteConversationRequest());

  const { provider } = tx;
  const isProvider = currentUser.id?.uuid === provider?.id?.uuid;

  try {
    await sdk.transactions.transition({
      id: tx.id.uuid,
      transition: isProvider
        ? TRANSITION_PROVIDER_DELETE_CONVERSATION
        : TRANSITION_CUSTOMER_DELETE_CONVERSATION,
      params: {},
    });

    dispatch(deleteConversationSuccess());
    dispatch(loadData());
  } catch (e) {
    log.error(e, 'delete-conversation-failed');
    dispatch(deleteConversationError(e));
  }
};

const IMAGE_VARIANTS = {
  'fields.image': [
    // Profile images
    'variants.square-small',
    'variants.square-small2x',

    // Listing images:
    'variants.landscape-crop',
    'variants.landscape-crop2x',
  ],
};

export const fetchConversations = () => async (dispatch, getState, sdk) => {
  dispatch(fetchConversationsRequest());

  const apiQueryParams = {
    lastTransitions: TRANSITION_INITIAL_MESSAGE,
    include: ['provider', 'provider.profileImage', 'customer', 'customer.profileImage', 'messages'],
    'fields.transaction': ['lastTransitionedAt', 'metadata'],
    'fields.message': ['createdAt'],
    'limit.messages': MESSAGES_PAGE_SIZE,
    ...IMAGE_VARIANTS,
  };

  try {
    const response = await sdk.transactions.query(apiQueryParams);

    dispatch(addMarketplaceEntities(response));
    dispatch(fetchConversationsSuccess(response));

    response.data.data.forEach(transaction => {
      dispatch(fetchMessages(transaction.id, 1));
    });
  } catch (e) {
    log.error(e, 'fetch-conversations-failed');
    dispatch(fetchConversationsError(storableError(e)));
  }
};

const isNonEmpty = value => {
  return typeof value === 'object' || Array.isArray(value) ? !isEmpty(value) : !!value;
};

export const loadData = (params, search) => (dispatch, getState, sdk) => {
  const txId = new UUID(queryString.parse(search).id);
  const state = getState().InboxPage;
  let txRef = null;
  txRef = state.transactionRefs.find(ref => ref.id === txId);

  const initialValues = txRef ? {} : pickBy(state, isNonEmpty);
  dispatch(setInitialValues(initialValues));

  dispatch(fetchInitialConversationsRequest());

  const { page = 1 } = parse(search);

  const apiQueryParams = {
    lastTransitions: TRANSITION_INITIAL_MESSAGE,
    include: ['provider', 'provider.profileImage', 'customer', 'customer.profileImage', 'messages'],
    'fields.transaction': ['lastTransitionedAt', 'metadata'],
    'fields.message': ['createdAt'],
    'limit.messages': MESSAGES_PAGE_SIZE,
    ...IMAGE_VARIANTS,
  };

  return sdk.transactions
    .query(apiQueryParams)
    .then(response => {
      dispatch(addMarketplaceEntities(response));
      dispatch(fetchInitialConversationsSuccess(response));
      return response;
    })
    .then(response => {
      response.data.data.forEach(transaction => {
        dispatch(fetchMessages(transaction.id, 1));
      });
    })
    .catch(e => {
      log.error(e, 'inbox-page-load-data-failed', {});
      dispatch(fetchInitialConversationsError(storableError(e)));
    });
};
