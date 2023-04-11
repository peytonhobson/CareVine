import { fetchCurrentUser } from '../../ducks/user.duck';
import { storableError } from '../../util/errors';
import * as log from '../../util/log';

// ================ Action types ================ //

export const FETCH_SENDER_LISTING_REQUEST = 'app/NotificationsPage/FETCH_SENDER_LISTING_REQUEST';
export const FETCH_SENDER_LISTING_SUCCESS = 'app/NotificationsPage/FETCH_SENDER_LISTING_SUCCESS';
export const FETCH_SENDER_LISTING_ERROR = 'app/NotificationsPage/FETCH_SENDER_LISTING_ERROR';

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

export const loadData = (dispatch, getState, sdk) => {
  return fetchCurrentUser();
};
