import { fetchCurrentUser } from '../../ducks/user.duck';
import { storableError } from '../../util/errors';
import {
  TRANSITION_ACCEPT_BOOKING,
  TRANSITION_ACCEPT_UPDATE_START,
  TRANSITION_ACTIVE_UPDATE_BOOKING_END,
  TRANSITION_START,
  TRANSITION_UPDATE_NEXT_WEEK_START,
  TRANSITION_WNFW_UPDATE_START,
} from '../../util/transaction';
import {
  sendBookingModifiedNotificationResponse,
  transitionPrivileged,
  updateTransactionMetadata,
} from '../../util/api';
import { addTimeToStartOfDay } from '../../util/dates';
import moment from 'moment';
import { ISO_OFFSET_FORMAT } from '../../util/constants';
import * as log from '../../util/log';
import { constructBookingMetadataRecurring, updateBookedDays } from '../../util/bookings';

// ================ Action types ================ //

export const FETCH_SENDER_LISTING_REQUEST = 'app/NotificationsPage/FETCH_SENDER_LISTING_REQUEST';
export const FETCH_SENDER_LISTING_SUCCESS = 'app/NotificationsPage/FETCH_SENDER_LISTING_SUCCESS';
export const FETCH_SENDER_LISTING_ERROR = 'app/NotificationsPage/FETCH_SENDER_LISTING_ERROR';

export const DELETE_NOTIFICATION_REQUEST = 'app/NotificationsPage/DELETE_NOTIFICATION_REQUEST';
export const DELETE_NOTIFICATION_SUCCESS = 'app/NotificationsPage/DELETE_NOTIFICATION_SUCCESS';
export const DELETE_NOTIFICATION_ERROR = 'app/NotificationsPage/DELETE_NOTIFICATION_ERROR';

export const ACCEPT_BOOKING_MODIFICATION_REQUEST =
  'app/NotificationsPage/ACCEPT_BOOKING_MODIFICATION_REQUEST';
export const ACCEPT_BOOKING_MODIFICATION_SUCCESS =
  'app/NotificationsPage/ACCEPT_BOOKING_MODIFICATION_SUCCESS';
export const ACCEPT_BOOKING_MODIFICATION_ERROR =
  'app/NotificationsPage/ACCEPT_BOOKING_MODIFICATION_ERROR';

export const DECLINE_BOOKING_MODIFICATION_REQUEST =
  'app/NotificationsPage/DECLINE_BOOKING_MODIFICATION_REQUEST';
export const DECLINE_BOOKING_MODIFICATION_SUCCESS =
  'app/NotificationsPage/DECLINE_BOOKING_MODIFICATION_SUCCESS';
export const DECLINE_BOOKING_MODIFICATION_ERROR =
  'app/NotificationsPage/DECLINE_BOOKING_MODIFICATION_ERROR';

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
  acceptBookingModificationInProgress: false,
  acceptBookingModificationError: null,
  declineBookingModificationInProgress: false,
  declineBookingModificationError: null,
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

    case ACCEPT_BOOKING_MODIFICATION_REQUEST:
      return {
        ...state,
        acceptBookingModificationInProgress: true,
        acceptBookingModificationError: null,
      };
    case ACCEPT_BOOKING_MODIFICATION_SUCCESS:
      return {
        ...state,
        acceptBookingModificationInProgress: false,
      };
    case ACCEPT_BOOKING_MODIFICATION_ERROR:
      return {
        ...state,
        acceptBookingModificationInProgress: false,
        acceptBookingModificationError: payload,
      };

    case DECLINE_BOOKING_MODIFICATION_REQUEST:
      return {
        ...state,
        declineBookingModificationInProgress: true,
        declineBookingModificationError: null,
      };
    case DECLINE_BOOKING_MODIFICATION_SUCCESS:
      return {
        ...state,
        declineBookingModificationInProgress: false,
      };
    case DECLINE_BOOKING_MODIFICATION_ERROR:
      return {
        ...state,
        declineBookingModificationInProgress: false,
        declineBookingModificationError: payload,
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

export const acceptBookingModificationRequest = () => ({
  type: ACCEPT_BOOKING_MODIFICATION_REQUEST,
});
export const acceptBookingModificationSuccess = () => ({
  type: ACCEPT_BOOKING_MODIFICATION_SUCCESS,
});
export const acceptBookingModificationError = e => ({
  type: ACCEPT_BOOKING_MODIFICATION_ERROR,
  error: true,
  payload: e,
});

export const declineBookingModificationRequest = () => ({
  type: DECLINE_BOOKING_MODIFICATION_REQUEST,
});
export const declineBookingModificationSuccess = () => ({
  type: DECLINE_BOOKING_MODIFICATION_SUCCESS,
});
export const declineBookingModificationError = e => ({
  type: DECLINE_BOOKING_MODIFICATION_ERROR,
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

const acceptEndDateModification = async (transaction, modification, sdk) => {
  const txId = transaction.id.uuid;

  const { lineItems = [] } = transaction.attributes.metadata;
  const endDate = modification.endDate;

  const endingLineItem = lineItems.find(l => moment(l.date).isSame(endDate, 'day'));

  const formattedEndDate = moment(endDate)
    .startOf('day')
    .format(ISO_OFFSET_FORMAT);

  if (
    (transaction.attributes.lastTransition === TRANSITION_START ||
      transaction.attributes.lastTransition === TRANSITION_ACTIVE_UPDATE_BOOKING_END) &&
    endingLineItem
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
  } else {
    await updateTransactionMetadata({
      txId,
      metadata: {
        endDate: formattedEndDate,
      },
    });
  }

  await updateBookedDays({
    txId,
    endDate,
    sdk,
  });
};

const acceptBookingScheduleModification = async (transaction, modification, appliedDate, sdk) => {
  const txId = transaction.id.uuid;

  const {
    lineItems = [],
    endDate: oldEndDate,
    exceptions: oldExceptions,
    paymentMethodType,
    bookingRate,
    startDate,
  } = transaction.attributes.metadata;
  const nextWeek = lineItems?.[0]?.date;
  const lastTransition = transaction.attributes.lastTransition;

  // If last transition is heading into a new week and we haven't been charged for that week,
  // then we need to update the bookingStart because the applied date will occur at the next week/start time.
  // In the case of the accepted booking, the appliedDate is the startdate
  const isAccepted =
    lastTransition === TRANSITION_ACCEPT_BOOKING ||
    lastTransition === TRANSITION_ACCEPT_UPDATE_START;
  const needsTimeUpdate =
    ((lastTransition === TRANSITION_UPDATE_NEXT_WEEK_START ||
      lastTransition === TRANSITION_WNFW_UPDATE_START) &&
      moment(appliedDate).isSame(nextWeek, 'week')) ||
    isAccepted;

  const bookingSchedule = modification.bookingSchedule;
  const endDate = modification.endDate || oldEndDate;
  const exceptions = modification.exceptions || oldExceptions;

  if (needsTimeUpdate) {
    const newMetadata = constructBookingMetadataRecurring(
      bookingSchedule,
      isAccepted
        ? startDate
        : moment(nextWeek)
            .startOf('week')
            .format(ISO_OFFSET_FORMAT),
      endDate,
      bookingRate,
      paymentMethodType,
      exceptions
    );

    const newLineItems = newMetadata.lineItems.sort((a, b) => moment(a).diff(b));
    const bookingStart = addTimeToStartOfDay(
      newLineItems[0].date,
      newLineItems[0].startTime
    ).format(ISO_OFFSET_FORMAT);
    const bookingEnd = moment(bookingStart)
      .add(5, 'minutes')
      .format(ISO_OFFSET_FORMAT);

    console.log(bookingStart);
    console.log('newMetadata2', newMetadata);
    console.log(TRANSITION_ACCEPT_UPDATE_START);

    await transitionPrivileged({
      bodyParams: {
        id: txId,
        transition: isAccepted ? TRANSITION_ACCEPT_UPDATE_START : TRANSITION_WNFW_UPDATE_START,
        params: {
          bookingEnd,
          bookingStart,
          metadata: {
            ...newMetadata,
            exceptions,
          },
        },
      },
    });

    await updateBookedDays({
      txId,
      bookingSchedule,
      exceptions,
      endDate,
      sdk,
    });
  } else {
    // Update end date and exceptions now because they occur in the future and won't affect the current booking
    updateTransactionMetadata({
      txId,
      metadata: {
        endDate,
        exceptions,
        bookingScheduleChange: {
          bookingSchedule,
          appliedDate,
        },
      },
    });

    await updateBookedDays({
      txId,
      exceptions,
      endDate,
      sdk,
    });
  }
};

export const acceptBookingModification = notification => async (dispatch, getState, sdk) => {
  dispatch(acceptBookingModificationRequest());

  const {
    modification,
    txId,
    previousMetadata,
    modifyBookingTxId,
    appliedDate,
  } = notification.metadata;
  const modificationTypes = Object.keys(modification);

  try {
    const transaction = (
      await sdk.transactions.show({ id: txId, include: ['customer', 'provider'] })
    ).data.data;

    // TODO: add logic for other modifications here

    if (modificationTypes.includes('bookingSchedule')) {
      await acceptBookingScheduleModification(transaction, modification, appliedDate, sdk);
    } else if (modificationTypes.length === 1 && modificationTypes.includes('exceptions')) {
      // TODO: Add here
    } else if (modificationTypes.includes('endDate')) {
      await acceptEndDateModification(transaction, modification, sdk);
    }

    const currentUser = getState().user.currentUser;
    const oldNotifications = currentUser?.attributes.profile.privateData.notifications || [];

    const newNotifications = oldNotifications.map(n => {
      if (n.id === notification.id) {
        return {
          ...n,
          metadata: {
            ...n.metadata,
            accepted: true,
          },
        };
      }
      return n;
    });

    // Update caregiver notification to be accepted
    await sdk.currentUser.updateProfile({
      privateData: { notifications: newNotifications },
    });

    await sendBookingModifiedNotificationResponse({
      txId,
      modification,
      previousMetadata,
      isAccepted: true,
      modifyBookingTxId,
    });

    dispatch(fetchCurrentUser());
    dispatch(acceptBookingModificationSuccess());
  } catch (e) {
    log.error(e, 'accept-booking-modification-failed');
    dispatch(acceptBookingModificationError(storableError(e)));
  }
};

export const declineBookingModification = notification => async (dispatch, getState, sdk) => {
  dispatch(declineBookingModificationRequest());

  const currentUser = getState().user.currentUser;
  const oldNotifications = currentUser?.attributes.profile.privateData.notifications || [];

  const newNotifications = oldNotifications.map(n => {
    if (n.id === notification.id) {
      return {
        ...n,
        metadata: {
          ...n.metadata,
          declined: true,
        },
      };
    }
    return n;
  });

  try {
    // Update caregiver notification to be declined
    await sdk.currentUser.updateProfile({
      privateData: { notifications: newNotifications },
    });

    const { txId, modification, previousMetadata, modifyBookingTxId } = notification.metadata;
    await sendBookingModifiedNotificationResponse({
      txId,
      modification,
      previousMetadata,
      isAccepted: false,
      modifyBookingTxId,
    });

    dispatch(fetchCurrentUser());
    dispatch(declineBookingModificationSuccess());
  } catch (e) {
    log.error(e, 'decline-booking-modification-failed');
    dispatch(declineBookingModificationError(storableError(e)));
  }
};

export const loadData = () => {
  return fetchCurrentUser();
};
