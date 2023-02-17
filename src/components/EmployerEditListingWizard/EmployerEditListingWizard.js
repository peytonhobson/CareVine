import React, { Component, useEffect } from 'react';
import { array, bool, func, number, object, oneOf, shape, string } from 'prop-types';
import { compose } from 'redux';
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
import { EMAIL_VERIFICATION } from '../ModalMissingInformation/ModalMissingInformation';

import { Modal, NamedRedirect, Tabs } from '..';

import EditListingWizardTab, {
  CARE_TYPE,
  CARE_SCHEDULE,
  LOCATION,
  PRICING,
  CARE_RECIPIENT,
  CAREIGVER_PREFERENCES,
  PROFILE_PICTURE,
  JOB_DESCRIPTION,
} from '../EditListingWizardTab/EditListingWizardTab';
import css from './EmployerEditListingWizard.module.css';

// You can reorder these panels.
// Note 1: You need to change save button translations for new listing flow
// Note 2: Ensure that draft listing is created after the first panel
// and listing publishing happens after last panel.
// Note 3: in FTW-hourly template we don't use the POLICY tab so it's commented out.
// If you want to add a free text field to your listings you can enable the POLICY tab
export const TABS = [
  CARE_TYPE,
  LOCATION,
  CARE_SCHEDULE,
  PRICING,
  CARE_RECIPIENT,
  CAREIGVER_PREFERENCES,
  JOB_DESCRIPTION,
  PROFILE_PICTURE,
];

// Tabs are horizontal in small screens
const MAX_HORIZONTAL_NAV_SCREEN_WIDTH = 1023;

const tabLabel = (intl, tab) => {
  let key = null;
  if (tab === CARE_TYPE) {
    key = 'EmployerEditListingWizard.tabLabelCareType';
  } else if (tab === LOCATION) {
    key = 'EmployerEditListingWizard.tabLabelLocation';
  } else if (tab === PRICING) {
    key = 'EmployerEditListingWizard.tabLabelPricing';
  } else if (tab === CARE_SCHEDULE) {
    key = 'EmployerEditListingWizard.tabLabelCareSchedule';
  } else if (tab === CARE_RECIPIENT) {
    key = 'EmployerEditListingWizard.tabLabelCareRecipient';
  } else if (tab === CAREIGVER_PREFERENCES) {
    key = 'EmployerEditListingWizard.tabLabelCaregiverPreferences';
  } else if (tab === JOB_DESCRIPTION) {
    key = 'EmployerEditListingWizard.tabLabelJobDescription';
  } else if (tab === PROFILE_PICTURE) {
    key = 'EmployerEditListingWizard.tabLabelProfilePicture';
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
const tabCompleted = (tab, listing) => {
  const { geolocation, title, publicData, description } = listing.attributes;

  switch (tab) {
    case CARE_TYPE:
      return !!(publicData && publicData.careTypes);
    case LOCATION:
      return !!(geolocation && publicData && publicData.location);
    case CARE_SCHEDULE:
      return !!(publicData && publicData.availabilityPlan);
    case PRICING:
      return !!(publicData && publicData.minPrice && publicData.maxPrice);
    case CARE_RECIPIENT:
      return !!(publicData && publicData?.careRecipients?.length > 0);
    case CAREIGVER_PREFERENCES:
      return !!(publicData && publicData.languagesSpoken && publicData.covidVaccination);
    case JOB_DESCRIPTION:
      return !!description;
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
const tabsActive = (isNew, listing) => {
  return TABS.reduce((acc, tab) => {
    const previousTabIndex = TABS.findIndex(t => t === tab) - 1;
    const isActive =
      previousTabIndex >= 0 ? !isNew || tabCompleted(TABS[previousTabIndex], listing) : true;
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

// Create a new or edit listing through EmployerEditListingWizard
class EmployerEditListingWizard extends Component {
  constructor(props) {
    super(props);

    // Having this info in state would trigger unnecessary rerendering
    this.hasScrolledToTab = false;

    this.state = {
      draftId: null,
      portalRoot: null,
    };
    this.handleCreateFlowTabScrolling = this.handleCreateFlowTabScrolling.bind(this);
    this.handlePublishListing = this.handlePublishListing.bind(this);
  }

  handleCreateFlowTabScrolling(shouldScroll) {
    this.hasScrolledToTab = shouldScroll;
  }

  handlePublishListing(id) {
    const { onPublishListingDraft, currentUser, onChangeMissingInfoModal, history } = this.props;

    onPublishListingDraft(id).then(res => {
      if (res.type !== 'error') {
        if (
          currentUser &&
          !currentUser.attributes.emailVerified &&
          !history.location.pathname.includes('create-profile')
        ) {
          onChangeMissingInfoModal(getMissingInfoModalValue(currentUser));
        } else if (history.location.pathname.includes('create-profile')) {
          history.push('/signup');
        }
      }
    });
  }

  render() {
    const {
      id,
      className,
      rootClassName,
      params,
      listing,
      viewport,
      intl,
      errors,
      fetchInProgress,
      onManageDisableScrolling,
      currentUser,
      pageName,
      profileImage,
      onProfileImageUpload,
      onUpdateProfile,
      uploadInProgress,
      ...rest
    } = this.props;

    const selectedTab = params.tab;
    const isNewListingFlow = [LISTING_PAGE_PARAM_TYPE_NEW, LISTING_PAGE_PARAM_TYPE_DRAFT].includes(
      params.type
    );
    const rootClasses = rootClassName || css.root;
    const classes = classNames(rootClasses, className);
    const currentListing = ensureListing(listing);
    const tabsStatus = tabsActive(isNewListingFlow, currentListing);

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

    const ensuredCurrentUser = ensureCurrentUser(currentUser);

    return (
      <div className={classes}>
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
                currentUser={ensuredCurrentUser}
                onProfileImageUpload={onProfileImageUpload}
                uploadInProgress={uploadInProgress}
                onUpdateProfile={onUpdateProfile}
              />
            );
          })}
        </Tabs>
      </div>
    );
  }
}

EmployerEditListingWizard.defaultProps = {
  className: null,
  currentUser: null,
  rootClassName: null,
  listing: null,
  pageName: 'EditListingPage',
};

EmployerEditListingWizard.propTypes = {
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

  fetchInProgress: bool.isRequired,
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

export default compose(withViewport, injectIntl)(EmployerEditListingWizard);
