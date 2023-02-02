import React from 'react';
import { array, arrayOf, bool, func, object, oneOf, shape, string } from 'prop-types';

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
  EditListingAdditionalDetailsPanel,
  EditListingAvailabilityPanel,
  EditListingBackgroundCheckPanel,
  EditListingBioPanel,
  EditListingCaregiverDetailsPanel,
  EditListingCareNeedsPanel,
  EditListingCareRecipientDetailsPanel,
  EditListingCareSchedulePanel,
  EditListingExperiencePanel,
  EditListingJobDescriptionPanel,
  EditListingLocationPanel,
  EditListingPhotosPanel,
  EditListingPricingPanel,
} from '..';

import css from './EditListingWizardTab.module.css';
import { CAREGIVER } from '../../util/constants';

export const CARE_TYPE = 'care-type';
export const SERVICES = 'services';
export const CARE_SCHEDULE = 'care-schedule';
export const AVAILABILITY = 'availability';
export const BIO = 'bio';
export const EXPERIENCE = 'experience';
export const ADDITIONAL_DETAILS = 'additional-details';
export const POLICY = 'policy';
export const LOCATION = 'location';
export const PRICING = 'pricing';
export const PROFILE_PICTURE = 'profile-picture';
export const CARE_RECIPIENT = 'care-recipient';
export const BACKGROUND_CHECK = 'background-check';
export const CAREIGVER_PREFERENCES = 'caregiver-preferences';
export const JOB_DESCRIPTION = 'job-description';

// EditListingWizardTab component supports these tabs
export const SUPPORTED_TABS = [
  CARE_TYPE,
  SERVICES,
  AVAILABILITY,
  BIO,
  EXPERIENCE,
  ADDITIONAL_DETAILS,
  POLICY,
  LOCATION,
  PRICING,
  CARE_SCHEDULE,
  PROFILE_PICTURE,
  CARE_RECIPIENT,
  CAREIGVER_PREFERENCES,
  BACKGROUND_CHECK,
  JOB_DESCRIPTION,
];

const pathParamsToNextTab = (params, tab, marketplaceTabs) => {
  const nextTabIndex = marketplaceTabs.findIndex(s => s === tab) + 1;
  const nextTab =
    nextTabIndex < marketplaceTabs.length
      ? marketplaceTabs[nextTabIndex]
      : marketplaceTabs[marketplaceTabs.length - 1];
  return { ...params, tab: nextTab };
};

const EditListingWizardTab = props => {
  const {
    availabilityExceptions,
    currentUser,
    errors,
    fetchExceptionsInProgress,
    fetchInProgress,
    handleCreateFlowTabScrolling,
    handlePublishListing,
    history,
    image,
    intl,
    listing,
    marketplaceTabs,
    newListingPublished,
    onAddAvailabilityException,
    onAuthenticateCreateUser,
    onChange,
    onCreateListingDraft,
    onDeleteAvailabilityException,
    onImageUpload,
    onManageDisableScrolling,
    onProfileImageUpload,
    onRemoveImage,
    onUpdateImageOrder,
    onUpdateListing,
    onUpdateProfile,
    pageName,
    params,
    profileImage,
    tab,
    updatedTab,
    updateInProgress,
    uploadInProgress,
    onAuthenticateSubmitConsent,
    onCreatePayment,
    createPaymentInProgress,
    createPaymentError,
    createPaymentSuccess,
    onGetIdentityProofQuiz,
    onVerifyIdentityProofQuiz,
    onCreatePaymentIntent,
    createPaymentIntentError,
    createPaymentIntentInProgress,
    paymentIntent,
    authenticate,
    onAuthenticateUpdateUser,
    onGetAuthenticateTestResult,
    onGenerateCriminalBackground,
    onGet7YearHistory,
  } = props;

  const { type } = params;
  const isNewURI = type === LISTING_PAGE_PARAM_TYPE_NEW;
  const isDraftURI = type === LISTING_PAGE_PARAM_TYPE_DRAFT;
  const isNewListingFlow = isNewURI || isDraftURI;
  const userType = currentUser && currentUser.attributes.profile.metadata.userType;

  const currentListing = ensureListing(listing);
  const imageIds = images => {
    return images ? images.map(img => img.imageId || img.id) : null;
  };

  // When user has update draft listing, he should be redirected to next EditListingWizardTab
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

    // Redirect to next tab
    const nextPathParams = pathParamsToNextTab(currentPathParams, tab, marketplaceTabs);

    const to = createResourceLocatorString(pageName || 'EditListingPage', routes, nextPathParams);
    console.log(to);
    history.push(to);
  };

  const onCompleteEditListingWizardTab = (tab, updateValues, passThrownErrors = false) => {
    // Normalize images for API call

    if (isNewListingFlow) {
      const onUpsertListingDraft = isNewURI
        ? (tab, updateValues) => {
            const userType = currentUser.attributes.profile.metadata.userType;
            updateValues.listingType = userType;
            return onCreateListingDraft(updateValues);
          }
        : onUpdateListing;

      const upsertValues = isNewURI ? updateValues : { ...updateValues, id: currentListing.id };

      return onUpsertListingDraft(tab, upsertValues)
        .then(r => {
          if (tab !== CARE_SCHEDULE && tab !== marketplaceTabs[marketplaceTabs.length - 1]) {
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
      return onUpdateListing(tab, { ...updateValues, id: currentListing.id });
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
      currentUser,
    };
  };

  switch (tab) {
    case CARE_TYPE: {
      const submitButtonTranslationKey = isNewListingFlow
        ? 'EditListingWizard.saveNewCareTypes'
        : 'EditListingWizard.saveEditCareTypes';
      return (
        <EditListingCareNeedsPanel
          {...panelProps(CARE_TYPE)}
          submitButtonText={intl.formatMessage({ id: submitButtonTranslationKey })}
          onSubmit={values => {
            onCompleteEditListingWizardTab(tab, values);
          }}
        />
      );
    }
    case SERVICES: {
      const submitButtonTranslationKey = isNewListingFlow
        ? 'EditListingWizard.saveNewServices'
        : 'EditListingWizard.saveEditServices';
      return (
        <EditListingCareNeedsPanel
          {...panelProps(SERVICES)}
          submitButtonText={intl.formatMessage({ id: submitButtonTranslationKey })}
          onSubmit={values => {
            onCompleteEditListingWizardTab(tab, values);
          }}
        />
      );
    }
    case BIO: {
      const submitButtonTranslationKey = isNewListingFlow
        ? 'EditListingWizard.saveNewBio'
        : 'EditListingWizard.saveEditBio';
      return (
        <EditListingBioPanel
          {...panelProps(BIO)}
          submitButtonText={intl.formatMessage({ id: submitButtonTranslationKey })}
          onSubmit={values => {
            onCompleteEditListingWizardTab(tab, values);
          }}
        />
      );
    }
    case EXPERIENCE: {
      const submitButtonTranslationKey = isNewListingFlow
        ? 'EditListingWizard.saveNewExperience'
        : 'EditListingWizard.saveEditExperience';
      return (
        <EditListingExperiencePanel
          {...panelProps(EXPERIENCE)}
          submitButtonText={intl.formatMessage({ id: submitButtonTranslationKey })}
          onSubmit={values => {
            onCompleteEditListingWizardTab(tab, values);
          }}
        />
      );
    }
    case ADDITIONAL_DETAILS: {
      const submitButtonTranslationKey = isNewListingFlow
        ? 'EditListingWizard.saveNewAdditionalDetails'
        : 'EditListingWizard.saveEditAdditionalDetails';
      return (
        <EditListingAdditionalDetailsPanel
          {...panelProps(ADDITIONAL_DETAILS)}
          submitButtonText={intl.formatMessage({ id: submitButtonTranslationKey })}
          onSubmit={values => {
            onCompleteEditListingWizardTab(tab, values);
          }}
        />
      );
    }
    case LOCATION: {
      const submitButtonTranslationKey =
        userType === CAREGIVER
          ? isNewListingFlow
            ? 'EditListingWizard.saveNewCaregiverLocation'
            : 'EditListingWizard.saveEditLocation'
          : isNewListingFlow
          ? 'EditListingWizard.saveNewEmployerLocation'
          : 'EditListingWizard.saveEditLocation';
      return (
        <EditListingLocationPanel
          {...panelProps(LOCATION)}
          submitButtonText={intl.formatMessage({ id: submitButtonTranslationKey })}
          onSubmit={values => {
            onCompleteEditListingWizardTab(tab, values);
          }}
        />
      );
    }
    case PRICING: {
      const submitButtonTranslationKey =
        userType === CAREGIVER
          ? isNewListingFlow
            ? 'EditListingWizard.saveNewCaregiverPricing'
            : 'EditListingWizard.saveEditPricing'
          : isNewListingFlow
          ? 'EditListingWizard.saveNewEmployerPricing'
          : 'EditListingWizard.saveEditPricing';
      return (
        <EditListingPricingPanel
          {...panelProps(PRICING)}
          submitButtonText={intl.formatMessage({ id: submitButtonTranslationKey })}
          onSubmit={values => {
            onCompleteEditListingWizardTab(tab, values);
          }}
        />
      );
    }
    case CARE_SCHEDULE: {
      const submitButtonTranslationKey = isNewListingFlow
        ? 'EditListingWizard.saveNewCareSchedule'
        : 'EditListingWizard.saveEditCareSchedule';
      return (
        <EditListingCareSchedulePanel
          {...panelProps(CARE_SCHEDULE)}
          fetchExceptionsInProgress={fetchExceptionsInProgress}
          availabilityExceptions={availabilityExceptions}
          submitButtonText={intl.formatMessage({ id: submitButtonTranslationKey })}
          onAddAvailabilityException={onAddAvailabilityException}
          onDeleteAvailabilityException={onDeleteAvailabilityException}
          onSubmit={values => {
            // We want to return the Promise to the form,
            // so that it doesn't close its modal if an error is thrown.
            return onCompleteEditListingWizardTab(tab, values, true);
          }}
          onNextTab={() =>
            redirectAfterDraftUpdate(listing.id.uuid, params, tab, marketplaceTabs, history)
          }
        />
      );
    }
    case AVAILABILITY: {
      const submitButtonTranslationKey = isNewListingFlow
        ? 'EditListingWizard.saveNewAvailability'
        : 'EditListingWizard.saveEditAvailability';
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
            return onCompleteEditListingWizardTab(tab, values, true);
          }}
          onNextTab={() =>
            redirectAfterDraftUpdate(listing.id.uuid, params, tab, marketplaceTabs, history)
          }
        />
      );
    }
    case BACKGROUND_CHECK: {
      const submitButtonTranslationKey = 'EditListingWizard.saveNewBackgroundCheck';

      return (
        <EditListingBackgroundCheckPanel
          {...panelProps(BACKGROUND_CHECK)}
          submitButtonText={intl.formatMessage({ id: submitButtonTranslationKey })}
          onSubmit={values => {
            onCompleteEditListingWizardTab(tab, values);
          }}
          onAuthenticateCreateUser={onAuthenticateCreateUser}
          onAuthenticateSubmitConsent={onAuthenticateSubmitConsent}
          onCreatePayment={onCreatePayment}
          createPaymentInProgress={createPaymentInProgress}
          createPaymentError={createPaymentError}
          createPaymentSuccess={createPaymentSuccess}
          onUpdateProfile={onUpdateProfile}
          onGetIdentityProofQuiz={onGetIdentityProofQuiz}
          onVerifyIdentityProofQuiz={onVerifyIdentityProofQuiz}
          onNextTab={() =>
            redirectAfterDraftUpdate(listing.id.uuid, params, tab, marketplaceTabs, history)
          }
          onCreatePaymentIntent={onCreatePaymentIntent}
          createPaymentIntentError={createPaymentIntentError}
          createPaymentIntentInProgress={createPaymentIntentInProgress}
          paymentIntent={paymentIntent}
          authenticate={authenticate}
          onAuthenticateUpdateUser={onAuthenticateUpdateUser}
          onGetAuthenticateTestResult={onGetAuthenticateTestResult}
          onGenerateCriminalBackground={onGenerateCriminalBackground}
          onGet7YearHistory={onGet7YearHistory}
        />
      );
    }
    case PROFILE_PICTURE: {
      const submitButtonTranslationKey = isNewListingFlow
        ? 'EditListingWizard.saveNewPhotos'
        : 'EditListingWizard.saveEditPhotos';

      return (
        <EditListingPhotosPanel
          {...panelProps(PROFILE_PICTURE)}
          submitButtonText={intl.formatMessage({ id: submitButtonTranslationKey })}
          profileImage={profileImage}
          onImageUpload={onImageUpload}
          onRemoveImage={onRemoveImage}
          onSubmit={values => {
            onCompleteEditListingWizardTab(tab, values);
          }}
          onUpdateImageOrder={onUpdateImageOrder}
          onProfileImageUpload={onProfileImageUpload}
          uploadInProgress={uploadInProgress}
          onUpdateProfile={onUpdateProfile}
          image={image}
        />
      );
    }
    case CARE_RECIPIENT: {
      const submitButtonTranslationKey = isNewListingFlow
        ? 'EditListingWizard.saveNewCareRecipient'
        : 'EditListingWizard.saveEditCareRecipient';

      return (
        <EditListingCareRecipientDetailsPanel
          {...panelProps(CARE_RECIPIENT)}
          submitButtonText={intl.formatMessage({ id: submitButtonTranslationKey })}
          onSubmit={values => {
            onCompleteEditListingWizardTab(tab, values);
          }}
          onManageDisableScrolling={onManageDisableScrolling}
        />
      );
    }
    case CAREIGVER_PREFERENCES: {
      const submitButtonTranslationKey = isNewListingFlow
        ? 'EditListingWizard.saveNewCaregiverDetails'
        : 'EditListingWizard.saveEditCaregiverDetails';

      return (
        <EditListingCaregiverDetailsPanel
          {...panelProps(CAREIGVER_PREFERENCES)}
          submitButtonText={intl.formatMessage({ id: submitButtonTranslationKey })}
          onSubmit={values => {
            onCompleteEditListingWizardTab(tab, values);
          }}
        />
      );
    }
    case JOB_DESCRIPTION: {
      const submitButtonTranslationKey = isNewListingFlow
        ? 'EditListingWizard.saveNewJobDescription'
        : 'EditListingWizard.saveEditJobDescription';

      return (
        <EditListingJobDescriptionPanel
          {...panelProps(JOB_DESCRIPTION)}
          submitButtonText={intl.formatMessage({ id: submitButtonTranslationKey })}
          onSubmit={values => {
            onCompleteEditListingWizardTab(tab, values);
          }}
        />
      );
    }
    default:
      return null;
  }
};

EditListingWizardTab.defaultProps = {
  listing: null,
  updatedTab: null,
  availabilityExceptions: [],
  pageName: 'EditListingPage',
};

EditListingWizardTab.propTypes = {
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
  onUpdateListing: func.isRequired,
  onCreateListingDraft: func.isRequired,
  onChange: func.isRequired,
  updatedTab: string,
  updateInProgress: bool.isRequired,

  intl: intlShape.isRequired,
  profileImage: object,
};

export default EditListingWizardTab;
