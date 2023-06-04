import omit from 'lodash/omit';
import { types as sdkTypes } from '../../util/sdkLoader';
import { resetToStartOfDay, getDefaultTimeZoneOnBrowser } from '../../util/dates';
import { denormalisedResponseEntities } from '../../util/data';
import { storableError } from '../../util/errors';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import {
  createStripeAccount,
  updateStripeAccount,
  fetchStripeAccount,
} from '../../ducks/stripeConnectAccount.duck';
import { fetchCurrentUser, fetchCurrentUserHasListings } from '../../ducks/user.duck';
import * as log from '../../util/log';
import { updateListingMetadata } from '../../util/api';

const { UUID } = sdkTypes;

const requestAction = actionType => params => ({ type: actionType, payload: { params } });

const successAction = actionType => result => ({ type: actionType, payload: result.data });

const errorAction = actionType => error => ({ type: actionType, payload: error, error: true });

// ================ Action types ================ //

export const MARK_TAB_UPDATED = 'app/EditListingPage/MARK_TAB_UPDATED';
export const CLEAR_UPDATED_TAB = 'app/EditListingPage/CLEAR_UPDATED_TAB';

export const CREATE_LISTING_DRAFT_REQUEST = 'app/EditListingPage/CREATE_LISTING_DRAFT_REQUEST';
export const CREATE_LISTING_DRAFT_SUCCESS = 'app/EditListingPage/CREATE_LISTING_DRAFT_SUCCESS';
export const CREATE_LISTING_DRAFT_ERROR = 'app/EditListingPage/CREATE_LISTING_DRAFT_ERROR';

export const PUBLISH_LISTING_REQUEST = 'app/EditListingPage/PUBLISH_LISTING_REQUEST';
export const PUBLISH_LISTING_SUCCESS = 'app/EditListingPage/PUBLISH_LISTING_SUCCESS';
export const PUBLISH_LISTING_ERROR = 'app/EditListingPage/PUBLISH_LISTING_ERROR';

export const UPDATE_LISTING_REQUEST = 'app/EditListingPage/UPDATE_LISTING_REQUEST';
export const UPDATE_LISTING_SUCCESS = 'app/EditListingPage/UPDATE_LISTING_SUCCESS';
export const UPDATE_LISTING_ERROR = 'app/EditListingPage/UPDATE_LISTING_ERROR';

export const SHOW_LISTINGS_REQUEST = 'app/EditListingPage/SHOW_LISTINGS_REQUEST';
export const SHOW_LISTINGS_SUCCESS = 'app/EditListingPage/SHOW_LISTINGS_SUCCESS';
export const SHOW_LISTINGS_ERROR = 'app/EditListingPage/SHOW_LISTINGS_ERROR';

export const UPLOAD_IMAGE_REQUEST = 'app/EditListingPage/UPLOAD_IMAGE_REQUEST';
export const UPLOAD_IMAGE_SUCCESS = 'app/EditListingPage/UPLOAD_IMAGE_SUCCESS';
export const UPLOAD_IMAGE_ERROR = 'app/EditListingPage/UPLOAD_IMAGE_ERROR';

export const UPDATE_IMAGE_ORDER = 'app/EditListingPage/UPDATE_IMAGE_ORDER';

export const REMOVE_LISTING_IMAGE = 'app/EditListingPage/REMOVE_LISTING_IMAGE';

// ================ Reducer ================ //

const initialState = {
  // Error instance placeholders for each endpoint
  createListingDraftError: null,
  publishingListing: null,
  publishListingError: null,
  updateListingError: null,
  showListingsError: null,
  uploadImageError: null,
  createListingDraftInProgress: false,
  submittedListingId: null,
  redirectToListing: false,
  images: {},
  image: null,
  imageOrder: [],
  removedImageIds: [],
  listingDraft: null,
  updatedTab: null,
  updateInProgress: false,
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case MARK_TAB_UPDATED:
      return { ...state, updatedTab: payload };
    case CLEAR_UPDATED_TAB:
      return { ...state, updatedTab: null, updateListingError: null };

    case CREATE_LISTING_DRAFT_REQUEST:
      return {
        ...state,
        createListingDraftInProgress: true,
        createListingDraftError: null,
        submittedListingId: null,
        listingDraft: null,
      };

    case CREATE_LISTING_DRAFT_SUCCESS:
      return {
        ...state,
        createListingDraftInProgress: false,
        submittedListingId: payload.data.id,
        listingDraft: payload.data,
      };
    case CREATE_LISTING_DRAFT_ERROR:
      return {
        ...state,
        createListingDraftInProgress: false,
        createListingDraftError: payload,
      };

    case PUBLISH_LISTING_REQUEST:
      return {
        ...state,
        publishingListing: payload.listingId,
        publishListingError: null,
      };
    case PUBLISH_LISTING_SUCCESS:
      return {
        ...state,
        redirectToListing: true,
        publishingListing: null,
        createListingDraftError: null,
        updateListingError: null,
        showListingsError: null,
        uploadImageError: null,
        createListingDraftInProgress: false,
        updateInProgress: false,
      };
    case PUBLISH_LISTING_ERROR: {
      // eslint-disable-next-line no-console
      console.error(payload);
      return {
        ...state,
        publishingListing: null,
        publishListingError: {
          listingId: state.publishingListing,
          error: payload,
        },
      };
    }

    case UPDATE_LISTING_REQUEST:
      return { ...state, updateInProgress: true, updateListingError: null };
    case UPDATE_LISTING_SUCCESS:
      return { ...state, updateInProgress: false };
    case UPDATE_LISTING_ERROR:
      return { ...state, updateInProgress: false, updateListingError: payload };

    case SHOW_LISTINGS_REQUEST:
      return { ...state, showListingsError: null };
    case SHOW_LISTINGS_SUCCESS:
      return { ...state, images: {}, imageOrder: [], removedImageIds: [] };

    case SHOW_LISTINGS_ERROR:
      // eslint-disable-next-line no-console
      console.error(payload);
      return { ...state, showListingsError: payload, redirectToListing: false };

    case UPLOAD_IMAGE_REQUEST: {
      // payload.params: { id: 'tempId', file }
      const images = {
        ...state.images,
        [payload.params.id]: { ...payload.params },
      };
      return {
        ...state,
        images,
        imageOrder: state.imageOrder.concat([payload.params.id]),
        uploadImageError: null,
      };
    }
    case UPLOAD_IMAGE_SUCCESS: {
      // payload.params: { id: 'tempId', imageId: 'some-real-id'}
      const { id, imageId } = payload;
      const file = state.images[id].file;
      const images = { ...state.images, [id]: { id, imageId, file } };
      return { ...state, images };
    }
    case UPLOAD_IMAGE_ERROR: {
      // eslint-disable-next-line no-console
      const { id, error } = payload;
      const imageOrder = state.imageOrder.filter(i => i !== id);
      const images = omit(state.images, id);
      return { ...state, imageOrder, images, uploadImageError: error };
    }
    case UPDATE_IMAGE_ORDER:
      return { ...state, imageOrder: payload.imageOrder };

    case REMOVE_LISTING_IMAGE: {
      const id = payload.imageId;

      // Only mark the image removed if it hasn't been added to the
      // listing already
      const removedImageIds = state.images[id]
        ? state.removedImageIds
        : state.removedImageIds.concat(id);

      // Always remove from the draft since it might be a new image to
      // an existing listing.
      const images = omit(state.images, id);
      const imageOrder = state.imageOrder.filter(i => i !== id);

      return { ...state, images, imageOrder, removedImageIds };
    }

    default:
      return state;
  }
}

// ================ Selectors ================ //

// ================ Action creators ================ //

export const markTabUpdated = tab => ({
  type: MARK_TAB_UPDATED,
  payload: tab,
});

export const clearUpdatedTab = () => ({
  type: CLEAR_UPDATED_TAB,
});

export const updateImageOrder = imageOrder => ({
  type: UPDATE_IMAGE_ORDER,
  payload: { imageOrder },
});

export const removeListingImage = imageId => ({
  type: REMOVE_LISTING_IMAGE,
  payload: { imageId },
});

// All the action creators that don't have the {Success, Error} suffix
// take the params object that the corresponding SDK endpoint method
// expects.

// SDK method: ownListings.create
export const createListingDraft = requestAction(CREATE_LISTING_DRAFT_REQUEST);
export const createListingDraftSuccess = successAction(CREATE_LISTING_DRAFT_SUCCESS);
export const createListingDraftError = errorAction(CREATE_LISTING_DRAFT_ERROR);

// SDK method: ownListings.publish
export const publishListing = requestAction(PUBLISH_LISTING_REQUEST);
export const publishListingSuccess = successAction(PUBLISH_LISTING_SUCCESS);
export const publishListingError = errorAction(PUBLISH_LISTING_ERROR);

// SDK method: ownListings.update
export const updateListing = requestAction(UPDATE_LISTING_REQUEST);
export const updateListingSuccess = successAction(UPDATE_LISTING_SUCCESS);
export const updateListingError = errorAction(UPDATE_LISTING_ERROR);

// SDK method: ownListings.show
export const showListings = requestAction(SHOW_LISTINGS_REQUEST);
export const showListingsSuccess = successAction(SHOW_LISTINGS_SUCCESS);
export const showListingsError = errorAction(SHOW_LISTINGS_ERROR);

// SDK method: images.upload
export const uploadImage = requestAction(UPLOAD_IMAGE_REQUEST);
export const uploadImageSuccess = successAction(UPLOAD_IMAGE_SUCCESS);
export const uploadImageError = errorAction(UPLOAD_IMAGE_ERROR);

// ================ Thunk ================ //

export function requestShowListing(actionPayload) {
  return (dispatch, getState, sdk) => {
    dispatch(showListings(actionPayload));
    return sdk.ownListings
      .show(actionPayload)
      .then(response => {
        dispatch(addMarketplaceEntities(response));
        dispatch(showListingsSuccess(response));
        return response;
      })
      .catch(e => dispatch(showListingsError(storableError(e))));
  };
}

export function requestCreateListingDraft(data) {
  const listingType = data.listingType;
  delete data.listingType;

  return (dispatch, getState, sdk) => {
    dispatch(createListingDraft(data));

    const queryParams = {
      expand: true,
      include: ['author', 'images'],
      'fields.image': ['variants.square-small', 'variants.square-small2x'],
    };

    return sdk.ownListings
      .createDraft(data, queryParams)
      .then(response => {
        const listingId = response.data.data.id.uuid;
        const userId = response.data.data.relationships.author.data.id.uuid;

        if (listingType) {
          updateListingMetadata({
            listingId,
            metadata: { listingType, userId, finishProfileReminderReceived: false },
          });
        }

        // Add the created listing to the marketplace data
        dispatch(addMarketplaceEntities(response));

        // Modify store to understand that we have created listing and can redirect away
        dispatch(createListingDraftSuccess(response));
        return response;
      })
      .catch(e => {
        log.error(e, 'create-listing-draft-failed', { listingData: data });
        return dispatch(createListingDraftError(storableError(e)));
      });
  };
}

export const requestPublishListingDraft = listingId => async (dispatch, getState, sdk) => {
  dispatch(publishListing(listingId));

  try {
    const response = await sdk.ownListings.publishDraft({ id: listingId });

    await updateListingMetadata({
      listingId,
      metadata: {
        userPublishedAt: Number(Number.parseFloat(new Date().getTime() / 1000).toFixed(0)),
        verifyEmailReminderReceived: false,
      },
    });

    // Add the created listing to the marketplace data
    dispatch(addMarketplaceEntities(response));
    dispatch(publishListingSuccess(response));
    return response;
  } catch (e) {
    log.error(e, 'publish-listing-draft-failed', { listingId });
    dispatch(publishListingError(storableError(e)));
  }
};

// Images return imageId which we need to map with previously generated temporary id
export function requestImageUpload(actionPayload) {
  return (dispatch, getState, sdk) => {
    const id = actionPayload.id;
    dispatch(uploadImage(actionPayload));
    return sdk.images
      .upload({ image: actionPayload.file })
      .then(resp => dispatch(uploadImageSuccess({ data: { id, imageId: resp.data.data.id } })))
      .catch(e => dispatch(uploadImageError({ id, error: storableError(e) })));
  };
}

// Update the given tab of the wizard with the given data. This saves
// the data to the listing, and marks the tab updated so the UI can
// display the state.
export function requestUpdateListing(tab, data) {
  return (dispatch, getState, sdk) => {
    dispatch(updateListing(data));
    const { id } = data;
    let updateResponse;
    return sdk.ownListings
      .update(data)
      .then(response => {
        updateResponse = response;
        const payload = {
          id,
          include: ['author', 'images'],
          'fields.image': ['variants.square-small', 'variants.square-small2x'],
        };
        return dispatch(requestShowListing(payload));
      })
      .then(() => {
        dispatch(markTabUpdated(tab));
        dispatch(updateListingSuccess(updateResponse));
        return updateResponse;
      })
      .catch(e => {
        log.error(e, 'update-listing-failed', { listingData: data });
        dispatch(updateListingError(storableError(e)));
        throw e;
      });
  };
}

// loadData is run for each tab of the wizard. When editing an
// existing listing, the listing must be fetched first.
export const loadData = params => (dispatch, getState, sdk) => {
  dispatch(clearUpdatedTab());
  const { id, type } = params;

  if (type === 'new') {
    // No need to listing data when creating a new listing
    return Promise.all([dispatch(fetchCurrentUser())])
      .then(response => {
        const currentUser = getState().user.currentUser;
        if (currentUser && currentUser.stripeAccount) {
          dispatch(fetchStripeAccount());
        }
        return response;
      })
      .catch(e => {
        throw e;
      });
  }

  const payload = {
    id: new UUID(id),
    include: ['author'],
  };

  return Promise.all([
    dispatch(requestShowListing(payload)),
    dispatch(fetchCurrentUser({ include: ['stripeCustomer.defaultPaymentMethod'] })),
  ])
    .then(response => {
      const currentUser = getState().user.currentUser;
      if (currentUser && currentUser.stripeAccount) {
        dispatch(fetchStripeAccount());
      }

      // Because of two dispatch functions, response is an array.
      // We are only interested in the response from requestShowListing here,
      // so we need to pick the first one
      if (response[0] && response[0].data && response[0].data.data) {
        const listing = response[0].data.data;

        // If the listing doesn't have availabilityPlan yet
        // use the default timezone
        const availabilityPlan = listing.attributes.availabilityPlan;

        const tz = availabilityPlan
          ? listing.attributes.availabilityPlan.timezone
          : typeof window !== 'undefined'
          ? getDefaultTimeZoneOnBrowser()
          : 'Etc/UTC';

        const today = new Date();
        const start = resetToStartOfDay(today, tz, 0);
        // Query range: today + 364 days
        const exceptionRange = 364;
        const end = resetToStartOfDay(today, tz, exceptionRange);

        // NOTE: in this template, we don't expect more than 100 exceptions.
        // If there are more exceptions, pagination kicks in and we can't use frontend sorting.
        const params = {
          listingId: listing.id,
          start,
          end,
        };
      }

      return response;
    })
    .catch(e => {
      throw e;
    });
};
