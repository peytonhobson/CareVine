import { fetchCurrentUser } from '../../ducks/user.duck';
import { storableError } from '../../util/errors';
import * as log from '../../util/log';

// ================ Action types ================ //

export const FETCH_SENDER_LISTING_REQUEST = 'app/NotificationsPage/FETCH_SENDER_LISTING_REQUEST';
export const FETCH_SENDER_LISTING_SUCCESS = 'app/NotificationsPage/FETCH_SENDER_LISTING_SUCCESS';
export const FETCH_SENDER_LISTING_ERROR = 'app/NotificationsPage/FETCH_SENDER_LISTING_ERROR';

export const DELETE_NOTIFICATION_REQUEST = 'app/NotificationsPage/DELETE_NOTIFICATION_REQUEST';
export const DELETE_NOTIFICATION_SUCCESS = 'app/NotificationsPage/DELETE_NOTIFICATION_SUCCESS';
export const DELETE_NOTIFICATION_ERROR = 'app/NotificationsPage/DELETE_NOTIFICATION_ERROR';

// ================ Reducer ================ //

const entityRefs = entities =>
  entities.map(entity => ({
    id: entity.id,
    type: entity.type,
  }));

const initialState = {
  senderListing: null,
  sender: null,
  fetchSenderListingInProgress: false,
  fetchSenderListingError: null,
  deleteNotificationInProgress: false,
  deleteNotificationError: null,
};

export default function checkoutPageReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case FETCH_SENDER_LISTING_REQUEST:
      return {
        ...state,
        fetchSenderListingInProgress: true,
        fetchSenderListingError: null,
      };
    case FETCH_SENDER_LISTING_SUCCESS:
      return {
        ...state,
        fetchSenderListingInProgress: false,
        fetchSenderListingError: null,
        senderListing: payload.listing,
        sender: payload.user,
      };
    case FETCH_SENDER_LISTING_ERROR:
      return {
        ...state,
        fetchSenderListingInProgress: false,
        fetchSenderListingError: payload,
      };

    case DELETE_NOTIFICATION_REQUEST:
      return {
        ...state,
        deleteNotificationInProgress: true,
        deleteNotificationError: null,
      };
    case DELETE_NOTIFICATION_SUCCESS:
      return {
        ...state,
        deleteNotificationInProgress: false,
      };
    case DELETE_NOTIFICATION_ERROR:
      return {
        ...state,
        deleteNotificationInProgress: false,
        deleteNotificationError: payload,
      };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const fetchSenderListingRequest = () => ({
  type: FETCH_SENDER_LISTING_REQUEST,
});
export const fetchSenderListingSuccess = payload => ({
  type: FETCH_SENDER_LISTING_SUCCESS,
  payload,
});
export const fetchSenderListingError = e => ({
  type: FETCH_SENDER_LISTING_ERROR,
  error: true,
  payload: e,
});

export const deleteNotificationRequest = () => ({
  type: DELETE_NOTIFICATION_REQUEST,
});
export const deleteNotificationSuccess = () => ({
  type: DELETE_NOTIFICATION_SUCCESS,
});
export const deleteNotificationError = e => ({
  type: DELETE_NOTIFICATION_ERROR,
  error: true,
  payload: e,
});

// ================ Thunks ================ //

export const fetchSenderListing = id => async (dispatch, getState, sdk) => {
  dispatch(fetchSenderListingRequest());

  try {
    const listingResponse = await sdk.listings.query({
      authorId: id,
      include: ['author', 'author.profileImage'],
    });

    dispatch(
      fetchSenderListingSuccess({
        listing: listingResponse.data.data[0],
        user: listingResponse.data.included[0],
      })
    );
  } catch (e) {
    log.error(e, 'fetch-sender-listing-failed');
    dispatch(fetchSenderListingError(storableError(e)));
  }
};

export const deleteNotification = (notificationId, currentUser) => async (
  dispatch,
  getState,
  sdk
) => {
  dispatch(deleteNotificationRequest());

  const oldNotifications = currentUser?.attributes.profile.privateData.notifications;

  const newNotifications = oldNotifications?.filter(
    notification => notification.id !== notificationId
  );

  try {
    await sdk.currentUser.updateProfile({
      privateData: { notifications: newNotifications },
    });

    dispatch(fetchCurrentUser());
    dispatch(deleteNotificationSuccess());
  } catch (e) {
    log.error(e, 'failed-to-delete-notification');
    dispatch(deleteNotificationError(storableError(e)));
  }
};

export const loadData = (dispatch, getState, sdk) => {
  return fetchCurrentUser();
};
