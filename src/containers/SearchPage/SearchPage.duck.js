import unionWith from 'lodash/unionWith';
import { storableError } from '../../util/errors';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { parse } from '../../util/urlHelpers';
import config from '../../config';
import { expandBounds } from '../../util/maps';
import { TRANSITIONS } from '../../util/transaction';
import { types as sdkTypes } from '../../util/sdkLoader';
import { CAREGIVER, EMPLOYER } from '../../util/constants';
const { LatLng } = sdkTypes;

// Pagination page size might need to be dynamic on responsive page layouts
// Current design has max 3 columns 12 is divisible by 2 and 3
// So, there's enough cards to fill all columns on full pagination pages
const RESULT_PAGE_SIZE = 24;

const searchableSortParams = [
  'createdAt',
  '-createdAt',
  'pub_minPrice',
  '-pub_minPrice',
  'pub_maxPrice',
  '-pub_maxPrice',
];

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

export const FETCH_REVIEWS_REQUEST = 'app/SearchPage/FETCH_REVIEWS_REQUEST';
export const FETCH_REVIEWS_SUCCESS = 'app/SearchPage/FETCH_REVIEWS_SUCCESS';
export const FETCH_REVIEWS_ERROR = 'app/SearchPage/FETCH_REVIEWS_ERROR';

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
  searchListingsSuccess: false,
  fetchReviewsInProgress: false,
  fetchReviewsError: null,
  reviews: {},
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
        searchListingsSuccess: false,
      };
    case SEARCH_LISTINGS_SUCCESS:
      return {
        ...state,
        currentPageResultIds: resultIds(payload.data),
        pagination: payload.data.meta,
        searchInProgress: false,
        searchListingsSuccess: true,
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

    case FETCH_REVIEWS_REQUEST:
      return { ...state, fetchReviewsInProgress: true, fetchReviewsError: null };
    case FETCH_REVIEWS_SUCCESS:
      return {
        ...state,
        fetchReviewsInProgress: false,
        reviews: payload.reduce((acc, review) => {
          acc[review.data.included?.[0].id.uuid] = review.data.data;
          return acc;
        }, {}),
      };
    case FETCH_REVIEWS_ERROR:
      return { ...state, fetchReviewsInProgress: false, fetchReviewsError: payload };

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

export const fetchReviewsRequest = () => ({ type: FETCH_REVIEWS_REQUEST });
export const fetchReviewsSuccess = response => ({
  type: FETCH_REVIEWS_SUCCESS,
  payload: response,
});
export const fetchReviewsError = e => ({
  type: FETCH_REVIEWS_ERROR,
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

  const {
    perPage,
    price,
    dates,
    minDuration,
    distance,
    origin,
    location,
    sort,
    pub_maxPrice,
    listingType,
    ...rest
  } = searchParams;
  // const priceMaybe = priceSearchParams(price);

  const minPriceMaybe = price ? { pub_minPrice: `,${(price + 1) * 100}` } : {};
  const sortMaybe = searchableSortParams.includes(sort) ? { sort } : null;

  const maxPriceMaybe = pub_maxPrice ? { pub_maxPrice: `${pub_maxPrice * 100},` } : {};

  const selectedLocation =
    location &&
    new LatLng(
      Number(JSON.parse(location)?.origin?.lat),
      Number(JSON.parse(location)?.origin?.lng)
    );

  const params = {
    ...rest,
    // ...priceMaybe,
    ...minPriceMaybe,
    ...maxPriceMaybe,
    per_page: perPage,
    bounds: selectedLocation || origin ? expandBounds(selectedLocation || origin, distance) : null,
    ...sortMaybe,
    meta_listingType: listingType,
  };

  return sdk.listings
    .query(params)
    .then(response => {
      dispatch(addMarketplaceEntities(response));
      dispatch(searchListingsSuccess(response));

      if (listingType === CAREGIVER) {
        const listingIds = response.data.data.map(l => l.id.uuid);
        dispatch(fetchReviews(listingIds));
      }

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

export const fetchReviews = listingIds => async (dispatch, getState, sdk) => {
  dispatch(fetchReviewsRequest());

  const reviewsQuery = {
    include: ['listing'],
    'fields.review': ['id', 'rating'],
    'fields.listing': ['id'],
  };
  const reviewsPromise = listingIds.map(async listingId => {
    const query = { ...reviewsQuery, listingId };
    const review = await sdk.reviews.query(query);
    return review;
  });

  try {
    const reviews = await Promise.all(reviewsPromise);

    dispatch(fetchReviewsSuccess(reviews));
  } catch (e) {
    dispatch(fetchReviewsError(storableError(e)));
    throw e;
  }
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
    'fields.user': [
      'profile.displayName',
      'profile.abbreviatedName',
      'email',
      'profile.metadata',
      'profile.publicData',
    ],
    'fields.image': ['variants.square-small', 'variants.square-small2x'],
    'limit.images': 1,
  });
};
