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
export const CAREGIVER_PREFERENCES = 'caregiver-preferences';
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
  CAREGIVER_PREFERENCES,
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
    fetchExceptionsError,
    fetchExceptionsInProgress,
    availabilityExceptions,
    addExceptionInProgress,
    onAddAvailabilityException,
    onDeleteAvailabilityException,
    currentUser,
    errors,
    fetchInProgress,
    handleCreateFlowTabScrolling,
    handlePublishListing,
    history,
    image,
    intl,
    listing: currentListing,
    marketplaceTabs,
    newListingPublished,
    onChange,
    onCreateListingDraft,
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
    onGenerateBio,
    generateBioInProgress,
    generateBioError,
    generatedBio,
    generateJobDescriptionInProgress,
    generateJobDescriptionError,
    generatedJobDescription,
    onGenerateJobDescription,
  } = props;

  const { type } = params;
  const isNewURI = type === LISTING_PAGE_PARAM_TYPE_NEW;
  const isDraftURI = type === LISTING_PAGE_PARAM_TYPE_DRAFT;
  const isNewListingFlow = isNewURI || isDraftURI;
  const userType = currentUser.attributes.profile.metadata.userType;

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
          window.scrollTo(0, 0);
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
      listing: currentListing,
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
            onCompleteEditListingWizardTab(CARE_TYPE, values);
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
            onCompleteEditListingWizardTab(BIO, values);
          }}
          onGenerateBio={onGenerateBio}
          generateBioInProgress={generateBioInProgress}
          generateBioError={generateBioError}
          generatedBio={generatedBio}
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
            onCompleteEditListingWizardTab(EXPERIENCE, values);
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
            onCompleteEditListingWizardTab(ADDITIONAL_DETAILS, values);
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
            onCompleteEditListingWizardTab(LOCATION, values);
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
            onCompleteEditListingWizardTab(PRICING, values);
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
          submitButtonText={intl.formatMessage({ id: submitButtonTranslationKey })}
          onSubmit={values => {
            // We want to return the Promise to the form,
            // so that it doesn't close its modal if an error is thrown.
            return onCompleteEditListingWizardTab(CARE_SCHEDULE, values, true);
          }}
          onNextTab={() =>
            redirectAfterDraftUpdate(currentListing.id?.uuid, params, tab, marketplaceTabs, history)
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
          submitButtonText={intl.formatMessage({ id: submitButtonTranslationKey })}
          fetchExceptionsInProgress={fetchExceptionsInProgress}
          availabilityExceptions={availabilityExceptions}
          addExceptionInProgress={addExceptionInProgress}
          onAddAvailabilityException={onAddAvailabilityException}
          onDeleteAvailabilityException={onDeleteAvailabilityException}
          fetchExceptionsError={fetchExceptionsError}
          onSubmit={values => {
            // We want to return the Promise to the form,
            // so that it doesn't close its modal if an error is thrown.
            return onCompleteEditListingWizardTab(AVAILABILITY, values, true);
          }}
          onNextTab={() =>
            redirectAfterDraftUpdate(currentListing.id?.uuid, params, tab, marketplaceTabs, history)
          }
        />
      );
    }
    case BACKGROUND_CHECK: {
      const submitButtonTranslationKey = 'EditListingWizard.saveNewBackgroundCheck';

      return (
        <EditListingBackgroundCheckPanel
          {...panelProps(BACKGROUND_CHECK)}
          onNextTab={() =>
            redirectAfterDraftUpdate(currentListing.id?.uuid, params, tab, marketplaceTabs, history)
          }
          onUpdateProfile={onUpdateProfile}
          submitButtonText={intl.formatMessage({ id: submitButtonTranslationKey })}
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
            onCompleteEditListingWizardTab(PROFILE_PICTURE, values);
          }}
          onUpdateImageOrder={onUpdateImageOrder}
          onProfileImageUpload={onProfileImageUpload}
          uploadInProgress={uploadInProgress}
          onUpdateProfile={onUpdateProfile}
          image={image}
          isNewListingFlow={isNewListingFlow}
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
            onCompleteEditListingWizardTab(CARE_RECIPIENT, values);
          }}
          onManageDisableScrolling={onManageDisableScrolling}
        />
      );
    }
    case CAREGIVER_PREFERENCES: {
      const submitButtonTranslationKey = isNewListingFlow
        ? 'EditListingWizard.saveNewCaregiverDetails'
        : 'EditListingWizard.saveEditCaregiverDetails';

      return (
        <EditListingCaregiverDetailsPanel
          {...panelProps(CAREGIVER_PREFERENCES)}
          submitButtonText={intl.formatMessage({ id: submitButtonTranslationKey })}
          onSubmit={values => {
            onCompleteEditListingWizardTab(CAREGIVER_PREFERENCES, values);
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
            onCompleteEditListingWizardTab(JOB_DESCRIPTION, values);
          }}
          generateJobDescriptionInProgress={generateJobDescriptionInProgress}
          generateJobDescriptionError={generateJobDescriptionError}
          generatedJobDescription={generatedJobDescription}
          onGenerateJobDescription={onGenerateJobDescription}
        />
      );
    }
    default:
      return null;
  }
};

export default EditListingWizardTab;
