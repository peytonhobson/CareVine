import React, { Component } from 'react';
import { array, bool, func, oneOf, object, shape, string } from 'prop-types';
import { injectIntl, intlShape } from '../../util/reactIntl';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import { types as sdkTypes } from '../../util/sdkLoader';
import debounce from 'lodash/debounce';
import unionWith from 'lodash/unionWith';
import classNames from 'classnames';
import config from '../../config';
import routeConfiguration from '../../routeConfiguration';
import { createResourceLocatorString, pathByRouteName } from '../../util/routes';
import { parse, stringify } from '../../util/urlHelpers';
import { propTypes } from '../../util/types';
import { getListingsById } from '../../ducks/marketplaceData.duck';
import { manageDisableScrolling, isScrollingDisabled } from '../../ducks/UI.duck';
import { changeModalValue } from '../TopbarContainer/TopbarContainer.duck';
import { EMAIL_VERIFICATION } from '../../components/ModalMissingInformation/ModalMissingInformation';
import { SearchMap, ModalInMobile, Page, Modal, SendbirdModal } from '../../components';
import { TopbarContainer } from '../../containers';
import { EnquiryForm } from '../../forms';
import { generateAccessToken } from '../../containers/InboxPage/InboxPage.duck';
import {
  searchMapListings,
  setActiveListing,
  fetchCurrentUserTransactions,
  fetchChannel,
} from './SearchPage.duck';
import {
  pickSearchParamsOnly,
  validURLParamsForExtendedData,
  validFilterParams,
  createSearchResultSchema,
  hasExistingTransaction,
} from './SearchPage.helpers';
import { sendEnquiry, setInitialValues } from '../ListingPage/ListingPage.duck';
import MainPanel from './MainPanel';
import css from './SearchPage.module.css';
import { userDisplayNameAsString } from '../../util/data';
const { UUID } = sdkTypes;
import { CAREGIVER, EMPLOYER } from '../../util/constants';
import '@sendbird/uikit-react/dist/index.css';
import SBProvider from '@sendbird/uikit-react/SendbirdProvider';
import SBConversation from '@sendbird/uikit-react/Channel';

const MODAL_BREAKPOINT = 768; // Search is in modal on mobile layout
const SEARCH_WITH_MAP_DEBOUNCE = 300; // Little bit of debounce before search is initiated.

export class SearchPageComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isSearchMapOpenOnMobile: props.tab === 'map',
      isMobileModalOpen: false,
      enquiryModalOpen: false,
      currentListingAuthor: null,
      currentListingId: '',
    };

    this.searchMapListingsInProgress = false;

    this.onOpenMobileModal = this.onOpenMobileModal.bind(this);
    this.onCloseMobileModal = this.onCloseMobileModal.bind(this);
    this.onContactUser = this.onContactUser.bind(this);
    this.onSubmitEnquiry = this.onSubmitEnquiry.bind(this);
  }

  // Callback to determine if new search is needed
  // when map is moved by user or viewport has change

  // Invoked when a modal is opened from a child component,
  // for example when a filter modal is opened in mobile view
  onOpenMobileModal() {
    this.setState({ isMobileModalOpen: true });
  }

  // Invoked when a modal is closed from a child component,
  // for example when a filter modal is opened in mobile view
  onCloseMobileModal() {
    this.setState({ isMobileModalOpen: false });
  }

  onContactUser(currentAuthor, listingId) {
    this.setState({ currentListingAuthor: currentAuthor });
    this.setState({ currentListingId: listingId });

    this.props.onFetchCurrentUserTransactions();

    const { currentUser, history, callSetInitialValues, location } = this.props;

    if (!currentUser) {
      const state = { from: `${location.pathname}${location.search}${location.hash}` };

      // We need to log in before showing the modal, but first we need to ensure
      // that modal does open when user is redirected back to this listingpage
      callSetInitialValues(setInitialValues, { enquiryModalOpenForListingId: listingId });

      // signup and return back to listingPage.
      history.push(createResourceLocatorString('SignupPage', routeConfiguration(), {}, {}), state);
    } else if (currentUser.attributes.emailVerified) {
      this.setState({ enquiryModalOpen: true });
    } else {
      this.props.onChangeModalValue(EMAIL_VERIFICATION);
    }
  }

  onSubmitEnquiry(values) {
    const {
      history,
      params,
      onSendEnquiry,
      currentUserTransactions,
      currentUser,
      onSendMessage,
    } = this.props;
    const routes = routeConfiguration();
    const listingId = this.state.currentListingId;
    const { message } = values;

    const existingTransaction = currentUserTransactions.find(transaction =>
      hasExistingTransaction(transaction, currentUser, this.state.currentListingAuthor)
    );

    // if (existingTransaction) {
    //   const txId = existingTransaction.id.uuid;
    //   onSendMessage(txId, message.trim())
    //     .then(res => {
    //       this.setState({ enquiryModalOpen: false });

    //       // Redirect to InboxPage
    //       history.push(
    //         createResourceLocatorString('InboxPage', routes, { tab: 'messages' }, { id: txId })
    //       );
    //     })
    //     .catch(() => {
    //       // Ignore, error handling in duck file
    //     });
    // } else {
    onSendEnquiry(this.state.currentListingAuthor, message.trim())
      .then(txId => {
        this.setState({ enquiryModalOpen: false });

        // Redirect to InboxPage
        history.push(createResourceLocatorString('InboxPage', routes));
      })
      .catch(() => {
        // Ignore, error handling in duck file
      });
    // }
  }

  render() {
    const {
      intl,
      listings,
      filterConfig,
      sortConfig,
      history,
      location,
      mapListings,
      onManageDisableScrolling,
      pagination,
      scrollingDisabled,
      searchInProgress,
      searchListingsError,
      searchParams,
      activeListingId,
      onActivateListing,
      currentUserType,
      currentUser,
      isAuthenticated,
      sendEnquiryError,
      sendEnquiryInProgress,
      onFetchCurrentUserTransactions,
      currentUserTransactions,
      onFetchChannel,
      messageChannel,
      fetchChannelInProgress,
      fetchChannelError,
      onGenerateAccessToken,
    } = this.props;
    // eslint-disable-next-line no-unused-vars
    const { mapSearch, page, ...searchInURL } = parse(location.search, {
      latlng: ['origin'],
      latlngBounds: ['bounds'],
    });

    // urlQueryParams doesn't contain page specific url params
    // like mapSearch, page or origin (origin depends on config.sortSearchByDistance)
    const urlQueryParams = pickSearchParamsOnly(searchInURL, filterConfig, sortConfig);

    // Page transition might initially use values from previous search
    const urlQueryString = stringify(urlQueryParams);
    const paramsQueryString = stringify(
      pickSearchParamsOnly(searchParams, filterConfig, sortConfig)
    );
    const searchParamsAreInSync = true;

    const validQueryParams = validURLParamsForExtendedData(searchInURL, filterConfig);

    const isWindowDefined = typeof window !== 'undefined';
    const isMobileLayout = isWindowDefined && window.innerWidth < MODAL_BREAKPOINT;
    const shouldShowSearchMap =
      !isMobileLayout || (isMobileLayout && this.state.isSearchMapOpenOnMobile);

    const onMapIconClick = () => {
      this.useLocationSearchBounds = true;
      this.setState({ isSearchMapOpenOnMobile: true });
    };

    const { address, bounds, origin } = searchInURL || {};
    const { title, description, schema } = createSearchResultSchema(listings, address, intl);

    // Set topbar class based on if a modal is open in
    // a child component
    const topbarClasses = this.state.isMobileModalOpen
      ? classNames(css.topbarBehindModal, css.topbar)
      : css.topbar;

    // N.B. openMobileMap button is sticky.
    // For some reason, stickyness doesn't work on Safari, if the element is <button>
    return (
      <Page
        scrollingDisabled={scrollingDisabled}
        description={description}
        title={title}
        schema={schema}
      >
        <TopbarContainer
          className={topbarClasses}
          currentPage="SearchPage"
          currentSearchParams={urlQueryParams}
          onCloseMissingInfoModal={this.onCloseMissingInfoModal}
          showModal={this.state.showVerificationEmailModal}
        />
        <div className={css.container}>
          <MainPanel
            urlQueryParams={validQueryParams}
            listings={listings}
            searchInProgress={searchInProgress}
            searchListingsError={searchListingsError}
            searchParamsAreInSync={searchParamsAreInSync}
            onActivateListing={onActivateListing}
            onManageDisableScrolling={onManageDisableScrolling}
            onOpenModal={this.onOpenMobileModal}
            onCloseModal={this.onCloseMobileModal}
            onMapIconClick={onMapIconClick}
            pagination={pagination}
            searchParamsForPagination={parse(location.search)}
            showAsModalMaxWidth={MODAL_BREAKPOINT}
            history={history}
            currentUserType={currentUserType}
            currentUser={currentUser}
            onContactUser={this.onContactUser}
          />
          {this.state.enquiryModalOpen && (
            <SendbirdModal
              contentClassName={css.enquiryModalContent}
              isOpen={isAuthenticated && !!this.state.enquiryModalOpen}
              onClose={() => this.setState({ enquiryModalOpen: false })}
              onManageDisableScrolling={onManageDisableScrolling}
              currentUser={currentUser}
              currentAuthor={this.state.currentListingAuthor}
              onFetchChannel={onFetchChannel}
              messageChannel={messageChannel}
              fetchChannelInProgress={fetchChannelInProgress}
              fetchChannelError={fetchChannelError}
              history={history}
              onGenerateAccessToken={onGenerateAccessToken}
            />
          )}
        </div>
      </Page>
    );
  }
}

SearchPageComponent.defaultProps = {
  listings: [],
  mapListings: [],
  pagination: null,
  searchListingsError: null,
  searchParams: {},
  tab: 'listings',
  filterConfig: config.custom.filters,
  sortConfig: config.custom.sortConfig,
  activeListingId: null,
};

SearchPageComponent.propTypes = {
  listings: array,
  mapListings: array,
  onActivateListing: func.isRequired,
  onManageDisableScrolling: func.isRequired,
  onSearchMapListings: func.isRequired,
  pagination: propTypes.pagination,
  scrollingDisabled: bool.isRequired,
  searchInProgress: bool.isRequired,
  searchListingsError: propTypes.error,
  searchParams: object,
  tab: oneOf(['filters', 'listings', 'map']).isRequired,
  filterConfig: propTypes.filterConfig,
  sortConfig: propTypes.sortConfig,
  onChangeModalValue: func.isRequired,

  // from withRouter
  history: shape({
    push: func.isRequired,
  }).isRequired,
  location: shape({
    search: string.isRequired,
  }).isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  const { isAuthenticated } = state.Auth;
  const { sendEnquiryInProgress, sendEnquiryError } = state.ListingPage;
  const {
    currentPageResultIds,
    pagination,
    searchInProgress,
    searchListingsError,
    searchParams,
    searchMapListingIds,
    activeListingId,
    transactions,
    messageChannel,
    fetchChannelInProgress,
    fetchChannelError,
  } = state.SearchPage;
  const currentUser = state.user.currentUser;
  const currentUserType = currentUser?.attributes.profile.metadata.userType;
  const oppositeUserType = currentUserType === CAREGIVER ? EMPLOYER : CAREGIVER;

  const pageListings = getListingsById(state, currentPageResultIds).filter(
    listing =>
      listing &&
      listing.attributes &&
      listing.attributes.metadata &&
      listing.attributes.metadata.listingType === oppositeUserType
  );
  const mapListings = getListingsById(
    state,
    unionWith(currentPageResultIds, searchMapListingIds, (id1, id2) => id1.uuid === id2.uuid)
  ).filter(
    listing =>
      listing &&
      listing.attributes &&
      listing.attributes.metadata &&
      listing.attributes.metadata.listingType === oppositeUserType
  );

  return {
    currentUserTransactions: transactions,
    isAuthenticated,
    listings: pageListings,
    mapListings,
    pagination,
    scrollingDisabled: isScrollingDisabled(state),
    searchInProgress,
    searchListingsError,
    searchParams,
    activeListingId,
    currentUserType,
    currentUser,
    sendEnquiryError,
    sendEnquiryInProgress,
    messageChannel,
    fetchChannelInProgress,
    fetchChannelError,
  };
};

const mapDispatchToProps = dispatch => ({
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
  onSearchMapListings: searchParams => dispatch(searchMapListings(searchParams)),
  onActivateListing: listingId => dispatch(setActiveListing(listingId)),
  callSetInitialValues: (setInitialValues, values, saveToSessionStorage) =>
    dispatch(setInitialValues(values, saveToSessionStorage)),
  onSendEnquiry: (listingId, message) => dispatch(sendEnquiry(listingId, message)),
  onChangeModalValue: value => dispatch(changeModalValue(value)),
  onFetchCurrentUserTransactions: () => dispatch(fetchCurrentUserTransactions()),
  onFetchChannel: (currentAuthor, currentUser, accessToken) =>
    dispatch(fetchChannel(currentAuthor, currentUser, accessToken)),
  onGenerateAccessToken: currentUser => dispatch(generateAccessToken(currentUser)),
});

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const SearchPage = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(SearchPageComponent);

export default SearchPage;
