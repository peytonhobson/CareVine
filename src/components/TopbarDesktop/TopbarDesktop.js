import React, { useState, useEffect } from 'react';
import { bool, func, object, number, string, array } from 'prop-types';
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import classNames from 'classnames';
import { ACCOUNT_SETTINGS_PAGES } from '../../routeConfiguration';
import { propTypes } from '../../util/types';
import {
  Avatar,
  InlineTextButton,
  Logo,
  Menu,
  MenuLabel,
  MenuContent,
  MenuItem,
  NamedLink,
  ListingLink,
  OwnListingLink,
  NotificationBadge,
} from '../../components';
import { TopbarSearchForm } from '../../forms';
import { CAREGIVER, EMPLOYER } from '../../util/constants';
import { userCanMessage, getMissingInfoModalValue } from '../../util/data';
import { LISTING_PAGE_PARAM_TYPE_DRAFT, LISTING_PAGE_PARAM_TYPE_NEW } from '../../util/urlHelpers';

const isDev = process.env.REACT_APP_ENV === 'development';

const newListingStates = [LISTING_PAGE_PARAM_TYPE_NEW, LISTING_PAGE_PARAM_TYPE_DRAFT];

import css from './TopbarDesktop.module.css';

const TopbarDesktop = props => {
  const {
    className,
    currentUser,
    currentPage,
    rootClassName,
    currentUserHasListings,
    currentUserListing,
    currentUserListingFetched,
    notificationCount,
    intl,
    isAuthenticated,
    onLogout,
    onSearchSubmit,
    initialSearchFormValues,
    onChangeModalValue,
    unreadMessages,
  } = props;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const authenticatedOnClientSide = mounted && isAuthenticated;
  const isAuthenticatedOrJustHydrated = isAuthenticated || !mounted;

  const classes = classNames(rootClassName || css.root, className);

  const currentUserType = currentUser?.attributes?.profile?.metadata?.userType;

  const geolocation = currentUserListing?.attributes?.geolocation || {};
  const origin = `origin=${geolocation.lat}%2C${geolocation.lng}`;
  const distance = 'distance=30';
  const location = currentUserListing?.attributes?.publicData?.location;

  const searchListings =
    isAuthenticatedOrJustHydrated && location ? (
      <NamedLink
        className={css.regularLink}
        name="SearchPage"
        to={{ search: `?${origin}&${distance}&sort=relevant` }}
      >
        {currentUserType === CAREGIVER ? (
          <span className={css.linkText}>My Job Board</span>
        ) : (
          <span className={css.linkText}>Find Caregivers</span>
        )}
      </NamedLink>
    ) : null;

  const notificationCountBadge =
    unreadMessages > 0 ? (
      <NotificationBadge className={css.notificationBadge} count={unreadMessages} />
    ) : null;

  const inboxLink = authenticatedOnClientSide ? (
    userCanMessage(currentUser) ? (
      <NamedLink
        className={classNames(css.regularLink, css.inboxLink)}
        name="InboxPage"
        params={{ tab: 'messages' }}
      >
        <span className={css.linkText}>
          <FormattedMessage id="TopbarDesktop.inbox" />
          {notificationCountBadge}
        </span>
      </NamedLink>
    ) : (
      <span
        className={classNames(css.regularLink, css.inboxLink)}
        onClick={() => onChangeModalValue(getMissingInfoModalValue(currentUser))}
      >
        <span className={css.linkText}>
          <FormattedMessage id="TopbarDesktop.inbox" />
          {notificationCountBadge}
        </span>
      </span>
    )
  ) : null;

  const feedbackLink = isDev ? (
    <NamedLink className={css.regularLink} name="FeedbackPage">
      <span className={css.feedbackText}>
        <FormattedMessage id="TopbarDesktop.feedback" />
      </span>
    </NamedLink>
  ) : null;

  const currentPageClass = page => {
    const isAccountSettingsPage =
      page === 'AccountSettingsPage' && ACCOUNT_SETTINGS_PAGES.includes(currentPage);
    return currentPage === page || isAccountSettingsPage ? css.currentPage : null;
  };

  const isNewListing = newListingStates.includes(currentUserListing?.attributes?.state);

  const profileMenu = authenticatedOnClientSide ? (
    <Menu>
      <MenuLabel className={css.profileMenuLabel} isOpenClassName={css.profileMenuIsOpen}>
        <Avatar className={css.avatar} user={currentUser} disableProfileLink />
      </MenuLabel>
      <MenuContent className={css.profileMenuContent}>
        <MenuItem key="EditListingPage">
          <OwnListingLink
            listing={currentUserListing}
            listingFetched={currentUserListingFetched}
            className={css.yourListingsLink}
          >
            <div>
              <span className={css.menuItemBorder} />
              {currentUserListing ? (
                isNewListing ? (
                  <FormattedMessage id="TopbarDesktop.finishYourListingLink" />
                ) : (
                  <FormattedMessage id="TopbarDesktop.editYourListingLink" />
                )
              ) : (
                <FormattedMessage id="TopbarDesktop.addYourListingLink" />
              )}
            </div>
          </OwnListingLink>
        </MenuItem>
        <MenuItem key="AccountSettingsPage">
          <NamedLink
            className={classNames(css.yourListingsLink, currentPageClass('AccountSettingsPage'))}
            name="AccountSettingsPage"
          >
            <span className={css.menuItemBorder} />
            <FormattedMessage id="TopbarDesktop.accountSettingsLink" />
          </NamedLink>
        </MenuItem>
        <MenuItem key="logout">
          <InlineTextButton rootClassName={css.logoutButton} onClick={onLogout}>
            <span className={css.menuItemBorder} />
            <FormattedMessage id="TopbarDesktop.logout" />
          </InlineTextButton>
        </MenuItem>
      </MenuContent>
    </Menu>
  ) : null;

  const signupLink = isAuthenticatedOrJustHydrated ? null : (
    <NamedLink name="SignupPage" className={css.signupLink}>
      <span className={css.signup}>
        <FormattedMessage id="TopbarDesktop.signup" />
      </span>
    </NamedLink>
  );

  const loginLink = isAuthenticatedOrJustHydrated ? null : (
    <NamedLink name="LoginPage" className={css.loginLink}>
      <span className={css.login}>
        <FormattedMessage id="TopbarDesktop.login" />
      </span>
    </NamedLink>
  );

  const listingLink =
    authenticatedOnClientSide &&
    currentUserListingFetched &&
    currentUserListing &&
    !isNewListing ? (
      <ListingLink
        className={css.createListingLink}
        listing={currentUserListing}
        children={
          <span className={css.createListing}>
            <FormattedMessage id="TopbarDesktop.viewListing" />
          </span>
        }
      />
    ) : null;

  const createListingLink =
    !isAuthenticatedOrJustHydrated || !(currentUserListingFetched && !currentUserListing) ? (
      isNewListing ? (
        <OwnListingLink
          className={css.createListingLink}
          listingFetched={currentUserListingFetched}
          listing={currentUserListing}
        >
          <span className={css.createListing}>
            <FormattedMessage id="TopbarDesktop.finishYourListingLink" />
          </span>
        </OwnListingLink>
      ) : null
    ) : (
      <NamedLink className={css.createListingLink} name="NewListingPage">
        <span className={css.createListing}>
          <FormattedMessage id="TopbarDesktop.createListing" />
        </span>
      </NamedLink>
    );

  return (
    <nav className={classes}>
      <NamedLink className={css.logoLink} name="LandingPage">
        <Logo format="desktop" className={css.logo} alt="CareVine" />
      </NamedLink>
      <div className={css.authenticatedLinks}>
        {searchListings}
        {listingLink}
        {createListingLink}
        {inboxLink}
        {feedbackLink}
      </div>
      {profileMenu}

      <div className={css.unauthenticatedContainer}>
        {signupLink}
        {loginLink}
      </div>
    </nav>
  );
};

TopbarDesktop.defaultProps = {
  rootClassName: null,
  className: null,
  currentUser: null,
  currentPage: null,
  notificationCount: 0,
  initialSearchFormValues: {},
  currentUserListing: null,
  currentUserListingFetched: false,
};

TopbarDesktop.propTypes = {
  rootClassName: string,
  className: string,
  currentUserHasListings: bool.isRequired,
  currentUserListing: propTypes.ownListing,
  currentUserListingFetched: bool,
  currentUser: propTypes.currentUser,
  currentPage: string,
  isAuthenticated: bool.isRequired,
  onLogout: func.isRequired,
  notificationCount: number,
  onSearchSubmit: func.isRequired,
  initialSearchFormValues: object,
  intl: intlShape.isRequired,
};

export default TopbarDesktop;
