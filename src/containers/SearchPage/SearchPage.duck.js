import unionWith from 'lodash/unionWith';
import { storableError } from '../../util/errors';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { convertUnitToSubUnit, unitDivisor } from '../../util/currency';
import { formatDateStringToTz, getExclusiveEndDateWithTz } from '../../util/dates';
import { parse } from '../../util/urlHelpers';
import config from '../../config';
import { calculateDistanceBetweenOrigins, expandBounds } from '../../util/maps';
import { TRANSITIONS } from '../../util/transaction';
import SendbirdChat from '@sendbird/chat';
import { GroupChannelModule } from '@sendbird/chat/groupChannel';
import { userDisplayNameAsString } from '../../util/data';
import { generateAccessToken } from '../InboxPage/InboxPage.duck';
import * as log from '../../util/log';

// Pagination page size might need to be dynamic on responsive page layouts
// Current design has max 3 columns 12 is divisible by 2 and 3
// So, there's enough cards to fill all columns on full pagination pages
const RESULT_PAGE_SIZE = 24;

// ================ Action types ================ //

export const SEARCH_LISTINGS_REQUEST = 'app/SearchPage/SEARCH_LISTINGS_REQUEST';
export const SEARCH_LISTINGS_SUCCESS = 'app/SearchPage/SEARCH_LISTINGS_SUCCESS';
export const SEARCH_LISTINGS_ERROR = 'app/SearchPage/SEARCH_LISTINGS_ERROR';

export const SEARCH_MAP_LISTINGS_REQUEST = 'app/SearchPage/SEARCH_MAP_LISTINGS_REQUEST';
export const SEARCH_MAP_LISTINGS_SUCCESS = 'app/SearchPage/SEARCH_MAP_LISTINGS_SUCCESS';
export const SEARCH_MAP_LISTINGS_ERROR = 'app/SearchPage/SEARCH_MAP_LISTINGS_ERROR';

export const SEARCH_MAP_SET_ACTIVE_LISTING = 'app/SearchPage/SEARCH_MAP_SET_ACTIVE_LISTING';

export const FETCH_TRANSACTIONS_REQUEST = 'app/SearchPage/FETCH_TRANSACTIONS_REQUEST';
export const FETCH_TRANSACTIONS_SUCCESS = 'app/SearchPage/FETCH_TRANSACTIONS_SUCCESS';
export const FETCH_TRANSACTIONS_ERROR = 'app/SearchPage/FETCH_TRANSACTIONS_ERROR';

export const FETCH_CHANNEL_REQUEST = 'app/SearchPage/FETCH_CHANNEL_REQUEST';
export const FETCH_CHANNEL_SUCCESS = 'app/SearchPage/FETCH_CHANNEL_SUCCESS';
export const FETCH_CHANNEL_ERROR = 'app/SearchPage/FETCH_CHANNEL_ERROR';

// ================ Reducer ================ //

const initialState = {
  pagination: null,
  searchParams: null,
  searchInProgress: false,
  searchListingsError: null,
  currentPageResultIds: [],
  searchMapListingIds: [],
  searchMapListingsError: null,
  transactions: [],
  fetchTransactionInProgress: false,
  fetchTransactionsError: false,
  messageChannel: null,
  fetchChannelInProgress: false,
  fetchChannelError: null,
};

const resultIds = data => data.data.map(l => l.id);

const listingPageReducer = (state = initialState, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case SEARCH_LISTINGS_REQUEST:
      return {
        ...state,
        searchParams: payload.searchParams,
        searchInProgress: true,
        searchMapListingIds: [],
        searchListingsError: null,
      };
    case SEARCH_LISTINGS_SUCCESS:
      return {
        ...state,
        currentPageResultIds: resultIds(payload.data),
        pagination: payload.data.meta,
        searchInProgress: false,
      };
    case SEARCH_LISTINGS_ERROR:
      // eslint-disable-next-line no-console
      console.error(payload);
      return { ...state, searchInProgress: false, searchListingsError: payload };

    case SEARCH_MAP_LISTINGS_REQUEST:
      return {
        ...state,
        searchMapListingsError: null,
      };
    case SEARCH_MAP_LISTINGS_SUCCESS: {
      const searchMapListingIds = unionWith(
        state.searchMapListingIds,
        resultIds(payload.data),
        (id1, id2) => id1.uuid === id2.uuid
      );
      return {
        ...state,
        searchMapListingIds,
      };
    }
    case SEARCH_MAP_LISTINGS_ERROR:
      // eslint-disable-next-line no-console
      console.error(payload);
      return { ...state, searchMapListingsError: payload };

    case SEARCH_MAP_SET_ACTIVE_LISTING:
      return {
        ...state,
        activeListingId: payload,
      };
    case FETCH_TRANSACTIONS_REQUEST: {
      return {
        ...state,
        fetchTransactionInProgress: true,
        fetchTransactionsError: false,
      };
    }
    case FETCH_TRANSACTIONS_SUCCESS:
      return { ...state, fetchTransactionInProgress: false, transactions: payload.data };

    case FETCH_TRANSACTIONS_ERROR:
      return {
        ...state,
        fetchTransactionInProgress: false,
        fetchTransactionsError: true,
      };

    case FETCH_CHANNEL_REQUEST: {
      return {
        ...state,
        fetchChannelInProgress: true,
        fetchChannelError: false,
      };
    }
    case FETCH_CHANNEL_SUCCESS:
      return { ...state, fetchChannelInProgress: false, messageChannel: payload };

    case FETCH_CHANNEL_ERROR:
      return {
        ...state,
        fetchChannelInProgress: false,
        fetchChannelError: true,
      };
    default:
      return state;
  }
};

export default listingPageReducer;

// ================ Action creators ================ //

export const searchListingsRequest = searchParams => ({
  type: SEARCH_LISTINGS_REQUEST,
  payload: { searchParams },
});

export const searchListingsSuccess = response => ({
  type: SEARCH_LISTINGS_SUCCESS,
  payload: { data: response.data },
});

export const searchListingsError = e => ({
  type: SEARCH_LISTINGS_ERROR,
  error: true,
  payload: e,
});

export const searchMapListingsRequest = () => ({ type: SEARCH_MAP_LISTINGS_REQUEST });
export const searchMapListingsSuccess = response => ({
  type: SEARCH_MAP_LISTINGS_SUCCESS,
  payload: { data: response.data },
});
export const searchMapListingsError = e => ({
  type: SEARCH_MAP_LISTINGS_ERROR,
  error: true,
  payload: e,
});

export const fetchTransactionsRequest = () => ({
  type: FETCH_TRANSACTIONS_REQUEST,
});
export const fetchTransactionsSuccess = response => ({
  type: FETCH_TRANSACTIONS_SUCCESS,
  payload: { data: response.data },
});
export const fetchTransactionsError = e => ({
  type: FETCH_TRANSACTIONS_ERROR,
  error: true,
  payload: e,
});

export const fetchChannelRequest = () => ({
  type: FETCH_CHANNEL_REQUEST,
});
export const fetchChannelSuccess = channel => ({
  type: FETCH_CHANNEL_SUCCESS,
  payload: channel,
});
export const fetchChannelError = e => ({
  type: FETCH_CHANNEL_ERROR,
  error: true,
  payload: e,
});

export const fetchCurrentUserTransactions = () => (dispatch, getState, sdk) => {
  dispatch(fetchTransactionsRequest());

  const apiQueryParams = {
    lastTransitions: TRANSITIONS,
    include: ['provider', 'customer'],
  };

  return sdk.transactions
    .query(apiQueryParams)
    .then(response => {
      dispatch(addMarketplaceEntities(response));
      dispatch(fetchTransactionsSuccess(response.data));
    })
    .catch(e => {
      dispatch(fetchTransactionsError(e));
      throw e;
    });
};

export const searchListings = searchParams => (dispatch, getState, sdk) => {
  dispatch(searchListingsRequest(searchParams));

  const { perPage, price, dates, minDuration, distance, origin, ...rest } = searchParams;
  // const priceMaybe = priceSearchParams(price);

  const minPriceMaybe = price ? { pub_minPrice: `,${price * 100}` } : {};

  const params = {
    ...rest,
    // ...priceMaybe,
    ...minPriceMaybe,
    per_page: perPage,
    bounds: expandBounds(origin, distance),
  };

  return sdk.listings
    .query(params)
    .then(response => {
      dispatch(addMarketplaceEntities(response));
      dispatch(searchListingsSuccess(response));
      return response;
    })
    .catch(e => {
      dispatch(searchListingsError(storableError(e)));
      throw e;
    });
};

export const setActiveListing = listingId => ({
  type: SEARCH_MAP_SET_ACTIVE_LISTING,
  payload: listingId,
});

export const searchMapListings = searchParams => (dispatch, getState, sdk) => {
  dispatch(searchMapListingsRequest(searchParams));

  const { perPage, ...rest } = searchParams;
  const params = {
    ...rest,
    per_page: perPage,
  };

  return sdk.listings
    .query(params)
    .then(response => {
      dispatch(addMarketplaceEntities(response));
      dispatch(searchMapListingsSuccess(response));
      return response;
    })
    .catch(e => {
      dispatch(searchMapListingsError(storableError(e)));
      throw e;
    });
};

export const fetchChannel = (currentAuthor, currentUser, accessToken) => (
  dispatch,
  getState,
  sdk
) => {
  dispatch(fetchChannelRequest());

  const currentAuthorId = currentAuthor.id.uuid;
  const currentUserId = currentUser.id.uuid;

  const params = {
    appId: process.env.REACT_APP_SENDBIRD_APP_ID,
    modules: [new GroupChannelModule()],
  };
  const sb = SendbirdChat.init(params);

  const userListQueryParams = {
    userIdsFilter: [currentAuthorId],
  };
  const query = sb.createApplicationUserListQuery(userListQueryParams);

  return sb
    .connect(currentUserId, accessToken)
    .then(() => {
      return query.next().then(async users => {
        if (users.length === 0) {
          dispatch(generateAccessToken(currentAuthor));
        }

        let CHANNEL_URL = 'sendbird_group_channel_' + currentUserId + '-' + currentAuthorId;

        let channel = null;

        try {
          channel = await sb.groupChannel.getChannel(CHANNEL_URL);
        } catch (e) {
          console.log(e);
        }

        if (!channel) {
          CHANNEL_URL = 'sendbird_group_channel_' + currentAuthorId + '-' + currentUserId;
          try {
            channel = await sb.groupChannel.getChannel(CHANNEL_URL);
          } catch (e) {
            // TODO: remove in production
            console.log(e);
          }
        }

        if (!channel) {
          const channelParams = {
            invitedUserIds: [currentUserId, currentAuthorId],
            channelUrl: CHANNEL_URL,
          };
          try {
            channel = await sb.groupChannel.createChannel(channelParams);
          } catch (e) {
            dispatch(fetchChannelError(e));
          }
        }

        if (channel) {
          dispatch(fetchChannelSuccess(channel));
        }
      });
    })
    .catch(e => {
      log.error(e);
      dispatch(fetchChannelError(e));
    });
};

export const loadData = (params, search) => {
  const queryParams = parse(search, {
    latlng: ['origin'],
    latlngBounds: ['bounds'],
  });
  const { page = 1, address, origin, ...rest } = queryParams;
  const originMaybe = config.sortSearchByDistance && origin ? { origin } : {};

  return searchListings({
    ...rest,
    ...originMaybe,
    page,
    perPage: RESULT_PAGE_SIZE,
    include: ['author.profileImage', 'images'],
    'fields.listing': ['title', 'geolocation', 'description', 'publicData', 'metadata'],
    'fields.user': ['profile.displayName', 'profile.abbreviatedName', 'email', 'profile.metadata'],
    'fields.image': ['variants.square-small', 'variants.square-small2x'],
    'limit.images': 1,
  });
};
