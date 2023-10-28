import React, { useState, useEffect, useMemo } from 'react';
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
  IconBell,
} from '../../components';
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
    currentUserListing,
    currentUserListingFetched,
    intl,
    isAuthenticated,
    onLogout,
    onChangeModalValue,
    unreadMessages,
  } = props;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const unreadNotificationCount = useMemo(
    () =>
      currentUser.attributes.profile.privateData.notifications?.reduce((acc, notification) => {
        if (!notification.isRead) {
          acc += 1;
        }
        return acc;
      }, 0),
    [currentUser]
  );

  const authenticatedOnClientSide = mounted && isAuthenticated;
  const isAuthenticatedOrJustHydrated = isAuthenticated || !mounted;

  const classes = classNames(rootClassName || css.root, className);

  const currentUserType = currentUser?.attributes?.profile?.metadata?.userType;

  const geolocation = currentUserListing?.attributes?.geolocation || {};
  const origin = `origin=${geolocation.lat}%2C${geolocation.lng}`;
  const distance = 'distance=30';
  const location = currentUserListing?.attributes?.publicData?.location;

  const oppositeUserType =
    currentUserType === EMPLOYER ? CAREGIVER : currentUserType === CAREGIVER ? EMPLOYER : null;

  const searchListings =
    isAuthenticatedOrJustHydrated && location ? (
      <NamedLink
        className={classNames(css.regularLink, currentPage === 'SearchPage' && css.activeLink)}
        name="SearchPage"
        to={{
          search: `?${origin}&${distance}&sort=relevant${oppositeUserType &&
            `&listingType=${oppositeUserType}`}`,
        }}
      >
        {currentUserType === CAREGIVER ? (
          <span className={css.linkText}>Job Listings</span>
        ) : (
          <span className={css.linkText}>Find Caregivers</span>
        )}
      </NamedLink>
    ) : null;

  const unreadMessageCountBadge =
    unreadMessages > 0 ? (
      <NotificationBadge className={css.unreadMessageBadge} count={unreadMessages} />
    ) : null;

  const unreadNotificationCountBadge =
    unreadNotificationCount > 0 ? (
      <NotificationBadge className={css.unreadNotificationBadge} count={unreadNotificationCount} />
    ) : null;

  const inboxLink = authenticatedOnClientSide ? (
    userCanMessage(currentUser) ? (
      <NamedLink
        className={classNames(
          css.regularLink,
          css.inboxLink,
          currentPage === 'InboxPage' && css.activeLink
        )}
        name="InboxPage"
        params={{ tab: 'messages' }}
      >
        <span className={css.linkText}>
          <FormattedMessage id="TopbarDesktop.inbox" />
          {unreadMessageCountBadge}
        </span>
      </NamedLink>
    ) : (
      <span
        className={classNames(css.regularLink, css.inboxLink)}
        onClick={() =>
          onChangeModalValue(getMissingInfoModalValue(currentUser, currentUserListing))
        }
      >
        <span className={css.linkText}>
          <FormattedMessage id="TopbarDesktop.inbox" />
          {unreadMessageCountBadge}
        </span>
      </span>
    )
  ) : null;

  const feedbackLink = isDev ? (
    <NamedLink
      className={classNames(css.regularLink, currentPage === 'FeedbackPage' && css.activeLink)}
      name="FeedbackPage"
    >
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
  const stripeCustomerId = currentUser?.stripeCustomer?.attributes?.stripeCustomerId;

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
        <MenuItem key="referral">
          {currentUserType === CAREGIVER && stripeCustomerId ? (
            <NamedLink
              className={classNames(css.yourListingsLink, currentPageClass('ReferralPage'))}
              name="ReferralPage"
            >
              <span className={css.menuItemBorder} />
              <FormattedMessage id="TopbarDesktop.referAFriendLink" />
            </NamedLink>
          ) : null}
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
    <NamedLink
      name="SignupPage"
      className={classNames(css.signupLink, currentPage === 'InboxPage' && css.activeLink)}
    >
      <span className={css.signup}>
        <FormattedMessage id="TopbarDesktop.signup" />
      </span>
    </NamedLink>
  );

  const loginLink = isAuthenticatedOrJustHydrated ? null : (
    <NamedLink
      name="LoginPage"
      className={classNames(css.loginLink, currentPage === 'LoginPage' && css.activeLink)}
    >
      <span className={css.login}>
        <FormattedMessage id="TopbarDesktop.login" />
      </span>
    </NamedLink>
  );

  const notificationsLink = authenticatedOnClientSide ? (
    <NamedLink
      className={classNames(
        css.regularLink,
        css.notificationsLink,
        currentPage === 'NotificationsPage' && css.activeLink
      )}
      name="NotificationsPage"
    >
      <span className={css.bell}>
        <IconBell height="2em" width="2em" />
        {unreadNotificationCountBadge}
      </span>
    </NamedLink>
  ) : null;

  const listingLink =
    authenticatedOnClientSide &&
    currentUserListingFetched &&
    currentUserListing &&
    !isNewListing ? (
      <ListingLink
        className={classNames(
          css.createListingLink,
          currentPage === 'OwnListingPage' && css.activeLink
        )}
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
          className={classNames(
            css.createListingLink,
            currentPage === 'EditListingPage' && css.activeLink
          )}
          listingFetched={currentUserListingFetched}
          listing={currentUserListing}
        >
          <span
            className={classNames(
              css.createListing,
              currentPage === 'EditListingPage' && css.activeLink
            )}
          >
            <FormattedMessage id="TopbarDesktop.finishYourListingLink" />
          </span>
        </OwnListingLink>
      ) : null
    ) : (
      <NamedLink
        className={classNames(
          css.createListingLink,
          currentPage === 'EditListingPage' && css.activeLink
        )}
        name="NewListingPage"
      >
        <span className={css.createListing}>
          <FormattedMessage id="TopbarDesktop.createListing" />
        </span>
      </NamedLink>
    );

  const forCaregivers = isAuthenticatedOrJustHydrated ? null : (
    <NamedLink name="ForCaregiversPage" className={css.caregiverButtonLink}>
      For Caregivers
    </NamedLink>
  );

  const bookingsLink = authenticatedOnClientSide ? (
    <NamedLink
      className={classNames(
        css.regularLink,
        css.bookingsLink,
        currentPage === 'BookingsPage' && css.activeLink
      )}
      name="BookingsPage"
    >
      <span className={css.linkText}>My Bookings</span>
    </NamedLink>
  ) : null;

  const whyCareVine = isAuthenticatedOrJustHydrated ? null : (
    <NamedLink name="WhyPrivateCarePage" className={css.whyCareVineLink}>
      Why Private Care?
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
        {bookingsLink}
        {/* {feedbackLink} */}
      </div>

      <div className={css.unauthenticatedContainer}>
        {notificationsLink}
        {profileMenu}
        {forCaregivers}
        {/* {whyCareVine} */}

        {signupLink}
        {loginLink}
      </div>
    </nav>
  );
};

export default TopbarDesktop;
