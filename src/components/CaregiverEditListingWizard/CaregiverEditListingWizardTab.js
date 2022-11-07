import React from 'react';
import { array, arrayOf, bool, func, object, oneOf, shape, string } from 'prop-types';
import queryString from 'query-string';
import { propTypes } from '../../util/types';
import { intlShape } from '../../util/reactIntl';
import routeConfiguration from '../../routeConfiguration';
import {
  LISTING_PAGE_PARAM_TYPE_DRAFT,
  LISTING_PAGE_PARAM_TYPE_NEW,
  LISTING_PAGE_PARAM_TYPES,
} from '../../util/urlHelpers';
import { ensureListing } from '../../util/data';
import { createResourceLocatorString } from '../../util/routes';
import {
  EditListingAvailabilityPanel,
  EditListingBioPanel,
  EditListingExperiencePanel,
  EditListingLocationPanel,
  EditListingPhotosPanel,
  EditListingPoliciesPanel,
  EditListingPricingPanel,
} from '..';

import css from './CaregiverEditListingWizard.module.css';

export const CARETYPES = 'careTypes';
export const AVAILABILITY = 'availability';
export const BIO = 'bio';
export const EXPERIENCE = 'experience';
export const POLICY = 'policy';
export const LOCATION = 'location';
export const PRICING = 'pricing';
export const PHOTOS = 'photos';

// CaregiverEditListingWizardTab component supports these tabs
export const SUPPORTED_TABS = [
  CARETYPES,
  BIO,
  EXPERIENCE,
  POLICY,
  LOCATION,
  PRICING,
  AVAILABILITY,
  PHOTOS,
];

const pathParamsToNextTab = (params, tab, marketplaceTabs) => {
  const nextTabIndex = marketplaceTabs.findIndex(s => s === tab) + 1;
  const nextTab =
    nextTabIndex < marketplaceTabs.length
      ? marketplaceTabs[nextTabIndex]
      : marketplaceTabs[marketplaceTabs.length - 1];
  return { ...params, tab: nextTab };
};

const CaregiverEditListingWizardTab = props => {
  const {
    tab,
    marketplaceTabs,
    params,
    errors,
    fetchInProgress,
    newListingPublished,
    history,
    images,
    listing,
    handleCreateFlowTabScrolling,
    handlePublishListing,
    onAddAvailabilityException,
    onDeleteAvailabilityException,
    onUpdateListing,
    onCreateListingDraft,
    onImageUpload,
    onUpdateImageOrder,
    onRemoveImage,
    onChange,
    onManageDisableScrolling,
    updatedTab,
    updateInProgress,
    intl,
    fetchExceptionsInProgress,
    availabilityExceptions,
    pageName,
    profileImage,
    currentUser,
    onProfileImageUpload,
    uploadInProgress,
  } = props;

  const { type } = params;
  const isNewURI = type === LISTING_PAGE_PARAM_TYPE_NEW;
  const isDraftURI = type === LISTING_PAGE_PARAM_TYPE_DRAFT;
  const isNewListingFlow = isNewURI || isDraftURI;

  const currentListing = ensureListing(listing);
  const imageIds = images => {
    return images ? images.map(img => img.imageId || img.id) : null;
  };

  // When user has update draft listing, he should be redirected to next CaregiverEditListingWizardTab
  const redirectAfterDraftUpdate = (listingId, params, tab, marketplaceTabs, history) => {
    const currentPathParams = {
      ...params,
      type: LISTING_PAGE_PARAM_TYPE_DRAFT,
      id: listingId,
    };
    const routes = routeConfiguration();

    // Replace current "new" path to "draft" path.
    // Browser's back button should lead to editing current draft instead of creating a new one.
    if (params.type === LISTING_PAGE_PARAM_TYPE_NEW) {
      const draftURI = createResourceLocatorString(
        pageName || 'EditListingPage',
        routes,
        currentPathParams
      );
      console.log(draftURI);
      history.replace(draftURI);
    }

    const currentSearch = history.location.search;
    // Redirect to next tab
    const nextPathParams = pathParamsToNextTab(currentPathParams, tab, marketplaceTabs);
    const searchString =
      nextPathParams.tab == 'experience' && tab == 'bio'
        ? { form: 'care-type' }
        : tab == 'experience' && currentSearch == '?form=care-type'
        ? { form: 'experience-level' }
        : tab == 'experience' && currentSearch == '?form=experience-level'
        ? { form: 'additional-details' }
        : {};

    nextPathParams.tab =
      tab == 'experience' &&
      (currentSearch == '?form=care-type' || currentSearch == '?form=experience-level')
        ? 'experience'
        : nextPathParams.tab;

    const to = createResourceLocatorString(
      pageName || 'EditListingPage',
      routes,
      nextPathParams,
      searchString
    );
    console.log(to);
    history.push(to);
  };

  const onCompleteCaregiverEditListingWizardTab = (tab, updateValues, passThrownErrors = false) => {
    // Normalize images for API call
    const { images: updatedImages, ...otherValues } = updateValues;
    const imageProperty =
      typeof updatedImages !== 'undefined' ? { images: imageIds(updatedImages) } : {};
    const updateValuesWithImages = { ...otherValues, ...imageProperty };

    if (isNewListingFlow) {
      const onUpsertListingDraft = isNewURI
        ? (tab, updateValues) => onCreateListingDraft(updateValues)
        : onUpdateListing;

      const upsertValues = isNewURI
        ? updateValuesWithImages
        : { ...updateValuesWithImages, id: currentListing.id };

      return onUpsertListingDraft(tab, upsertValues)
        .then(r => {
          if (tab !== AVAILABILITY && tab !== marketplaceTabs[marketplaceTabs.length - 1]) {
            // Create listing flow: smooth scrolling polyfill to scroll to correct tab
            handleCreateFlowTabScrolling(false);

            // After successful saving of draft data, user should be redirected to next tab
            redirectAfterDraftUpdate(r.data.data.id.uuid, params, tab, marketplaceTabs, history);
          } else if (tab === marketplaceTabs[marketplaceTabs.length - 1]) {
            handlePublishListing(currentListing.id);
          }
        })
        .catch(e => {
          if (passThrownErrors) {
            throw e;
          }
          // No need for extra actions
          // Error is logged in EditListingPage.duck file.
        });
    } else {
      return onUpdateListing(tab, { ...updateValuesWithImages, id: currentListing.id });
    }
  };

  const panelProps = tab => {
    return {
      className: css.panel,
      errors,
      listing,
      onChange,
      panelUpdated: updatedTab === tab,
      updateInProgress,
      isNewListingFlow,
      onManageDisableScrolling,
      intl,
      // newListingPublished and fetchInProgress are flags for the last wizard tab
      ready: newListingPublished,
      disabled: fetchInProgress,
    };
  };

  switch (tab) {
    case CARETYPES: {
      const submitButtonTranslationKey = 'CaregiverEditListingWizard.saveCareTypes';
      return (
        <EditListingCareTypesPanel
          {...panelProps(CARETYPES)}
          submitButtonText={intl.formatMessage({ id: submitButtonTranslationKey })}
          onSubmit={values => {
            onCompleteCaregiverEditListingWizardTab(tab, values);
          }}
        />
      );
    }
    case BIO: {
      const submitButtonTranslationKey = isNewListingFlow
        ? 'CaregiverEditListingWizard.saveNewBio'
        : 'CaregiverEditListingWizard.saveEditBio';
      return (
        <EditListingBioPanel
          {...panelProps(BIO)}
          submitButtonText={intl.formatMessage({ id: submitButtonTranslationKey })}
          onSubmit={values => {
            onCompleteCaregiverEditListingWizardTab(tab, values);
          }}
        />
      );
    }
    case EXPERIENCE: {
      const submitButtonTranslationKey = isNewListingFlow
        ? 'CaregiverEditListingWizard.saveNewExperience'
        : 'CaregiverEditListingWizard.saveEditExperience';
      return (
        <EditListingExperiencePanel
          {...panelProps(EXPERIENCE)}
          submitButtonText={intl.formatMessage({ id: submitButtonTranslationKey })}
          onSubmit={values => {
            onCompleteCaregiverEditListingWizardTab(tab, values);
          }}
        />
      );
    }
    // case POLICY: {
    //   const submitButtonTranslationKey = isNewListingFlow
    //     ? 'CaregiverEditListingWizard.saveNewPolicies'
    //     : 'CaregiverEditListingWizard.saveEditPolicies';
    //   return (
    //     <EditListingPoliciesPanel
    //       {...panelProps(POLICY)}
    //       submitButtonText={intl.formatMessage({ id: submitButtonTranslationKey })}
    //       onSubmit={values => {
    //         onCompleteCaregiverEditListingWizardTab(tab, values);
    //       }}
    //     />
    //   );
    // }
    case LOCATION: {
      const submitButtonTranslationKey = isNewListingFlow
        ? 'CaregiverEditListingWizard.saveNewLocation'
        : 'CaregiverEditListingWizard.saveEditLocation';
      return (
        <EditListingLocationPanel
          {...panelProps(LOCATION)}
          submitButtonText={intl.formatMessage({ id: submitButtonTranslationKey })}
          onSubmit={values => {
            onCompleteCaregiverEditListingWizardTab(tab, values);
          }}
        />
      );
    }
    case PRICING: {
      const submitButtonTranslationKey = isNewListingFlow
        ? 'CaregiverEditListingWizard.saveNewPricing'
        : 'CaregiverEditListingWizard.saveEditPricing';
      return (
        <EditListingPricingPanel
          {...panelProps(PRICING)}
          submitButtonText={intl.formatMessage({ id: submitButtonTranslationKey })}
          onSubmit={values => {
            onCompleteCaregiverEditListingWizardTab(tab, values);
          }}
        />
      );
    }
    case AVAILABILITY: {
      const submitButtonTranslationKey = isNewListingFlow
        ? 'CaregiverEditListingWizard.saveNewAvailability'
        : 'CaregiverEditListingWizard.saveEditAvailability';
      return (
        <EditListingAvailabilityPanel
          {...panelProps(AVAILABILITY)}
          fetchExceptionsInProgress={fetchExceptionsInProgress}
          availabilityExceptions={availabilityExceptions}
          submitButtonText={intl.formatMessage({ id: submitButtonTranslationKey })}
          onAddAvailabilityException={onAddAvailabilityException}
          onDeleteAvailabilityException={onDeleteAvailabilityException}
          onSubmit={values => {
            // We want to return the Promise to the form,
            // so that it doesn't close its modal if an error is thrown.
            return onCompleteCaregiverEditListingWizardTab(tab, values, true);
          }}
          onNextTab={() =>
            redirectAfterDraftUpdate(listing.id.uuid, params, tab, marketplaceTabs, history)
          }
        />
      );
    }
    case PHOTOS: {
      const submitButtonTranslationKey = isNewListingFlow
        ? 'CaregiverEditListingWizard.saveNewPhotos'
        : 'CaregiverEditListingWizard.saveEditPhotos';

      return (
        <EditListingPhotosPanel
          {...panelProps(PHOTOS)}
          submitButtonText={intl.formatMessage({ id: submitButtonTranslationKey })}
          profileImage={profileImage}
          onImageUpload={onImageUpload}
          onRemoveImage={onRemoveImage}
          onSubmit={values => {
            onCompleteCaregiverEditListingWizardTab(tab, values);
          }}
          onUpdateImageOrder={onUpdateImageOrder}
          currentUser={currentUser}
          onProfileImageUpload={onProfileImageUpload}
          uploadInProgress={uploadInProgress}
        />
      );
    }
    default:
      return null;
  }
};

CaregiverEditListingWizardTab.defaultProps = {
  listing: null,
  updatedTab: null,
  availabilityExceptions: [],
  pageName: 'EditListingPage',
};

CaregiverEditListingWizardTab.propTypes = {
  params: shape({
    id: string.isRequired,
    slug: string.isRequired,
    type: oneOf(LISTING_PAGE_PARAM_TYPES).isRequired,
    tab: oneOf(SUPPORTED_TABS).isRequired,
  }).isRequired,
  availabilityExceptions: arrayOf(propTypes.availabilityException),
  errors: shape({
    createListingDraftError: object,
    publishListingError: object,
    updateListingError: object,
    showListingsError: object,
    uploadImageError: object,
    fetchExceptionsError: object,
    addExceptionError: object,
    deleteExceptionError: object,
  }).isRequired,
  fetchInProgress: bool.isRequired,
  fetchExceptionsInProgress: bool.isRequired,
  newListingPublished: bool.isRequired,
  history: shape({
    push: func.isRequired,
    replace: func.isRequired,
  }).isRequired,
  images: array.isRequired,
  pageName: string,

  // We cannot use propTypes.listing since the listing might be a draft.
  listing: shape({
    attributes: shape({
      publicData: object,
      description: string,
      geolocation: object,
      pricing: object,
      title: string,
    }),
    images: array,
  }),

  handleCreateFlowTabScrolling: func.isRequired,
  handlePublishListing: func.isRequired,
  onAddAvailabilityException: func.isRequired,
  onDeleteAvailabilityException: func.isRequired,
  onUpdateListing: func.isRequired,
  onCreateListingDraft: func.isRequired,
  onImageUpload: func.isRequired,
  onUpdateImageOrder: func.isRequired,
  onRemoveImage: func.isRequired,
  onChange: func.isRequired,
  updatedTab: string,
  updateInProgress: bool.isRequired,

  intl: intlShape.isRequired,
  profileImage: object,
};

export default CaregiverEditListingWizardTab;
