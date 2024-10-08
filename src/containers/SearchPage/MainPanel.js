import React, { Component } from 'react';
import { array, bool, func, number, object, shape, string } from 'prop-types';
import classNames from 'classnames';
import omit from 'lodash/omit';
import config from '../../config';
import routeConfiguration from '../../routeConfiguration';
import { FormattedMessage } from '../../util/reactIntl';
import { createResourceLocatorString } from '../../util/routes';
import { isAnyFilterActive } from '../../util/search';
import { propTypes } from '../../util/types';
import {
  SearchResultsPanel,
  SearchFiltersMobile,
  SearchFiltersPrimary,
  SearchFiltersSecondary,
  SortBy,
} from '../../components';
import { CAREGIVER, EMPLOYER } from '../../util/constants';
import ChangeLocationFilter from '../../components/ChangeLocationFilter/ChangeLocationFilter';

import FilterComponent from './FilterComponent';
import { validFilterParams } from './SearchPage.helpers';

import css from './SearchPage.module.css';

// Primary filters have their content in dropdown-popup.
// With this offset we move the dropdown to the left a few pixels on desktop layout.
const FILTER_DROPDOWN_OFFSET = -14;

// Search filters that can be used to filter caregivers as an employer
const employerSearchFilters = [
  'distance',
  'price',
  'keyword',
  'careTypes',
  'openToLiveIn',
  'experienceAreas',
  'certificationsAndTraining',
  'additionalInfo',
  'languagesSpoken',
];

// Search filters that can be used to filter employers as a caregiver
const caregiverSearchFilters = [
  'distance',
  'minPrice',
  'keyword',
  'careTypes',
  'residenceType',
  'scheduleType',
  'detailedCareNeeds',
  'additionalInfo',
  'languagesSpoken',
  'nearPublicTransit',
];

const cleanSearchFromConflictingParams = (searchParams, sortConfig, filterConfig) => {
  // Single out filters that should disable SortBy when an active
  // keyword search sorts the listings according to relevance.
  // In those cases, sort parameter should be removed.
  const sortingFiltersActive = isAnyFilterActive(
    sortConfig.conflictingFilters,
    searchParams,
    filterConfig
  );
  return sortingFiltersActive
    ? { ...searchParams, [sortConfig.queryParamName]: null }
    : searchParams;
};

/**
 * MainPanel contains search results and filters.
 * There are 3 presentational container-components that show filters:
 * SearchfiltersMobile, SearchFiltersPrimary, and SearchFiltersSecondary.
 * The last 2 are for desktop layout.
 */
class MainPanel extends Component {
  constructor(props) {
    super(props);
    this.state = { isSecondaryFiltersOpen: false, currentQueryParams: props.urlQueryParams };

    this.applyFilters = this.applyFilters.bind(this);
    this.cancelFilters = this.cancelFilters.bind(this);
    this.resetAll = this.resetAll.bind(this);

    this.initialValues = this.initialValues.bind(this);
    this.getHandleChangedValueFn = this.getHandleChangedValueFn.bind(this);

    // SortBy
    this.handleSortBy = this.handleSortBy.bind(this);
  }

  // Apply the filters by redirecting to SearchPage with new filters.
  applyFilters() {
    const { history, urlQueryParams, sortConfig, filterConfig } = this.props;
    const searchParams = { ...urlQueryParams, ...this.state.currentQueryParams };
    const search = cleanSearchFromConflictingParams(searchParams, sortConfig, filterConfig);

    history.push(createResourceLocatorString('SearchPage', routeConfiguration(), {}, search));
  }

  // Close the filters by clicking cancel, revert to the initial params
  cancelFilters() {
    this.setState({ currentQueryParams: {} });
  }

  // Reset all filter query parameters
  resetAll(e) {
    const { urlQueryParams, history, filterConfig } = this.props;
    const filterQueryParamNames = filterConfig.map(f => f.queryParamNames);

    // Reset state
    this.setState({ currentQueryParams: {} });

    const omitted = omit(urlQueryParams, filterQueryParamNames);
    history.push(
      createResourceLocatorString(
        'SearchPage',
        routeConfiguration(),
        {},
        { ...omitted, distance: 30 }
      )
    );
  }

  initialValues(queryParamNames) {
    // Query parameters that are visible in the URL
    const urlQueryParams = this.props.urlQueryParams;
    // Query parameters that are in state (user might have not yet clicked "Apply")
    const currentQueryParams = this.state.currentQueryParams;

    // Get initial value for a given parameter from state if its there.
    const getInitialValue = paramName => {
      const currentQueryParam = currentQueryParams[paramName];
      const hasQueryParamInState = typeof currentQueryParam !== 'undefined';
      return hasQueryParamInState ? currentQueryParam : urlQueryParams[paramName];
    };

    // Return all the initial values related to given queryParamNames
    // InitialValues for "amenities" filter could be
    // { amenities: "has_any:towel,jacuzzi" }
    const isArray = Array.isArray(queryParamNames);
    return isArray
      ? queryParamNames.reduce((acc, paramName) => {
          return { ...acc, [paramName]: getInitialValue(paramName) };
        }, {})
      : {};
  }

  getHandleChangedValueFn(useHistoryPush) {
    const { urlQueryParams, history, sortConfig, filterConfig } = this.props;

    return updatedURLParams => {
      const updater = prevState => {
        const { address, bounds } = urlQueryParams;
        const mergedQueryParams = { ...urlQueryParams, ...prevState.currentQueryParams };

        // Address and bounds are handled outside of MainPanel.
        // I.e. TopbarSearchForm && search by moving the map.
        // We should always trust urlQueryParams with those.
        return {
          currentQueryParams: { ...mergedQueryParams, ...updatedURLParams, address, bounds },
        };
      };

      const callback = () => {
        if (useHistoryPush) {
          const searchParams = this.state.currentQueryParams;
          const search = cleanSearchFromConflictingParams(searchParams, sortConfig, filterConfig);
          history.push(createResourceLocatorString('SearchPage', routeConfiguration(), {}, search));
        }
      };

      this.setState(updater, callback);
    };
  }

  componentWillReceiveProps = nextProps => {
    const { urlQueryParams } = nextProps;

    if (urlQueryParams?.distance > this.props?.urlQueryParams?.distance) {
      const distance = urlQueryParams?.distance;
      this.setState((prevState, props) => {
        const newQueryParams = { ...prevState.currentQueryParams, distance };
        return { currentQueryParams: { ...newQueryParams } };
      });
    }
  };

  handleSortBy(urlParam, values) {
    const { history, urlQueryParams } = this.props;
    const queryParams = values
      ? { ...urlQueryParams, [urlParam]: values }
      : omit(urlQueryParams, urlParam);

    history.push(createResourceLocatorString('SearchPage', routeConfiguration(), {}, queryParams));
  }

  render() {
    const {
      className,
      currentUser,
      currentUserListing,
      currentUserType,
      filterConfig,
      listings,
      onActivateListing,
      onCloseModal,
      onContactUser,
      onManageDisableScrolling,
      onOpenModal,
      pagination,
      rootClassName,
      searchInProgress,
      searchListingsError,
      searchParamsAreInSync,
      searchParamsForPagination,
      showAsModalMaxWidth,
      sortConfig,
      urlQueryParams,
      reviews,
    } = this.props;

    const primaryFilters = filterConfig.filter(f => f.group === 'primary');
    const secondaryFilters = filterConfig.filter(f => f.group !== 'primary');
    const hasSecondaryFilters = !!(secondaryFilters && secondaryFilters.length > 0);
    const userType = currentUser && currentUser.attributes.profile.metadata.userType;

    // Selected aka active filters
    const selectedFilters = validFilterParams(urlQueryParams, filterConfig);
    const selectedFiltersCount = Object.keys(selectedFilters).length;

    // Selected aka active secondary filters
    const selectedSecondaryFilters = hasSecondaryFilters
      ? validFilterParams(urlQueryParams, secondaryFilters)
      : {};
    const selectedSecondaryFiltersCount = Object.keys(selectedSecondaryFilters).length;

    const isSecondaryFiltersOpen = !!hasSecondaryFilters && this.state.isSecondaryFiltersOpen;
    const propsForSecondaryFiltersToggle = hasSecondaryFilters
      ? {
          isSecondaryFiltersOpen: this.state.isSecondaryFiltersOpen,
          toggleSecondaryFiltersOpen: isOpen => {
            this.setState({ isSecondaryFiltersOpen: isOpen });
          },
          selectedSecondaryFiltersCount,
        }
      : {};

    // With time-based availability filtering, pagination is NOT
    // supported. In these cases we get the pagination support info in
    // the response meta object, and we can use the count of listings
    // as the result count.
    //
    // See: https://www.sharetribe.com/api-reference/marketplace.html#availability-filtering
    const hasPaginationInfo = !!pagination && !pagination.paginationUnsupported;
    const listingsLength = listings ? listings.length : 0;
    const totalItems = listingsLength;

    const listingsAreLoaded = !searchInProgress && searchParamsAreInSync;

    const sortBy = mode => {
      const conflictingFilterActive = isAnyFilterActive(
        sortConfig.conflictingFilters,
        urlQueryParams,
        filterConfig
      );

      const mobileClassesMaybe =
        mode === 'mobile'
          ? {
              rootClassName: css.sortBy,
              menuLabelRootClassName: css.sortByMenuLabel,
            }
          : {};
      return sortConfig.active ? (
        <SortBy
          {...mobileClassesMaybe}
          sort={urlQueryParams[sortConfig.queryParamName]}
          isConflictingFilterActive={!!conflictingFilterActive}
          onSelect={this.handleSortBy}
          showAsPopup
          contentPlacementOffset={FILTER_DROPDOWN_OFFSET}
          currentUserType={currentUserType}
        />
      ) : null;
    };

    const classes = classNames(rootClassName || css.searchResultContainer, className);

    return (
      <div className={classes}>
        <SearchFiltersPrimary
          className={css.searchFiltersPrimary}
          sortByComponent={sortBy('desktop')}
          listingsAreLoaded={listingsAreLoaded}
          resultsCount={totalItems}
          searchInProgress={searchInProgress}
          searchListingsError={searchListingsError}
          {...propsForSecondaryFiltersToggle}
        >
          <ChangeLocationFilter
            id="SearchFiltersPrimary.changeLocation"
            name="location"
            filterConfig={config}
            urlQueryParams={urlQueryParams}
            initialValues={this.initialValues(['location'])}
            showAsPopup
            contentPlacementOffset={FILTER_DROPDOWN_OFFSET}
            onSubmit={this.getHandleChangedValueFn(true)}
          />
          {primaryFilters
            .filter(filter =>
              userType === CAREGIVER
                ? caregiverSearchFilters.includes(filter.id)
                : employerSearchFilters.includes(filter.id)
            )
            .map(config => {
              return (
                <FilterComponent
                  key={`SearchFiltersPrimary.${config.id}`}
                  idPrefix="SearchFiltersPrimary"
                  filterConfig={config}
                  urlQueryParams={urlQueryParams}
                  initialValues={this.initialValues}
                  getHandleChangedValueFn={this.getHandleChangedValueFn}
                  showAsPopup
                  contentPlacementOffset={FILTER_DROPDOWN_OFFSET}
                />
              );
            })}
        </SearchFiltersPrimary>
        <SearchFiltersMobile
          className={css.searchFiltersMobile}
          urlQueryParams={urlQueryParams}
          sortByComponent={sortBy('mobile')}
          listingsAreLoaded={listingsAreLoaded}
          resultsCount={totalItems}
          searchInProgress={searchInProgress}
          searchListingsError={searchListingsError}
          showAsModalMaxWidth={showAsModalMaxWidth}
          onManageDisableScrolling={onManageDisableScrolling}
          onOpenModal={onOpenModal}
          onCloseModal={onCloseModal}
          resetAll={this.resetAll}
          selectedFiltersCount={selectedFiltersCount}
          initialLocation={this.initialValues(['location'])}
          onLocationChange={this.getHandleChangedValueFn(true)}
          onApplyFilters={this.applyFilters}
        >
          {filterConfig
            .filter(filter =>
              userType === CAREGIVER
                ? caregiverSearchFilters.includes(filter.id)
                : employerSearchFilters.includes(filter.id)
            )
            .map(config => {
              return (
                <FilterComponent
                  key={`SearchFiltersMobile.${config.id}`}
                  idPrefix="SearchFiltersMobile"
                  filterConfig={config}
                  urlQueryParams={urlQueryParams}
                  initialValues={this.initialValues}
                  getHandleChangedValueFn={this.getHandleChangedValueFn}
                  showAsPopup={false}
                />
              );
            })}
        </SearchFiltersMobile>
        {isSecondaryFiltersOpen ? (
          <div className={classNames(css.searchFiltersPanel)}>
            <SearchFiltersSecondary
              urlQueryParams={urlQueryParams}
              listingsAreLoaded={listingsAreLoaded}
              applyFilters={this.applyFilters}
              cancelFilters={this.cancelFilters}
              resetAll={this.resetAll}
              onClosePanel={() => this.setState({ isSecondaryFiltersOpen: false })}
            >
              {secondaryFilters
                .filter(filter =>
                  userType === CAREGIVER
                    ? caregiverSearchFilters.includes(filter.id)
                    : employerSearchFilters.includes(filter.id)
                )
                .map(config => {
                  return (
                    <FilterComponent
                      key={`SearchFiltersSecondary.${config.id}`}
                      idPrefix="SearchFiltersSecondary"
                      filterConfig={config}
                      urlQueryParams={urlQueryParams}
                      initialValues={this.initialValues}
                      getHandleChangedValueFn={this.getHandleChangedValueFn}
                      showAsPopup={false}
                      currentUserType={currentUserType}
                    />
                  );
                })}
            </SearchFiltersSecondary>
          </div>
        ) : (
          <div
            className={classNames(css.listings, {
              [css.newSearchInProgress]: !listingsAreLoaded,
            })}
          >
            {searchListingsError ? (
              <h2 className={css.error}>
                <FormattedMessage id="SearchPage.searchError" />
              </h2>
            ) : null}
            <SearchResultsPanel
              className={css.searchListingsPanel}
              listings={listings}
              pagination={listingsAreLoaded ? pagination : null}
              search={searchParamsForPagination}
              setActiveListing={onActivateListing}
              currentUserType={currentUserType}
              currentUser={currentUser}
              onContactUser={onContactUser}
              currentUserListing={currentUserListing}
              onManageDisableScrolling={onManageDisableScrolling}
              urlQueryParams={urlQueryParams}
              reviews={reviews}
            />
          </div>
        )}
      </div>
    );
  }
}

MainPanel.defaultProps = {
  className: null,
  rootClassName: null,
  listings: [],
  resultsCount: 0,
  pagination: null,
  searchParamsForPagination: {},
  filterConfig: config.custom.filters,
  sortConfig: config.custom.sortConfig,
};

MainPanel.propTypes = {
  className: string,
  rootClassName: string,

  urlQueryParams: object.isRequired,
  listings: array,
  searchInProgress: bool.isRequired,
  searchListingsError: propTypes.error,
  searchParamsAreInSync: bool.isRequired,
  onActivateListing: func.isRequired,
  onManageDisableScrolling: func.isRequired,
  onOpenModal: func.isRequired,
  onCloseModal: func.isRequired,
  pagination: propTypes.pagination,
  searchParamsForPagination: object,
  showAsModalMaxWidth: number.isRequired,
  filterConfig: propTypes.filterConfig,
  sortConfig: propTypes.sortConfig,

  history: shape({
    push: func.isRequired,
  }).isRequired,
};

export default MainPanel;
