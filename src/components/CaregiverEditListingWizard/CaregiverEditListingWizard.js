import React, { Component, useEffect } from 'react';
import { array, bool, func, number, object, oneOf, shape, string } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import classNames from 'classnames';
import config from '../../config';
import routeConfiguration from '../../routeConfiguration';
import { createResourceLocatorString } from '../../util/routes';
import { withViewport } from '../../util/contextHelpers';
import { propTypes } from '../../util/types';
import {
  LISTING_PAGE_PARAM_TYPE_DRAFT,
  LISTING_PAGE_PARAM_TYPE_NEW,
  LISTING_PAGE_PARAM_TYPES,
} from '../../util/urlHelpers';
import { ensureCurrentUser, ensureListing, getMissingInfoModalValue } from '../../util/data';
import { getStripeConnectAccountLink } from '../../ducks/stripeConnectAccount.duck';

import { Modal, NamedRedirect, Tabs, StripeConnectAccountStatusBox, IconClose, Button } from '..';
import { StripeConnectAccountForm } from '../../forms';
import { BACKGROUND_CHECK_APPROVED } from '../../util/constants';
import { stripeAccountClearError } from '../../ducks/stripeConnectAccount.duck';
import { stripeCustomer } from '../../containers/PaymentMethodsPage/PaymentMethodsPage.duck.js';
import { createPayment, createSubscription, updateSubscription } from '../../ducks/stripe.duck';

import EditListingWizardTab, {
  SERVICES,
  AVAILABILITY,
  BIO,
  EXPERIENCE,
  ADDITIONAL_DETAILS,
  LOCATION,
  PRICING,
  BACKGROUND_CHECK,
  PROFILE_PICTURE,
} from '../EditListingWizardTab/EditListingWizardTab';
import stripeLogo from '../../assets/stripe-wordmark-blurple.png';
import { savePayoutDetails } from '../../containers/EditListingPage/EditListingPage.duck';
import {
  authenticateCreateUser,
  authenticateSubmitConsent,
  identityProofQuiz,
  verifyIdentityProofQuiz,
  authenticateUpdateUser,
  getAuthenticateTestResult,
  authenticateGenerateCriminalBackground,
  authenticate7YearHistory,
  applyBCPromo,
} from '../../ducks/authenticate.duck';

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
  BACKGROUND_CHECK,
  PROFILE_PICTURE,
];

// Tabs are horizontal in small screens
const MAX_HORIZONTAL_NAV_SCREEN_WIDTH = 1023;

const STRIPE_ONBOARDING_RETURN_URL_SUCCESS = 'success';
const STRIPE_ONBOARDING_RETURN_URL_FAILURE = 'failure';

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
  } else if (tab === BACKGROUND_CHECK) {
    key = 'CaregiverEditListingWizard.tabLabelBackgroundCheck';
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
  const {
    availabilityPlan,
    description,
    geolocation,
    title,
    publicData,
    metadata,
  } = listing.attributes;
  const images = listing.images;

  const backgroundCheckApproved = user?.attributes?.profile?.metadata?.backgroundCheckApproved;

  switch (tab) {
    case SERVICES:
      return !!(publicData && publicData.careTypes);
    case BIO:
      return !!description;
    // TODO: Update publicData to be verified
    case EXPERIENCE:
      return !!(publicData && publicData.experienceLevel);
    case ADDITIONAL_DETAILS:
      return !!(publicData && publicData.covidVaccination && publicData.languagesSpoken);
    case LOCATION:
      return !!(
        geolocation &&
        publicData &&
        publicData.location &&
        publicData.travelDistance != undefined
      );
    case PRICING:
      return !!(publicData && publicData.minPrice && publicData.maxPrice);
    case AVAILABILITY:
      return !!(publicData && publicData.availabilityPlan);
    case BACKGROUND_CHECK:
      return !!(backgroundCheckApproved?.status === BACKGROUND_CHECK_APPROVED);
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

// Create return URL for the Stripe onboarding form
const createReturnURL = (returnURLType, rootURL, routes, pathParams) => {
  if (returnURLType === 'success') {
    const path = createResourceLocatorString('LandingPage', routes, pathParams);
    const root = rootURL.replace(/\/$/, '');
    return `${root}${path}`;
  }

  const path = createResourceLocatorString(
    'EditListingStripeOnboardingPage',
    routes,
    { ...pathParams, returnURLType },
    {}
  );

  const root = rootURL.replace(/\/$/, '');
  return `${root}${path}`;
};

// Get attribute: stripeAccountData
const getStripeAccountData = stripeAccount => stripeAccount.attributes.stripeAccountData || null;

// Get last 4 digits of bank account returned in Stripe account
const getBankAccountLast4Digits = stripeAccountData =>
  stripeAccountData && stripeAccountData.external_accounts.data.length > 0
    ? stripeAccountData.external_accounts.data[0].last4
    : null;

// Check if there's requirements on selected type: 'past_due', 'currently_due' etc.
const hasRequirements = (stripeAccountData, requirementType) =>
  stripeAccountData != null &&
  stripeAccountData.requirements &&
  Array.isArray(stripeAccountData.requirements[requirementType]) &&
  stripeAccountData.requirements[requirementType].length > 0;

// Redirect user to Stripe's hosted Connect account onboarding form
const handleGetStripeConnectAccountLinkFn = (getLinkFn, commonParams) => type => () => {
  getLinkFn({ type, ...commonParams })
    .then(url => {
      window.location.href = url;
    })
    .catch(err => console.error(err));
};

const RedirectToStripe = ({ redirectFn }) => {
  useEffect(redirectFn('custom_account_verification'), []);
  return <FormattedMessage id="CaregiverEditListingWizard.redirectingToStripe" />;
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
    };
    this.handleCreateFlowTabScrolling = this.handleCreateFlowTabScrolling.bind(this);
    this.handlePublishListing = this.handlePublishListing.bind(this);
    this.handlePayoutModalClose = this.handlePayoutModalClose.bind(this);
    this.handlePayoutSubmit = this.handlePayoutSubmit.bind(this);
  }

  componentDidMount() {
    const { stripeOnboardingReturnURL, params, currentUser } = this.props;

    const isNewListingFlow = [LISTING_PAGE_PARAM_TYPE_NEW, LISTING_PAGE_PARAM_TYPE_DRAFT].includes(
      params.type
    );

    if (stripeOnboardingReturnURL != null && !this.showPayoutDetails) {
      this.setState({ showPayoutDetails: true });
    }

    const backgroundCheckApprovedStatus =
      currentUser?.attributes?.profile?.metadata?.backgroundCheckApproved?.status;

    if (!isNewListingFlow && backgroundCheckApprovedStatus === BACKGROUND_CHECK_APPROVED) {
      const index = TABS.indexOf(BACKGROUND_CHECK);
      if (index > -1) {
        TABS.splice(index, 1);
      }
    }
  }

  handleCreateFlowTabScrolling(shouldScroll) {
    this.hasScrolledToTab = shouldScroll;
  }

  handlePublishListing(id) {
    const {
      onPublishListingDraft,
      currentUser,
      stripeAccount,
      onChangeMissingInfoModal,
      history,
      onFetchCurrentUserHasListings,
    } = this.props;

    const stripeConnected = !!currentUser.stripeAccount?.id;

    const stripeAccountData = stripeConnected ? getStripeAccountData(stripeAccount) : null;

    const requirementsMissing =
      stripeAccount &&
      (hasRequirements(stripeAccountData, 'past_due') ||
        hasRequirements(stripeAccountData, 'currently_due'));

    onPublishListingDraft(id);

    if (
      currentUser &&
      !currentUser.attributes.emailVerified &&
      !history.location.pathname.includes('create-profile')
    ) {
      onChangeMissingInfoModal(getMissingInfoModalValue(currentUser));
      onFetchCurrentUserHasListings();
    } else if (requirementsMissing || !stripeConnected) {
      this.setState({
        draftId: id,
        showPayoutDetails: true,
      });
    } else if (history.location.pathname.includes('create-profile')) {
      history.push('/signup');
      onFetchCurrentUserHasListings();
    }
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

  handlePayoutSubmit(values) {
    this.props
      .onPayoutDetailsSubmit(values)
      .then(response => {
        this.props.onManageDisableScrolling('CaregiverEditListingWizard.payoutModal', false);
      })
      .catch(() => {
        // do nothing
      });
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
      listing,
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

    const stripeAccountError =
      createStripeAccountError || updateStripeAccountError || fetchStripeAccountError;

    const selectedTab = params.tab;
    const isNewListingFlow = [LISTING_PAGE_PARAM_TYPE_NEW, LISTING_PAGE_PARAM_TYPE_DRAFT].includes(
      params.type
    );
    const rootClasses = rootClassName || css.root;
    const classes = classNames(rootClasses, className);
    const currentListing = ensureListing(listing);
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
    const formDisabled = getAccountLinkInProgress;
    const ensuredCurrentUser = ensureCurrentUser(currentUser);
    const currentUserLoaded = !!ensuredCurrentUser.id;
    const stripeConnected = currentUserLoaded && !!stripeAccount && !!stripeAccount.id;

    const rootURL = config.canonicalRootURL;
    const routes = routeConfiguration();
    const { returnURLType, ...pathParams } = params;
    const successURL = createReturnURL(
      STRIPE_ONBOARDING_RETURN_URL_SUCCESS,
      rootURL,
      routes,
      pathParams
    );
    const failureURL = createReturnURL(
      STRIPE_ONBOARDING_RETURN_URL_FAILURE,
      rootURL,
      routes,
      pathParams
    );

    const accountId = stripeConnected ? stripeAccount.id : null;
    const stripeAccountData = stripeConnected ? getStripeAccountData(stripeAccount) : null;

    const requirementsMissing =
      stripeAccount &&
      (hasRequirements(stripeAccountData, 'past_due') ||
        hasRequirements(stripeAccountData, 'currently_due'));

    const savedCountry = stripeAccountData ? stripeAccountData.country : null;

    const handleGetStripeConnectAccountLink = handleGetStripeConnectAccountLinkFn(
      onGetStripeConnectAccountLink,
      {
        accountId,
        successURL,
        failureURL,
      }
    );

    const returnedNormallyFromStripe = returnURLType === STRIPE_ONBOARDING_RETURN_URL_SUCCESS;
    const returnedAbnormallyFromStripe = returnURLType === STRIPE_ONBOARDING_RETURN_URL_FAILURE;
    const showVerificationNeeded = stripeConnected && requirementsMissing;

    // Redirect from success URL to basic path for StripePayoutPage
    if (returnedNormallyFromStripe && stripeConnected && !requirementsMissing) {
      return <NamedRedirect name="EditListingPage" params={pathParams} />;
    }

    console.log(rest);

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
                listing={listing}
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
        <Modal
          id="CaregiverEditListingWizard.payoutModal"
          isOpen={this.state.showPayoutDetails}
          onClose={this.handlePayoutModalClose}
          onManageDisableScrolling={onManageDisableScrolling}
          usePortal
        >
          <div className={css.modalPayoutDetailsWrapper}>
            <div className={css.modalTitleContainer}>
              <h1 className={css.modalTitle}>
                <FormattedMessage id="CaregiverEditListingWizard.payoutModalTitleOneMoreThing" />
                <br />
                <FormattedMessage id="CaregiverEditListingWizard.payoutModalTitlePayoutPreferences" />
              </h1>
              <div className={css.stripeContainer}>
                <img src={stripeLogo} className={css.stripeLogo} />
              </div>
            </div>
            {!currentUserLoaded ? (
              <FormattedMessage id="StripePayoutPage.loadingData" />
            ) : returnedAbnormallyFromStripe && !stripeAccountLinkError ? (
              <p className={css.modalMessage}>
                <RedirectToStripe redirectFn={handleGetStripeConnectAccountLink} />
              </p>
            ) : (
              <>
                <p className={css.modalMessage}>
                  <FormattedMessage
                    id="CaregiverEditListingWizard.payoutModalInfo"
                    values={{
                      closeButtonText: (
                        <span rootClassName={css.close} title="CLOSE">
                          <span className={css.closeText}>CLOSE</span>
                          <IconClose rootClassName={css.closeIcon} />
                        </span>
                      ),
                    }}
                  />
                </p>
                <StripeConnectAccountForm
                  disabled={formDisabled}
                  inProgress={payoutDetailsSaveInProgress}
                  ready={payoutDetailsSaved}
                  currentUser={ensuredCurrentUser}
                  stripeBankAccountLastDigits={getBankAccountLast4Digits(stripeAccountData)}
                  savedCountry={savedCountry}
                  submitButtonText={intl.formatMessage({
                    id: 'StripePayoutPage.submitButtonText',
                  })}
                  stripeAccountError={stripeAccountError}
                  stripeAccountFetched={stripeAccountFetched}
                  stripeAccountLinkError={stripeAccountLinkError}
                  onChange={onPayoutDetailsFormChange}
                  onSubmit={rest.onPayoutDetailsSubmit}
                  onGetStripeConnectAccountLink={handleGetStripeConnectAccountLink}
                  stripeConnected={stripeConnected}
                >
                  {stripeConnected && !returnedAbnormallyFromStripe && showVerificationNeeded ? (
                    <StripeConnectAccountStatusBox
                      type="verificationNeeded"
                      inProgress={getAccountLinkInProgress}
                      onGetStripeConnectAccountLink={handleGetStripeConnectAccountLink(
                        'custom_account_verification'
                      )}
                    />
                  ) : stripeConnected && savedCountry && !returnedAbnormallyFromStripe ? (
                    <StripeConnectAccountStatusBox
                      type="verificationSuccess"
                      inProgress={getAccountLinkInProgress}
                      disabled={payoutDetailsSaveInProgress}
                      onGetStripeConnectAccountLink={handleGetStripeConnectAccountLink(
                        'custom_account_update'
                      )}
                    />
                  ) : null}
                </StripeConnectAccountForm>
              </>
            )}
          </div>
        </Modal>
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
  const authenticate = state.Authenticate;

  const {
    getAccountLinkInProgress,
    createStripeAccountError,
    updateStripeAccountError,
    fetchStripeAccountError,
    stripeAccount,
    stripeAccountFetched,
  } = state.stripeConnectAccount;

  const getOwnListing = id => {
    const listings = getMarketplaceEntities(state, [{ id, type: 'ownListing' }]);

    return listings.length === 1 ? listings[0] : null;
  };

  const {
    createPaymentInProgress,
    createPaymentError,
    createPaymentSuccess,
    createSubscriptionError,
    createSubscriptionInProgress,
    subscription,
    updateSubscriptionError,
    updateSubscriptionInProgress,
  } = state.stripe;

  return {
    authenticate,
    createPaymentError,
    createPaymentInProgress,
    createPaymentSuccess,
    createStripeAccountError,
    createSubscriptionError,
    createSubscriptionInProgress,
    fetchStripeAccountError,
    getAccountLinkInProgress,
    getOwnListing,
    stripeAccount,
    stripeAccountFetched,
    subscription,
    updateStripeAccountError,
    updateSubscriptionError,
    updateSubscriptionInProgress,
  };
};

const mapDispatchToProps = dispatch => ({
  fetchStripeCustomer: () => dispatch(stripeCustomer()),
  onApplyBCPromoCode: (promoCode, userId) => dispatch(applyBCPromo(promoCode, userId)),
  onAuthenticateCreateUser: (params, userId) => dispatch(authenticateCreateUser(params, userId)),
  onAuthenticateSubmitConsent: (userAccessCode, fullName, userId) =>
    dispatch(authenticateSubmitConsent(userAccessCode, fullName, userId)),
  onAuthenticateUpdateUser: (userInfo, userAccessCode) =>
    dispatch(authenticateUpdateUser(userInfo, userAccessCode)),
  onCreatePayment: params => dispatch(createPayment(params)),
  onCreateSubscription: (stripeCustomerId, priceId, userId) =>
    dispatch(createSubscription(stripeCustomerId, priceId, userId)),
  onGenerateCriminalBackground: (userAccessCode, userId) =>
    dispatch(authenticateGenerateCriminalBackground(userAccessCode, userId)),
  onGet7YearHistory: (userAccessCode, userId) =>
    dispatch(authenticate7YearHistory(userAccessCode, userId)),
  onGetAuthenticateTestResult: (userAccessCode, userId) =>
    dispatch(getAuthenticateTestResult(userAccessCode, userId)),
  onGetIdentityProofQuiz: (userAccessCode, userId) =>
    dispatch(identityProofQuiz(userAccessCode, userId)),
  onGetStripeConnectAccountLink: params => dispatch(getStripeConnectAccountLink(params)),
  onHandleCardSetup: params => dispatch(handleCardSetup(params)),
  onImageUpload: data => dispatch(requestImageUpload(data)),
  onPayoutDetailsFormChange: () => dispatch(stripeAccountClearError()),
  onPayoutDetailsSubmit: (values, isUpdateCall) =>
    dispatch(savePayoutDetails(values, isUpdateCall)),
  onUpdateSubscription: (subscriptionId, params) =>
    dispatch(updateSubscription(subscriptionId, params)),
  onVerifyIdentityProofQuiz: (IDMSessionId, userAccessCode, userId, answers, currentAttempts) =>
    dispatch(
      verifyIdentityProofQuiz(IDMSessionId, userAccessCode, userId, answers, currentAttempts)
    ),
});

export default compose(
  withViewport,
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(CaregiverEditListingWizard);
