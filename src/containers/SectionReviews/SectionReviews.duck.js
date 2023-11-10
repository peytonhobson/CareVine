import { storableError } from '../../util/errors';
import { TRANSITION_REVIEW } from '../../util/transaction';
import * as log from '../../util/log';
import { SET_INITIAL_STATE } from '../ProfilePage/ProfilePage.duck';
import config from '../../config';
import { denormalisedResponseEntities } from '../../util/data';
import { updateUser } from '../../util/api';
import { fetchCurrentUser } from '../../ducks/user.duck';

// ================ Action types ================ //

export const SET_INTIIAL_STATE = 'app/SectionReviews/SET_INTIIAL_STATE';

export const SUBMIT_REVIEW_REQUEST = 'app/SectionReviews/SUBMIT_REVIEW_REQUEST';
export const SUBMIT_REVIEW_SUCCESS = 'app/SectionReviews/SUBMIT_REVIEW_SUCCESS';
export const SUBMIT_REVIEW_ERROR = 'app/SectionReviews/SUBMIT_REVIEW_ERROR';

export const FETCH_REVIEWS_REQUEST = 'app/SectionReviews/FETCH_REVIEWS_REQUEST';
export const FETCH_REVIEWS_SUCCESS = 'app/SectionReviews/FETCH_REVIEWS_SUCCESS';
export const FETCH_REVIEWS_ERROR = 'app/SectionReviews/FETCH_REVIEWS_ERROR';

// ================ Reducer ================ //

const initialState = {
  submitReviewInProgress: false,
  submitReviewError: null,
  reviewSubmitted: false,
  fetchReviewsError: null,
  fetchReviewsInProgress: false,
  reviews: [],
};

export default function sectionReviewsReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case SET_INITIAL_STATE:
      return { ...initialState, bookings: state.bookings };

    case SUBMIT_REVIEW_REQUEST:
      return {
        ...state,
        submitReviewInProgress: true,
        submitReviewError: null,
        reviewSubmitted: false,
      };
    case SUBMIT_REVIEW_SUCCESS:
      return { ...state, submitReviewInProgress: false, reviewSubmitted: true };
    case SUBMIT_REVIEW_ERROR:
      return { ...state, submitReviewInProgress: false, submitReviewError: payload };

    case FETCH_REVIEWS_REQUEST:
      return { ...state, fetchReviewsInProgress: true, fetchReviewsError: null };
    case FETCH_REVIEWS_SUCCESS:
      return { ...state, fetchReviewsInProgress: false, reviews: payload };
    case FETCH_REVIEWS_ERROR:
      return { ...state, fetchReviewsInProgress: false, fetchReviewsError: payload };

    default:
      return state;
  }
}

// ================ Selectors ================ //

// ================ Action creators ================ //

export const setInitialState = () => ({ type: SET_INITIAL_STATE });

export const submitReviewRequest = () => ({ type: SUBMIT_REVIEW_REQUEST });
export const submitReviewSuccess = () => ({ type: SUBMIT_REVIEW_SUCCESS });
export const submitReviewError = e => ({
  type: SUBMIT_REVIEW_ERROR,
  error: true,
  payload: e,
});

export const fetchReviewsRequest = () => ({ type: FETCH_REVIEWS_REQUEST });
export const fetchReviewsSuccess = reviews => ({
  type: FETCH_REVIEWS_SUCCESS,
  payload: reviews,
});
export const fetchReviewsError = e => ({
  type: FETCH_REVIEWS_ERROR,
  error: true,
  payload: e,
});

/* ================ Thunks ================ */

export const submitReview = (reviewRating, reviewContent, listingId) => async (
  dispatch,
  getState,
  sdk
) => {
  dispatch(submitReviewRequest());

  const params = { reviewRating: Number(reviewRating), reviewContent, listingId };

  try {
    await sdk.transactions.initiate({
      processAlias: config.singleActionProcessAlias,
      transition: TRANSITION_REVIEW,
      params,
    });

    const userId = getState().user.currentUser.id.uuid;
    const pendingReviews =
      getState().user.currentUser.attributes.profile.metadata.pendingReviews ?? [];

    const newPendingReviews = pendingReviews.filter(id => id !== listingId);

    await updateUser({ userId, metadata: { pendingReviews: newPendingReviews } });

    dispatch(fetchReviews(listingId));
    dispatch(fetchCurrentUser());
    dispatch(submitReviewSuccess());
  } catch (e) {
    console.error(e);
    log.error(e, 'review-submission-failed', { listingId });
    dispatch(submitReviewError(storableError(e)));
  }
};

export const fetchReviews = listingId => (dispatch, getState, sdk) => {
  dispatch(fetchReviewsRequest());
  return sdk.reviews
    .query({
      listing_id: listingId,
      state: 'public',
      include: ['author', 'author.profileImage'],
      'fields.image': ['variants.square-small', 'variants.square-small2x'],
    })
    .then(response => {
      const reviews = denormalisedResponseEntities(response);
      dispatch(fetchReviewsSuccess(reviews));
    })
    .catch(e => {
      dispatch(fetchReviewsError(storableError(e)));
    });
};
