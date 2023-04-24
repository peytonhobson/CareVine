import React, { useMemo } from 'react';
import { bool, func, object, shape, string, oneOf } from 'prop-types';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import { intlShape, injectIntl } from '../../util/reactIntl';
import { connect } from 'react-redux';
import { types as sdkTypes } from '../../util/sdkLoader';
import {
  LISTING_PAGE_PARAM_TYPE_DRAFT,
  LISTING_PAGE_PARAM_TYPE_NEW,
  LISTING_PAGE_PARAM_TYPE_EDIT,
  LISTING_PAGE_PARAM_TYPES,
  LISTING_PAGE_PENDING_APPROVAL_VARIANT,
  createSlug,
  getListingType,
} from '../../util/urlHelpers';
import { LISTING_STATE_DRAFT, LISTING_STATE_PENDING_APPROVAL, propTypes } from '../../util/types';
import { ensureOwnListing, ensureCurrentUser } from '../../util/data';
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { manageDisableScrolling, isScrollingDisabled } from '../../ducks/UI.duck';
import {
  CaregiverEditListingWizard,
  EmployerEditListingWizard,
  Footer,
  NamedRedirect,
  Page,
  UserNav,
} from '../../components';
import { TopbarContainer } from '../../containers';
import { CAREGIVER, EMPLOYER } from '../../util/constants';
import { createResourceLocatorString } from '../../util/routes';
import routeConfiguration from '../../routeConfiguration';

import {
  requestAddAvailabilityException,
  requestDeleteAvailabilityException,
  requestCreateListingDraft,
  requestPublishListingDraft,
  requestUpdateListing,
  clearUpdatedTab,
} from './EditListingPage.duck';
import { updateProfile, uploadImage } from '../ProfileSettingsPage/ProfileSettingsPage.duck';
import { changeModalValue } from '../TopbarContainer/TopbarContainer.duck';
import { fetchCurrentUserHasListings } from '../../ducks/user.duck';
import { useCheckMobileScreen } from '../../util/hooks';

import css from './EditListingPage.module.css';

const STRIPE_ONBOARDING_RETURN_URL_SUCCESS = 'success';
const STRIPE_ONBOARDING_RETURN_URL_FAILURE = 'failure';
const STRIPE_ONBOARDING_RETURN_URL_TYPES = [
  STRIPE_ONBOARDING_RETURN_URL_SUCCESS,
  STRIPE_ONBOARDING_RETURN_URL_FAILURE,
];

const { UUID } = sdkTypes;

// N.B. All the presentational content needs to be extracted to their own components
export const EditListingPageComponent = props => {
  const {
    createStripeAccountError,
    currentUser,
    getOwnListing,
    history,
    image,
    intl,
    page,
    params,
    scrollingDisabled,
    uploadImageError,
    currentUserListing,
    ...rest
  } = props;

  const isMobile = useCheckMobileScreen();

  const { id, type, returnURLType } = params;

  const isNewURI = type === LISTING_PAGE_PARAM_TYPE_NEW;
  const isDraftURI = type === LISTING_PAGE_PARAM_TYPE_DRAFT;
  const isNewListingFlow = isNewURI || isDraftURI;

  if (isNewListingFlow && history.location.pathname.includes('/l/')) {
    history.replace(history.location.pathname.replace('/l/', '/create-profile/'));
  }

  const ensuredCurrentUser = ensureCurrentUser(currentUser);
  const userType = ensuredCurrentUser.attributes.profile.metadata.userType;

  const listingId = page.submittedListingId || (id ? new UUID(id) : null);
  const listing = getOwnListing(listingId);
  const currentListing = ensureOwnListing(listing);

  const { state: currentListingState } = currentListing.attributes;

  const isListingDraft = currentListingState === LISTING_PAGE_PARAM_TYPE_DRAFT;

  if (currentUserListing?.id?.uuid && (type !== getListingType(isListingDraft) || isNewURI)) {
    return (
      <NamedRedirect
        name="EditListingPage"
        params={{
          id: currentUserListing.id.uuid ?? ' ',
          slug: createSlug(currentUserListing.attributes.title),
          type: getListingType(isListingDraft),
          tab: userType === 'employer' ? 'care-type' : 'services',
        }}
      />
    );
  }

  const isPastDraft = currentListingState && currentListingState !== LISTING_STATE_DRAFT;
  const shouldRedirect = isNewListingFlow && listingId && isPastDraft;

  const hasStripeOnboardingDataIfNeeded = returnURLType ? !!ensuredCurrentUser.id : true;
  const showForm = hasStripeOnboardingDataIfNeeded && (isNewURI || currentListing.id);

  const createProfile = history.location.pathname.includes('create-profile');
  const isPublished = currentListingState && currentListingState !== LISTING_STATE_DRAFT;

  if (shouldRedirect) {
    const isPendingApproval =
      currentListing && currentListingState === LISTING_STATE_PENDING_APPROVAL;

    // If page has already listingId (after submit) and current listings exist
    // redirect to listing page
    const listingSlug = currentListing ? createSlug(currentListing.attributes.title) : null;

    const redirectProps = isPendingApproval
      ? {
          name: 'ListingPageVariant',
          params: {
            id: listingId.uuid,
            slug: listingSlug,
            variant: LISTING_PAGE_PENDING_APPROVAL_VARIANT,
          },
        }
      : {
          name: 'ListingPage',
          params: {
            id: listingId.uuid,
            slug: listingSlug,
          },
        };

    return <NamedRedirect {...redirectProps} />;
  } else if ((isNewURI && currentListing.id?.uuid) || (createProfile && isPublished)) {
    // If we allow only one listing per provider, we need to redirect to correct listing.

    return (
      <NamedRedirect
        name="EditListingPage"
        params={{
          id: currentListing.id?.uuid ?? ' ',
          slug: createSlug(currentListing.attributes.title),
          type: LISTING_PAGE_PARAM_TYPE_EDIT,
          tab: userType === 'employer' ? 'care-type' : 'services',
        }}
      />
    );
  } else if (showForm) {
    const {
      createListingDraftError = null,
      publishListingError = null,
      updateListingError = null,
      showListingsError = null,
      fetchExceptionsError = null,
      addExceptionError = null,
      deleteExceptionError = null,
    } = page;
    const errors = {
      createListingDraftError,
      publishListingError,
      updateListingError,
      showListingsError,
      uploadImageError,
      createStripeAccountError,
      fetchExceptionsError,
      addExceptionError,
      deleteExceptionError,
    };

    const newListingPublished =
      isDraftURI && currentListing && currentListingState !== LISTING_STATE_DRAFT;

    const profileImageId = ensuredCurrentUser.profileImage
      ? ensuredCurrentUser.profileImage.id
      : null;
    const profileImage = image || { imageId: profileImageId };

    const title = isNewListingFlow
      ? intl.formatMessage({ id: 'EditListingPage.titleCreateListing' })
      : intl.formatMessage({ id: 'EditListingPage.titleEditListing' });

    let editListingWizard = null;

    const userType = ensuredCurrentUser.attributes.profile.metadata.userType;

    if (userType === CAREGIVER) {
      editListingWizard = (
        <CaregiverEditListingWizard
          {...rest}
          availabilityExceptions={page.availabilityExceptions}
          className={css.wizard}
          currentUser={ensuredCurrentUser}
          errors={errors}
          history={history}
          id="CaregiverEditListingWizard"
          image={image}
          listing={currentListing}
          newListingPublished={newListingPublished}
          pageName={createProfile ? 'CreateProfilePage' : 'EditListingPage'}
          params={params}
          profileImage={profileImage}
          stripeOnboardingReturnURL={params.returnURLType}
          updatedTab={page.updatedTab}
          updateInProgress={page.updateInProgress || page.createListingDraftInProgress}
          payoutDetailsSaveInProgress={page.payoutDetailsSaveInProgress}
          payoutDetailsSaved={page.payoutDetailsSaved}
          isMobile={isMobile}
        />
      );
    } else if (userType === EMPLOYER) {
      editListingWizard = (
        <EmployerEditListingWizard
          {...rest}
          availabilityExceptions={page.availabilityExceptions}
          className={css.wizard}
          currentUser={ensuredCurrentUser}
          errors={errors}
          fetchExceptionsInProgress={page.fetchExceptionsInProgress}
          history={history}
          id="EmployerEditListingWizard"
          image={image}
          listing={currentListing}
          newListingPublished={newListingPublished}
          pageName={createProfile ? 'CreateProfilePage' : 'EditListingPage'}
          params={params}
          profileImage={profileImage}
          updatedTab={page.updatedTab}
          updateInProgress={page.updateInProgress || page.createListingDraftInProgress}
          isMobile={isMobile}
        />
      );
    } else {
      const loadingPageMsg = {
        id: 'CreateProfilePage.loadingListingData',
      };
      editListingWizard = (
        <Page
          title={intl.formatMessage(loadingPageMsg)}
          scrollingDisabled={scrollingDisabled}
        ></Page>
      );
    }

    return (
      <Page title={title} scrollingDisabled={scrollingDisabled}>
        {!createProfile && (
          <TopbarContainer
            className={css.topbar}
            mobileRootClassName={css.mobileTopbar}
            desktopClassName={css.desktopTopbar}
            mobileClassName={css.mobileTopbar}
          />
        )}
        {!createProfile && (
          <UserNav
            selectedPageName={currentListing ? 'EditListingPage' : 'NewListingPage'}
            listing={listing}
          />
        )}

        {editListingWizard}
        {!createProfile && <Footer />}
      </Page>
    );
  } else {
    // If user has come to this page through a direct linkto edit existing listing,
    // we need to load it first.
    const loadingPageMsg = {
      id: 'EditListingPage.loadingListingData',
    };
    return (
      <Page title={intl.formatMessage(loadingPageMsg)} scrollingDisabled={scrollingDisabled}>
        {!createProfile && currentListing.id?.uuid && (
          <TopbarContainer
            className={css.topbar}
            mobileRootClassName={css.mobileTopbar}
            desktopClassName={css.desktopTopbar}
            mobileClassName={css.mobileTopbar}
          />
        )}
        {!createProfile && currentListing.id?.uuid && (
          <UserNav
            selectedPageName={currentListing ? 'EditListingPage' : 'NewListingPage'}
            listing={currentListing}
          />
        )}
        <div className={css.placeholderWhileLoading} />
        {!createProfile && currentListing.id?.uuid && <Footer />}
      </Page>
    );
  }
};

EditListingPageComponent.defaultProps = {
  createStripeAccountError: null,
  fetchStripeAccountError: null,
  getAccountLinkError: null,
  getAccountLinkInProgress: null,
  stripeAccountFetched: null,
  currentUser: null,
  stripeAccount: null,
  currentUserHasOrders: null,
  listing: null,
  listingDraft: null,
  notificationCount: 0,
  sendVerificationEmailError: null,
};

EditListingPageComponent.propTypes = {
  createStripeAccountError: propTypes.error,
  fetchStripeAccountError: propTypes.error,
  getAccountLinkError: propTypes.error,
  getAccountLinkInProgress: bool,
  updateStripeAccountError: propTypes.error,
  currentUser: propTypes.currentUser,
  getOwnListing: func.isRequired,
  onAddAvailabilityException: func.isRequired,
  onDeleteAvailabilityException: func.isRequired,
  onCreateListingDraft: func.isRequired,
  onPublishListingDraft: func.isRequired,
  onManageDisableScrolling: func.isRequired,
  onUpdateListing: func.isRequired,
  onChange: func.isRequired,
  page: object.isRequired,
  params: shape({
    id: string.isRequired,
    slug: string.isRequired,
    type: oneOf(LISTING_PAGE_PARAM_TYPES).isRequired,
    tab: string.isRequired,
    form: string,
    returnURLType: oneOf(STRIPE_ONBOARDING_RETURN_URL_TYPES),
  }).isRequired,
  stripeAccountFetched: bool,
  stripeAccount: object,
  scrollingDisabled: bool.isRequired,

  /* from withRouter */
  history: shape({
    push: func.isRequired,
  }).isRequired,

  /* from injectIntl */
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  const page = state.EditListingPage;
  const { image, uploadInProgress, uploadImageError } = state.ProfileSettingsPage;

  const { createStripeAccountInProgress, createStripeAccountError } = state.stripeConnectAccount;

  const { currentUser, currentUserListing } = state.user;

  const fetchInProgress = createStripeAccountInProgress;

  const getOwnListing = id => {
    const listings = getMarketplaceEntities(state, [{ id, type: 'ownListing' }]);

    return listings.length === 1 ? listings[0] : null;
  };

  return {
    createStripeAccountError,
    currentUser,
    fetchInProgress,
    getOwnListing,
    image,
    page,
    scrollingDisabled: isScrollingDisabled(state),
    uploadImageError,
    uploadInProgress,
    currentUserListing,
  };
};

const mapDispatchToProps = {
  onAddAvailabilityException: requestAddAvailabilityException,
  onChange: clearUpdatedTab,
  onChangeMissingInfoModal: changeModalValue,
  onCreateListingDraft: requestCreateListingDraft,
  onDeleteAvailabilityException: requestDeleteAvailabilityException,
  onFetchCurrentUserHasListings: fetchCurrentUserHasListings,
  onManageDisableScrolling: manageDisableScrolling,
  onProfileImageUpload: uploadImage,
  onPublishListingDraft: requestPublishListingDraft,
  onUpdateListing: requestUpdateListing,
  onUpdateProfile: updateProfile,
};

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const EditListingPage = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(injectIntl(EditListingPageComponent));

export default EditListingPage;
