import React, { Component } from 'react';

import { array, bool, func, oneOf, object, shape, string } from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import classNames from 'classnames';

import config from '../../config';
import { parse, stringify } from '../../util/urlHelpers';
import { propTypes } from '../../util/types';
import { calculateDistanceBetweenOrigins } from '../../util/maps';
import { getListingsById } from '../../ducks/marketplaceData.duck';
import { manageDisableScrolling, isScrollingDisabled } from '../../ducks/UI.duck';
import { injectIntl, intlShape } from '../../util/reactIntl';
import { Page } from '../../components';
import { TopbarContainer } from '../../containers';
import { setActiveListing } from './SearchPage.duck';
import {
  pickSearchParamsOnly,
  validURLParamsForExtendedData,
  createSearchResultSchema,
  sortCaregiverMatch,
  sortEmployerMatch,
} from './SearchPage.helpers';
import MainPanel from './MainPanel';
import { CAREGIVER, EMPLOYER } from '../../util/constants';

import css from './SearchPage.module.css';

const MODAL_BREAKPOINT = 768; // Search is in modal on mobile layout
const RELEVANT = 'relevant';

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

    this.onOpenMobileModal = this.onOpenMobileModal.bind(this);
    this.onCloseMobileModal = this.onCloseMobileModal.bind(this);
  }

  componentWillReceiveProps = nextProps => {
    const {
      location,
      filterConfig,
      sortConfig,
      listings,
      history,
      searchListingsSuccess,
    } = nextProps;

    const { mapSearch, page, ...searchInURL } = parse(location.search, {
      latlng: ['origin'],
      latlngBounds: ['bounds'],
    });

    // urlQueryParams doesn't contain page specific url params
    // like mapSearch, page or origin (origin depends on config.sortSearchByDistance)
    const urlQueryParams = pickSearchParamsOnly(searchInURL, filterConfig, sortConfig);
    const currentDistance = Number(urlQueryParams?.distance);

    if (
      !this.props.searchListingsSuccess &&
      searchListingsSuccess &&
      listings?.length === 0 &&
      currentDistance < 50 &&
      !this?.props?.searchParams?.location
    ) {
      history.replace({
        pathname: this.props.history.location.pathname,
        search: stringify({
          ...urlQueryParams,
          distance: currentDistance ? currentDistance + 10 : 30,
        }),
      });
    }
  };

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

  render() {
    const {
      currentUser,
      currentUserListing,
      currentUserType,
      filterConfig,
      history,
      intl,
      listings,
      location,
      onActivateListing,
      onManageDisableScrolling,
      pagination,
      scrollingDisabled,
      searchInProgress,
      searchListingsError,
      searchParams,
      sortConfig,
    } = this.props;
    // eslint-disable-next-line no-unused-vars
    const { mapSearch, page, ...searchInURL } = parse(location.search, {
      latlng: ['origin'],
      latlngBounds: ['bounds'],
    });

    // urlQueryParams doesn't contain page specific url params
    // like mapSearch, page or origin (origin depends on config.sortSearchByDistance)
    const urlQueryParams = pickSearchParamsOnly(searchInURL, filterConfig, sortConfig);

    const searchParamsAreInSync = true;

    const validQueryParams = validURLParamsForExtendedData(searchInURL, filterConfig);

    const isWindowDefined = typeof window !== 'undefined';

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
            currentUser={currentUser}
            currentUserListing={currentUserListing}
            currentUserType={currentUserType}
            history={history}
            listings={listings}
            onActivateListing={onActivateListing}
            onCloseModal={this.onCloseMobileModal}
            onContactUser={this.onContactUser}
            onManageDisableScrolling={onManageDisableScrolling}
            onMapIconClick={onMapIconClick}
            onOpenModal={this.onOpenMobileModal}
            pagination={pagination}
            searchInProgress={searchInProgress}
            searchListingsError={searchListingsError}
            searchParamsAreInSync={searchParamsAreInSync}
            searchParamsForPagination={parse(location.search)}
            showAsModalMaxWidth={MODAL_BREAKPOINT}
            urlQueryParams={validQueryParams}
          />
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
  pagination: propTypes.pagination,
  scrollingDisabled: bool.isRequired,
  searchInProgress: bool.isRequired,
  searchListingsError: propTypes.error,
  searchParams: object,
  tab: oneOf(['filters', 'listings', 'map']).isRequired,
  filterConfig: propTypes.filterConfig,
  sortConfig: propTypes.sortConfig,

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
    activeListingId,
    transactions,
    messageChannel,
    fetchChannelInProgress,
    fetchChannelError,
    searchListingsSuccess,
  } = state.SearchPage;
  const currentUser = state.user.currentUser;
  const currentUserListing = state.user.currentUserListing;
  const currentUserType = currentUser?.attributes?.profile?.metadata?.userType;

  const distance = searchParams?.distance;
  const origin = searchParams?.origin;
  const location = searchParams?.location && JSON.parse(searchParams?.location);

  const calculatedOrigin = location?.origin ?? origin;

  const pageListings = getListingsById(state, currentPageResultIds).filter(listing =>
    calculatedOrigin && listing?.attributes?.geolocation
      ? calculateDistanceBetweenOrigins(calculatedOrigin, listing?.attributes?.geolocation) <
        distance
      : false
  );

  const sortByRelevant = searchParams?.sort === RELEVANT;
  const userType = currentUser?.attributes?.profile?.metadata?.userType;

  const sortedListings =
    currentUserListing && sortByRelevant
      ? userType === EMPLOYER
        ? pageListings.sort(
            (a, b) =>
              sortCaregiverMatch(b, currentUserListing) - sortCaregiverMatch(a, currentUserListing)
          )
        : pageListings.sort(
            (a, b) =>
              sortEmployerMatch(b, currentUserListing) - sortEmployerMatch(a, currentUserListing)
          )
      : currentUserType
      ? pageListings
      : [];

  return {
    currentUserTransactions: transactions,
    currentUserListing,
    isAuthenticated,
    listings: sortedListings,
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
    searchListingsSuccess,
  };
};

const mapDispatchToProps = dispatch => ({
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
  onActivateListing: listingId => dispatch(setActiveListing(listingId)),
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
