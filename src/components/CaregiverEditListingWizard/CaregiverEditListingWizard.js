import React, { Component } from 'react';
import { array, bool, func, number, object, oneOf, shape, string } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl, intlShape } from '../../util/reactIntl';
import classNames from 'classnames';
import { withViewport } from '../../util/contextHelpers';
import { propTypes } from '../../util/types';
import {
  LISTING_PAGE_PARAM_TYPE_DRAFT,
  LISTING_PAGE_PARAM_TYPE_NEW,
  LISTING_PAGE_PARAM_TYPES,
} from '../../util/urlHelpers';

import { NamedRedirect, Tabs, ModalMissingInformation } from '..';
import { BACKGROUND_CHECK_APPROVED, MISSING_REQUIREMENTS_INITIAL } from '../../util/constants';
import { stripeCustomer } from '../../containers/PaymentMethodsPage/PaymentMethodsPage.duck.js';

import EditListingWizardTab, {
  SERVICES,
  AVAILABILITY,
  BIO,
  EXPERIENCE,
  ADDITIONAL_DETAILS,
  LOCATION,
  PRICING,
  PROFILE_PICTURE,
} from '../EditListingWizardTab/EditListingWizardTab';
import {
  requestAddAvailabilityException,
  requestDeleteAvailabilityException,
} from '../../containers/EditListingPage/EditListingPage.duck';
import { generateBio } from '../../ducks/chatGPT.duck';

import css from './CaregiverEditListingWizard.module.css';

// You can reorder these panels.
// Note 1: You need to change save button translations for new listing flow
// Note 2: Ensure that draft listing is created after the first panel
// and listing publishing happens after last panel.
// Note 3: in FTW-hourly template we don't use the POLICY tab so it's commented out.
// If you want to add a free text field to your listings you can enable the POLICY tab
export const TABS = [
  SERVICES,
  LOCATION,
  AVAILABILITY,
  PRICING,
  EXPERIENCE,
  ADDITIONAL_DETAILS,
  BIO,
  PROFILE_PICTURE,
];

// Tabs are horizontal in small screens
const MAX_HORIZONTAL_NAV_SCREEN_WIDTH = 1023;

const tabLabel = (intl, tab) => {
  let key = null;
  if (tab === SERVICES) {
    key = 'CaregiverEditListingWizard.tabLabelServices';
  } else if (tab === BIO) {
    key = 'CaregiverEditListingWizard.tabLabelBio';
  } else if (tab === EXPERIENCE) {
    key = 'CaregiverEditListingWizard.tabLabelExperience';
  } else if (tab === ADDITIONAL_DETAILS) {
    key = 'CaregiverEditListingWizard.tabLabelAdditionalDetails';
  } else if (tab === LOCATION) {
    key = 'CaregiverEditListingWizard.tabLabelLocation';
  } else if (tab === PRICING) {
    key = 'CaregiverEditListingWizard.tabLabelPricing';
  } else if (tab === AVAILABILITY) {
    key = 'CaregiverEditListingWizard.tabLabelAvailability';
  } else if (tab === PROFILE_PICTURE) {
    key = 'CaregiverEditListingWizard.tabLabelPhotos';
  }

  return intl.formatMessage({ id: key });
};

/**
 * Check if a wizard tab is completed.
 *
 * @param tab wizard's tab
 * @param listing is contains some specific data if tab is completed
 *
 * @return true if tab / step is completed.
 */
const tabCompleted = (tab, listing, user) => {
  const { description, geolocation, publicData, availabilityPlan } = listing.attributes;
  const images = listing.images;

  switch (tab) {
    case SERVICES:
      return !!publicData.careTypes;
    case BIO:
      return !!description;
    case EXPERIENCE:
      return !!publicData.experienceLevel;
    case ADDITIONAL_DETAILS:
      return !!publicData.languagesSpoken;
    case LOCATION:
      return !!(geolocation && publicData.location && publicData.travelDistance != undefined);
    case PRICING:
      return !!(publicData.minPrice && publicData.maxPrice);
    case AVAILABILITY:
      return !!publicData.availabilityPlan;
    case PROFILE_PICTURE:
      return images && images.length > 0;
    default:
      return false;
  }
};

/**
 * Check which wizard tabs are active and which are not yet available. Tab is active if previous
 * tab is completed. In edit mode all tabs are active.
 *
 * @param isNew flag if a new listing is being created or an old one being edited
 * @param listing data to be checked
 *
 * @return object containing activity / editability of different tabs of this wizard
 */
const tabsActive = (isNew, listing, user) => {
  return TABS.reduce((acc, tab) => {
    const previousTabIndex = TABS.findIndex(t => t === tab) - 1;
    const isActive =
      previousTabIndex >= 0 ? !isNew || tabCompleted(TABS[previousTabIndex], listing, user) : true;
    return { ...acc, [tab]: isActive };
  }, {});
};

const scrollToTab = (tabPrefix, tabId) => {
  const el = document.querySelector(`#${tabPrefix}_${tabId}`);
  if (el) {
    el.scrollIntoView({
      block: 'start',
      behavior: 'smooth',
    });
  }
};

// Create a new or edit listing through CaregiverEditListingWizard
class CaregiverEditListingWizard extends Component {
  constructor(props) {
    super(props);

    // Having this info in state would trigger unnecessary rerendering
    this.hasScrolledToTab = false;

    this.state = {
      draftId: null,
      showPayoutDetails: false,
      portalRoot: null,
      missingInformationModalValue: null,
    };
    this.handleCreateFlowTabScrolling = this.handleCreateFlowTabScrolling.bind(this);
    this.handlePublishListing = this.handlePublishListing.bind(this);
    this.handlePayoutModalClose = this.handlePayoutModalClose.bind(this);
  }

  componentDidMount() {
    const { stripeOnboardingReturnURL, params } = this.props;

    if (stripeOnboardingReturnURL != null && !this.showPayoutDetails) {
      this.setState({ showPayoutDetails: true });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { history } = this.props;

    if (
      prevState.missingInformationModalValue === MISSING_REQUIREMENTS_INITIAL &&
      this.state.missingInformationModalValue === null
    ) {
      history.push('/');
    }
  }

  handleCreateFlowTabScrolling(shouldScroll) {
    this.hasScrolledToTab = shouldScroll;
  }

  handlePayoutModalClose() {
    const { history, onFetchCurrentUserHasListings } = this.props;

    this.setState({ showPayoutDetails: false });

    onFetchCurrentUserHasListings();
    if (history.location.pathname.includes('create-profile')) {
      history.push('/signup');
    } else {
      history.push('/l');
    }
  }

  handlePublishListing(id) {
    const {
      onPublishListingDraft,
      currentUser,
      onChangeMissingInfoModal,
      history,
      onFetchCurrentUserHasListings,
    } = this.props;

    onPublishListingDraft(id);

    const backgroundCheckApproved =
      currentUser?.attributes.profile.metadata.backgroundCheckApproved?.status ===
      BACKGROUND_CHECK_APPROVED;
    const emailVerified = currentUser?.attributes.emailVerified;

    if (!backgroundCheckApproved) {
      this.setState({ missingInformationModalValue: MISSING_REQUIREMENTS_INITIAL });
      onFetchCurrentUserHasListings();
    } else if (!emailVerified) {
      history.push('/signup');
      onFetchCurrentUserHasListings();
    } else {
      history.push('/');
      onFetchCurrentUserHasListings();
    }
  }

  render() {
    const {
      className,
      createStripeAccountError,
      currentUser,
      errors,
      fetchInProgress,
      fetchStripeAccountError,
      getAccountLinkInProgress,
      id,
      intl,
      listing: currentListing,
      onGetStripeConnectAccountLink,
      onManageDisableScrolling,
      onPayoutDetailsFormChange,
      onProfileImageUpload,
      onUpdateProfile,
      pageName,
      params,
      payoutDetailsSaved,
      payoutDetailsSaveInProgress,
      profileImage,
      rootClassName,
      stripeAccount,
      stripeAccountFetched,
      stripeAccountLinkError,
      updateStripeAccountError,
      uploadInProgress,
      viewport,
      ...rest
    } = this.props;

    const selectedTab = params.tab;
    const isNewListingFlow = [LISTING_PAGE_PARAM_TYPE_NEW, LISTING_PAGE_PARAM_TYPE_DRAFT].includes(
      params.type
    );
    const rootClasses = rootClassName || css.root;
    const classes = classNames(rootClasses, className);
    const tabsStatus = tabsActive(isNewListingFlow, currentListing, currentUser);

    // If selectedTab is not active, redirect to the beginning of wizard
    if (!tabsStatus[selectedTab]) {
      const currentTabIndex = TABS.indexOf(selectedTab);
      const nearestActiveTab = TABS.slice(0, currentTabIndex)
        .reverse()
        .find(t => tabsStatus[t]);

      return (
        <NamedRedirect
          name={pageName || 'EditListingPage'}
          params={{ ...params, tab: nearestActiveTab }}
        />
      );
    }

    const { width } = viewport;
    const hasViewport = width > 0;
    const hasHorizontalTabLayout = hasViewport && width <= MAX_HORIZONTAL_NAV_SCREEN_WIDTH;
    const hasVerticalTabLayout = hasViewport && width > MAX_HORIZONTAL_NAV_SCREEN_WIDTH;
    const hasFontsLoaded =
      hasViewport && document.documentElement.classList.contains('fontsLoaded');

    // Check if scrollToTab call is needed (tab is not visible on mobile)
    if (hasVerticalTabLayout) {
      this.hasScrolledToTab = true;
    } else if (hasHorizontalTabLayout && !this.hasScrolledToTab && hasFontsLoaded) {
      const tabPrefix = id;
      scrollToTab(tabPrefix, selectedTab);
      this.hasScrolledToTab = true;
    }

    const tabLink = tab => {
      return { name: pageName || 'EditListingPage', params: { ...params, tab } };
    };

    const setPortalRootAfterInitialRender = () => {
      if (!this.state.portalRoot) {
        this.setState({ portalRoot: document.getElementById('portal-root') });
      }
    };
    const { returnURLType, ...pathParams } = params;

    return (
      <div className={classes} ref={setPortalRootAfterInitialRender}>
        <Tabs
          rootClassName={css.tabsContainer}
          navRootClassName={css.nav}
          tabRootClassName={css.tab}
        >
          {TABS.map(tab => {
            return (
              <EditListingWizardTab
                {...rest}
                key={tab}
                tabId={`${id}_${tab}`}
                tabLabel={tabLabel(intl, tab)}
                tabLinkProps={tabLink(tab)}
                selected={selectedTab === tab}
                disabled={isNewListingFlow && !tabsStatus[tab]}
                tab={tab}
                intl={intl}
                params={params}
                listing={currentListing}
                marketplaceTabs={TABS}
                errors={errors}
                handleCreateFlowTabScrolling={this.handleCreateFlowTabScrolling}
                handlePublishListing={this.handlePublishListing}
                fetchInProgress={fetchInProgress}
                onManageDisableScrolling={onManageDisableScrolling}
                pageName={pageName}
                profileImage={profileImage}
                currentUser={currentUser}
                onProfileImageUpload={onProfileImageUpload}
                uploadInProgress={uploadInProgress}
                onUpdateProfile={onUpdateProfile}
              />
            );
          })}
        </Tabs>
        <ModalMissingInformation
          id="MissingInformationReminder"
          containerClassName={css.missingInformationModal}
          currentUser={currentUser}
          currentUserListing={{
            ...currentListing,
            attributes: {
              ...currentListing.attributes,
              state: 'published',
            },
          }}
          location={location}
          onManageDisableScrolling={onManageDisableScrolling}
          modalValue={this.state.missingInformationModalValue}
          onChangeModalValue={value => this.setState({ missingInformationModalValue: value })}
        />
      </div>
    );
  }
}

CaregiverEditListingWizard.defaultProps = {
  className: null,
  currentUser: null,
  rootClassName: null,
  listing: null,
  stripeAccount: null,
  stripeAccountFetched: null,
  updateInProgress: false,
  createStripeAccountError: null,
  updateStripeAccountError: null,
  fetchStripeAccountError: null,
  stripeAccountError: null,
  stripeAccountLinkError: null,
  pageName: 'EditListingPage',
};

CaregiverEditListingWizard.propTypes = {
  id: string.isRequired,
  className: string,
  currentUser: propTypes.currentUser,
  rootClassName: string,
  params: shape({
    id: string.isRequired,
    slug: string.isRequired,
    type: oneOf(LISTING_PAGE_PARAM_TYPES).isRequired,
    tab: oneOf(TABS).isRequired,
  }).isRequired,
  stripeAccount: object,
  stripeAccountFetched: bool,

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

  errors: shape({
    createListingDraftError: object,
    updateListingError: object,
    publishListingError: object,
    showListingsError: object,
    uploadImageError: object,
  }).isRequired,
  createStripeAccountError: propTypes.error,
  updateStripeAccountError: propTypes.error,
  fetchStripeAccountError: propTypes.error,
  stripeAccountError: propTypes.error,
  stripeAccountLinkError: propTypes.error,

  fetchInProgress: bool.isRequired,
  getAccountLinkInProgress: bool.isRequired,
  payoutDetailsSaveInProgress: bool.isRequired,
  payoutDetailsSaved: bool.isRequired,
  onPayoutDetailsFormChange: func.isRequired,
  onGetStripeConnectAccountLink: func.isRequired,
  onManageDisableScrolling: func.isRequired,

  // from withViewport
  viewport: shape({
    width: number.isRequired,
    height: number.isRequired,
  }).isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
  profileImage: object,
};

const mapStateToProps = state => {
  const { generateBioInProgress, generateBioError, generatedBio } = state.chatGPT;

  return {
    generateBioInProgress,
    generateBioError,
    generatedBio,
  };
};

const mapDispatchToProps = {
  fetchStripeCustomer: stripeCustomer,
  onGenerateBio: generateBio,
  onAddAvailabilityException: requestAddAvailabilityException,
  onDeleteAvailabilityException: requestDeleteAvailabilityException,
};

export default compose(
  withViewport,
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(CaregiverEditListingWizard);
