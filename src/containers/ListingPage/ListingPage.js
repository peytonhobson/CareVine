import React, { Component } from 'react';
import { array, arrayOf, bool, func, shape, string, oneOf } from 'prop-types';
import { FormattedMessage, intlShape, injectIntl } from '../../util/reactIntl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import config from '../../config';
import routeConfiguration from '../../routeConfiguration';
import { findOptionsForSelectFilter } from '../../util/search';
import { LISTING_STATE_PENDING_APPROVAL, propTypes } from '../../util/types';
import { types as sdkTypes } from '../../util/sdkLoader';
import {
  LISTING_PAGE_DRAFT_VARIANT,
  LISTING_PAGE_PENDING_APPROVAL_VARIANT,
  LISTING_PAGE_PARAM_TYPE_DRAFT,
  LISTING_PAGE_PARAM_TYPE_EDIT,
  createSlug,
} from '../../util/urlHelpers';
import { formatMoney } from '../../util/currency';
import { createResourceLocatorString, findRouteByRouteName } from '../../util/routes';
import {
  ensureListing,
  ensureOwnListing,
  ensureUser,
  userCanMessage,
  userDisplayNameAsString,
} from '../../util/data';
import classNames from 'classnames';
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { manageDisableScrolling, isScrollingDisabled } from '../../ducks/UI.duck';
import { initializeCardPaymentData } from '../../ducks/stripe.duck.js';
import {
  Page,
  Modal,
  NamedRedirect,
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  LayoutWrapperFooter,
  Footer,
  ListingSummary,
  ListingTabs,
  ListingPreview,
  GenericError,
  Avatar,
} from '../../components';
import { EnquiryForm, InitialBookingForm } from '../../forms';
import { TopbarContainer, NotFoundPage } from '../../containers';
import { BACKGROUND_CHECK_APPROVED, CAREGIVER } from '../../util/constants';
import ActionBarMaybe from './ActionBarMaybe';
import {
  MISSING_SUBSCRIPTION,
  MISSING_REQUIREMENTS,
  EMAIL_VERIFICATION,
} from '../../util/constants';
import {
  sendEnquiry,
  setInitialValues,
  closeListing,
  openListing,
  notifyForBooking,
  fetchExistingConversation,
} from './ListingPage.duck';
import { changeModalValue } from '../TopbarContainer/TopbarContainer.duck';

import css from './ListingPage.module.css';

const { UUID } = sdkTypes;

export class ListingPageComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pageClassNames: [],
      imageCarouselOpen: false,
      enquiryModalOpen: false,
      showListingPreview: false,
    };

    this.handleBookingSubmit = this.handleBookingSubmit.bind(this);
    this.onContactUser = this.onContactUser.bind(this);
    this.onSubmitEnquiry = this.onSubmitEnquiry.bind(this);
    this.goBackToSearchResults = this.goBackToSearchResults.bind(this);
  }

  handleBookingSubmit(values) {
    const {
      history,
      getListing,
      params,
      callSetInitialValues,
      onInitializeCardPaymentData,
    } = this.props;
    const listingId = new UUID(params.id);
    const listing = getListing(listingId);

    const { bookingDates, rate: bookingRate } = values;

    const initialValues = {
      listing,
      bookingRate: bookingRate?.length > 0 ? bookingRate[0] : null,
      bookingDates,
      confirmPaymentError: null,
    };

    const saveToSessionStorage = !this.props.currentUser;

    const routes = routeConfiguration();
    // Customize checkout page state with current listing and selected bookingDates
    const { setInitialValues: checkoutSetInitialValues } = findRouteByRouteName(
      'CheckoutPage',
      routes
    );

    callSetInitialValues(checkoutSetInitialValues, initialValues, saveToSessionStorage);

    // Clear previous Stripe errors from store if there is any
    onInitializeCardPaymentData();

    // Redirect to CheckoutPage
    history.push(
      createResourceLocatorString(
        'CheckoutPage',
        routes,
        { id: listing.id.uuid, slug: createSlug(listing.attributes.title) },
        {}
      )
    );
  }

  onContactUser() {
    const { listing } = this.props;

    const listingId = listing?.id?.uuid;

    const { currentUser, history, callSetInitialValues, location } = this.props;

    const userType = currentUser?.attributes?.profile?.metadata?.userType;
    const emailVerified = currentUser?.attributes?.emailVerified;
    const backgroundCheckApproved =
      currentUser?.attributes?.profile?.metadata?.backgroundCheckApproved;

    const canMessage = userCanMessage(currentUser);

    if (!currentUser) {
      const state = { from: `${location.pathname}${location.search}${location.hash}` };

      // We need to log in before showing the modal, but first we need to ensure
      // that modal does open when user is redirected back to this listingpage
      callSetInitialValues(setInitialValues, { enquiryModalOpenForListingId: listingId });

      // signup and return back to listingPage.
      history.push(createResourceLocatorString('SignupPage', routeConfiguration(), {}, {}), state);
    } else if (canMessage) {
      this.setState({ enquiryModalOpen: true });
    } else {
      if (userType === CAREGIVER) {
        if (emailVerified && backgroundCheckApproved?.status === BACKGROUND_CHECK_APPROVED) {
          this.props.onChangeModalValue(MISSING_SUBSCRIPTION);
        } else {
          this.props.onChangeModalValue(MISSING_REQUIREMENTS);
        }
        return;
      }
      this.props.onChangeModalValue(EMAIL_VERIFICATION);
    }
  }

  async onSubmitEnquiry(values) {
    const { history, onSendEnquiry, getListing, params } = this.props;
    const routes = routeConfiguration();
    const listingId = new UUID(params.id);
    const listing = ensureListing(getListing(listingId));
    const { message } = values;

    try {
      await onSendEnquiry(listing, message.trim(), history, routes);

      this.setState({ enquiryModalOpen: false });
    } catch (e) {
      // Error handling in duck
    }
  }

  goBackToSearchResults() {
    const { history, location } = this.props;

    history.goBack();

    // TODO: Make scroll back to search position
  }

  render() {
    const {
      isAuthenticated,
      currentUser,
      getListing,
      getOwnListing,
      intl,
      onManageDisableScrolling,
      params: rawParams,
      location,
      scrollingDisabled,
      showListingError,
      currentUserListing,
      sendEnquiryInProgress,
      sendEnquiryError,
      sendMessageError,
      sendMessageInProgress,
      fetchExistingConversationInProgress,
      onCloseListing,
      closeListingInProgress,
      closeListingError,
      openListingInProgress,
      openListingError,
      onOpenListing,
      origin,
      hasStripeAccount,
      hasStripeAccountInProgress,
      hasStripeAccountError,
      fetchReviewsError,
      reviews,
      onChangeModalValue,
      history,
      sendNotifyForBookingError,
      sendNotifyForBookingInProgress,
      sendNotifyForBookingSuccess,
      onSendNotifyForBooking,
    } = this.props;

    const isFromSearchPage = location.state?.from === 'SearchPage';

    const listingId = new UUID(rawParams.id);
    const isPendingApprovalVariant = rawParams.variant === LISTING_PAGE_PENDING_APPROVAL_VARIANT;
    const isDraftVariant = rawParams.variant === LISTING_PAGE_DRAFT_VARIANT;

    const currentListing =
      isPendingApprovalVariant || isDraftVariant
        ? ensureOwnListing(getOwnListing(listingId))
        : ensureListing(getListing(listingId));

    const listingSlug = rawParams.slug || createSlug(currentListing.attributes.title || '');
    const params = { slug: listingSlug, ...rawParams };

    const listingType = isDraftVariant
      ? LISTING_PAGE_PARAM_TYPE_DRAFT
      : LISTING_PAGE_PARAM_TYPE_EDIT;
    const listingTab = isDraftVariant ? 'photos' : 'description';

    const isApproved =
      currentListing.id && currentListing.attributes.state !== LISTING_STATE_PENDING_APPROVAL;

    const pendingIsApproved = isPendingApprovalVariant && isApproved;

    // If a /pending-approval URL is shared, the UI requires
    // authentication and attempts to fetch the listing from own
    // listings. This will fail with 403 Forbidden if the author is
    // another user. We use this information to try to fetch the
    // public listing.
    const pendingOtherUsersListing =
      (isPendingApprovalVariant || isDraftVariant) &&
      showListingError &&
      showListingError.status === 403;
    const shouldShowPublicListingPage = pendingIsApproved || pendingOtherUsersListing;

    if (shouldShowPublicListingPage) {
      return <NamedRedirect name="ListingPage" params={params} search={location.search} />;
    }

    const { description = '' } = currentListing.attributes;

    const authorAvailable = currentListing && currentListing.author;
    const userAndListingAuthorAvailable = !!(currentUser && authorAvailable);
    const isOwnListing =
      userAndListingAuthorAvailable && currentListing.author.id.uuid === currentUser.id.uuid;

    const topbar = (
      <TopbarContainer currentPage={isOwnListing ? 'OwnListingPage' : 'ListingPage'} />
    );

    if (showListingError && showListingError.status === 404) {
      // 404 listing not found

      return <NotFoundPage />;
    } else if (showListingError) {
      // Other error in fetching listing

      const errorTitle = intl.formatMessage({
        id: 'ListingPage.errorLoadingListingTitle',
      });

      return (
        <Page title={errorTitle} scrollingDisabled={scrollingDisabled}>
          <LayoutSingleColumn className={css.pageRoot}>
            <LayoutWrapperTopbar>{topbar}</LayoutWrapperTopbar>
            <LayoutWrapperMain>
              <p className={css.errorText}>
                <FormattedMessage id="ListingPage.errorLoadingListingMessage" />
              </p>
            </LayoutWrapperMain>
            <LayoutWrapperFooter>
              <Footer />
            </LayoutWrapperFooter>
          </LayoutSingleColumn>
        </Page>
      );
    } else if (!currentListing.id) {
      // Still loading the listing

      const loadingTitle = intl.formatMessage({
        id: 'ListingPage.loadingListingTitle',
      });

      return (
        <Page title={loadingTitle} scrollingDisabled={scrollingDisabled}>
          <LayoutSingleColumn className={css.pageRoot}>
            <LayoutWrapperTopbar>{topbar}</LayoutWrapperTopbar>
            <LayoutWrapperMain>
              <p className={css.loadingText}>
                <FormattedMessage id="ListingPage.loadingListingMessage" />
              </p>
            </LayoutWrapperMain>
            <LayoutWrapperFooter>
              <Footer />
            </LayoutWrapperFooter>
          </LayoutSingleColumn>
        </Page>
      );
    }

    const currentAuthor = authorAvailable ? currentListing.author : null;
    const ensuredAuthor = ensureUser(currentAuthor);

    // When user is banned or deleted the listing is also deleted.
    // Because listing can be never showed with banned or deleted user we don't have to provide
    // banned or deleted display names for the function
    const authorDisplayName = userDisplayNameAsString(ensuredAuthor, '');

    const siteTitle = config.siteTitle;
    const schemaTitle = intl.formatMessage(
      { id: 'ListingPage.schemaTitle' },
      { displayName: authorDisplayName, siteTitle }
    );

    const actionBar = listingId ? (
      <div onClick={e => e.stopPropagation()}>
        <ActionBarMaybe
          className={css.actionBar}
          isOwnListing={isOwnListing}
          listing={currentListing}
          editParams={{
            id: listingId.uuid,
            slug: listingSlug,
            type: listingType,
            tab: listingTab,
          }}
        />
      </div>
    ) : null;

    const currentUserOrigin = currentUserListing?.attributes?.geolocation;

    const clostListingErrorText = closeListingError ? (
      <p className={css.errorText}>
        <FormattedMessage id="ListingPage.closeListingFailed" />
      </p>
    ) : null;

    const openListingErrorText = openListingError ? (
      <p className={css.errorText}>
        <FormattedMessage id="ListingPage.openListingFailed" />
      </p>
    ) : null;

    return (
      <Page
        title={schemaTitle}
        scrollingDisabled={scrollingDisabled}
        author={authorDisplayName}
        contentType="website"
        description={description}
        schema={{
          '@context': 'http://schema.org',
          '@type': 'ItemPage',
          description: description,
          name: schemaTitle,
        }}
      >
        <LayoutSingleColumn className={css.pageRoot}>
          <LayoutWrapperTopbar>{topbar}</LayoutWrapperTopbar>
          <LayoutWrapperMain>
            {actionBar}
            <div className={css.mainContainer}>
              <div className={classNames(css.subContainer)}>
                {!this.state.showListingPreview ? (
                  <>
                    <ListingSummary
                      listing={currentListing}
                      params={params}
                      currentUserListing={currentUserListing}
                      onContactUser={this.onContactUser}
                      isOwnListing={isOwnListing}
                      onShowListingPreview={() => this.setState({ showListingPreview: true })}
                      fetchExistingConversationInProgress={fetchExistingConversationInProgress}
                      closeListingInProgress={closeListingInProgress}
                      closeListingError={closeListingError}
                      onCloseListing={onCloseListing}
                      openListingInProgress={openListingInProgress}
                      openListingError={openListingError}
                      onOpenListing={onOpenListing}
                      isFromSearchPage={isFromSearchPage}
                      onGoBackToSearchResults={this.goBackToSearchResults}
                      origin={origin || currentUserOrigin}
                      reviews={reviews}
                      fetchReviewsError={fetchReviewsError}
                      onManageDisableScrolling={onManageDisableScrolling}
                      onContinueBooking={this.handleBookingSubmit}
                      authorDisplayName={authorDisplayName}
                      hasStripeAccount={hasStripeAccount}
                      hasStripeAccountInProgress={hasStripeAccountInProgress}
                      hasStripeAccountError={hasStripeAccountError}
                      currentUser={currentUser}
                      onChangeModalValue={onChangeModalValue}
                      history={history}
                      sendNotifyForBookingError={sendNotifyForBookingError}
                      sendNotifyForBookingInProgress={sendNotifyForBookingInProgress}
                      sendNotifyForBookingSuccess={sendNotifyForBookingSuccess}
                      onSendNotifyForBooking={onSendNotifyForBooking}
                      onFetchExistingConversation={this.props.onFetchExistingConversation}
                      existingConversation={this.props.existingConversation}
                    />
                    <ListingTabs
                      currentUser={currentUser}
                      listing={currentListing}
                      onManageDisableScrolling={onManageDisableScrolling}
                      currentUserListing={currentUserListing}
                    />
                  </>
                ) : (
                  <ListingPreview
                    currentUser={currentUser}
                    currentUserListing={currentUserListing}
                    onShowFullProfile={() => this.setState({ showListingPreview: false })}
                    onManageDisableScrolling={onManageDisableScrolling}
                  />
                )}
              </div>
            </div>
            {this.state.enquiryModalOpen && (
              <Modal
                id="ListingPage.enquiry"
                contentClassName={css.enquiryModalContent}
                isOpen={isAuthenticated && !!this.state.enquiryModalOpen}
                onClose={() => this.setState({ enquiryModalOpen: false })}
                onManageDisableScrolling={onManageDisableScrolling}
              >
                <EnquiryForm
                  className={css.enquiryForm}
                  authorDisplayName={authorDisplayName}
                  sendErrors={sendEnquiryError || sendMessageError}
                  onSubmit={this.onSubmitEnquiry}
                  inProgress={sendEnquiryInProgress || sendMessageInProgress}
                  author={currentAuthor}
                />
              </Modal>
            )}
          </LayoutWrapperMain>
          <LayoutWrapperFooter>
            <Footer />
          </LayoutWrapperFooter>
        </LayoutSingleColumn>
        <GenericError
          show={closeListingError || openListingError}
          errorText={clostListingErrorText || openListingErrorText}
        />
      </Page>
    );
  }
}

ListingPageComponent.defaultProps = {
  filterConfig: config.custom.filters,
};

ListingPageComponent.propTypes = {
  filterConfig: array,
};

const mapStateToProps = state => {
  const { isAuthenticated } = state.Auth;
  const {
    showListingError,
    sendEnquiryInProgress,
    sendEnquiryError,
    sendMessageError,
    sendMessageInProgress,
    fetchExistingConversationInProgress,
    fetchExistingConversationError,
    existingConversation,
    closeListingInProgress,
    closeListingError,
    openListingInProgress,
    openListingError,
    origin,
    monthlyTimeSlots,
    fetchReviewsError,
    fetchReviewsInProgress,
    reviews,
    sendNotifyForBookingError,
    sendNotifyForBookingInProgress,
    sendNotifyForBookingSuccess,
  } = state.ListingPage;
  const { currentUser, currentUserListing } = state.user;
  const {
    hasStripeAccount,
    hasStripeAccountInProgress,
    hasStripeAccountError,
  } = state.stripeConnectAccount;

  const getListing = id => {
    const ref = { id, type: 'listing' };
    const listings = getMarketplaceEntities(state, [ref]);
    return listings.length === 1 ? listings[0] : null;
  };

  const getOwnListing = id => {
    const ref = { id, type: 'ownListing' };
    const listings = getMarketplaceEntities(state, [ref]);
    return listings.length === 1 ? listings[0] : null;
  };

  return {
    isAuthenticated,
    currentUser,
    getListing,
    getOwnListing,
    showListingError,
    sendEnquiryInProgress,
    sendEnquiryError,
    sendMessageError,
    sendMessageInProgress,
    currentUserListing,
    fetchExistingConversationInProgress,
    fetchExistingConversationError,
    existingConversation,
    scrollingDisabled: isScrollingDisabled(state),
    closeListingInProgress,
    closeListingError,
    openListingInProgress,
    openListingError,
    origin,
    monthlyTimeSlots,
    hasStripeAccount,
    hasStripeAccountInProgress,
    hasStripeAccountError,
    fetchReviewsError,
    fetchReviewsInProgress,
    reviews,
    sendNotifyForBookingError,
    sendNotifyForBookingInProgress,
    sendNotifyForBookingSuccess,
  };
};

const mapDispatchToProps = dispatch => ({
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
  callSetInitialValues: (setInitialValues, values, saveToSessionStorage) =>
    dispatch(setInitialValues(values, saveToSessionStorage)),
  onChangeModalValue: value => dispatch(changeModalValue(value)),
  onSendEnquiry: (listing, message, history, routes) =>
    dispatch(sendEnquiry(listing, message, history, routes)),
  onCloseListing: listingId => dispatch(closeListing(listingId)),
  onOpenListing: listingId => dispatch(openListing(listingId)),
  onInitializeCardPaymentData: () => dispatch(initializeCardPaymentData()),
  onSendNotifyForBooking: listing => dispatch(notifyForBooking(listing)),
  onFetchExistingConversation: listing => dispatch(fetchExistingConversation(listing)),
});

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const ListingPage = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(ListingPageComponent);

export default ListingPage;
