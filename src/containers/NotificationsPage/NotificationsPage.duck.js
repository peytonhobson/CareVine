import pick from 'lodash/pick';
import SendbirdChat from '@sendbird/chat';
import { GroupChannelModule } from '@sendbird/chat/groupChannel';

import { storableError } from '../../util/errors';
import { TRANSITION_REQUEST_PAYMENT } from '../../util/transaction';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import * as log from '../../util/log';
import config from '../../config';
import { fetchCurrentUser } from '../../ducks/user.duck';
import { updateUserNotifications } from '../../util/api';
import { userDisplayNameAsString } from '../../util/data';
import { NOTIFICATION_TYPE_PAYMENT_REQUESTED } from '../../util/constants';
import { v4 as uuidv4 } from 'uuid';

// ================ Action types ================ //

export const FETCH_SENDER_LISTING_REQUEST = 'app/NotificationsPage/FETCH_SENDER_LISTING_REQUEST';
export const FETCH_SENDER_LISTING_SUCCESS = 'app/NotificationsPage/FETCH_SENDER_LISTING_SUCCESS';
export const FETCH_SENDER_LISTING_ERROR = 'app/NotificationsPage/FETCH_SENDER_LISTING_ERROR';

// ================ Reducer ================ //

const initialState = {
  senderListing: null,
  sender: null,
  fetchSenderListingInProgress: false,
  fetchSenderListingError: null,
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
        senderListing: payload.data,
        sender: payload.included[0],
      };
    case FETCH_SENDER_LISTING_ERROR:
      return {
        ...state,
        fetchSenderListingInProgress: false,
        fetchSenderListingError: payload,
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

// ================ Thunks ================ //

export const fetchSenderListing = id => async (dispatch, getState, sdk) => {
  dispatch(fetchSenderListingRequest());

  try {
    const response = await sdk.listings.show({ id, include: ['author'] });

    dispatch(fetchSenderListingSuccess(response.data));
  } catch (e) {
    log.error(e, 'fetch-sender-listing-failed');
    dispatch(fetchSenderListingError(storableError(e)));
  }
};
