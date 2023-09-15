/**
 *  TopbarMobileMenu prints the menu content for authenticated user or
 * shows login actions for those who are not authenticated.
 */
import React, { useEffect } from 'react';
import { bool, func, number, string, array } from 'prop-types';
import { FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import { ACCOUNT_SETTINGS_PAGES } from '../../routeConfiguration';
import { propTypes } from '../../util/types';
import { ensureCurrentUser, userCanMessage, getMissingInfoModalValue } from '../../util/data';
import {
  Avatar,
  InlineTextButton,
  NamedLink,
  NotificationBadge,
  OwnListingLink,
  ListingLink,
  IconBell,
  Logo,
} from '../../components';
import { CAREGIVER, EMPLOYER } from '../../util/constants';
import { LISTING_PAGE_PARAM_TYPE_DRAFT, LISTING_PAGE_PARAM_TYPE_NEW } from '../../util/urlHelpers';

import css from './TopbarMobileMenu.module.css';

const isDev = process.env.REACT_APP_ENV === 'development';

const newListingStates = [LISTING_PAGE_PARAM_TYPE_NEW, LISTING_PAGE_PARAM_TYPE_DRAFT];

const TopbarMobileMenu = props => {
  const {
    isAuthenticated,
    currentPage,
    currentUserHasListings,
    currentUserListing,
    currentUserListingFetched,
    currentUser,
    onLogout,
    onChangeModalValue,
    unreadMessages,
    unreadNotificationCount,
    isOpen,
  } = props;

  const user = ensureCurrentUser(currentUser);

  const userType = user.attributes.profile.metadata.userType;
  const stripeCustomerId = user.stripeCustomer?.attributes?.stripeCustomerId;
  const isNewListing = newListingStates.includes(currentUserListing?.attributes?.state);

  if (!isAuthenticated) {
    const signup = (
      <NamedLink name="SignupPage" className={css.signupLink}>
        <FormattedMessage id="TopbarMobileMenu.signupLink" />
      </NamedLink>
    );

    const login = (
      <NamedLink name="LoginPage" className={css.loginLink}>
        <FormattedMessage id="TopbarMobileMenu.loginLink" />
      </NamedLink>
    );

    const signupOrLogin = (
      <span className={css.authenticationLinks}>
        <FormattedMessage id="TopbarMobileMenu.signupOrLogin" values={{ signup, login }} />
      </span>
    );

    const forCaregivers = !isAuthenticated ? (
      <NamedLink name="ForCaregiversPage" className={classNames(css.navigationLink, '!mt-36')}>
        For Caregivers
      </NamedLink>
    ) : null;

    const whyCareVine = !isAuthenticated ? (
      <NamedLink name="WhyPrivateCarePage" className={css.infoPageLink}>
        Why Private Care?
      </NamedLink>
    ) : null;

    return (
      <div className={css.root}>
        <div className={css.content}>
          <div className={css.authenticationGreeting}>
            <FormattedMessage
              id="TopbarMobileMenu.unauthorizedGreeting"
              values={{ lineBreak: <br />, signupOrLogin }}
            />
          </div>
          {forCaregivers}
          {/* {whyCareVine} */}
        </div>
        <div className={css.footer}>
          <NamedLink className={css.createNewListingLink} name="NewListingPage">
            <FormattedMessage id="TopbarMobileMenu.newListingLink" />
          </NamedLink>
        </div>
      </div>
    );
  }

  const referralLink =
    userType === CAREGIVER && stripeCustomerId ? (
      <NamedLink className={css.navigationLink} name="ReferralPage">
        Refer a Friend
      </NamedLink>
    ) : null;

  const bookingsLink = isAuthenticated ? (
    <NamedLink className={css.navigationLink} name="BookingsPage">
      My Bookings
    </NamedLink>
  ) : null;

  const feedbackLink = isDev ? (
    <NamedLink className={css.navigationLink} name="FeedbackPage">
      <span className={css.feedbackText}>
        <FormattedMessage id="TopbarMobileMenu.feedback" />
      </span>
    </NamedLink>
  ) : null;

  const displayName = user.attributes.profile.firstName;
  const currentPageClass = page => {
    const isAccountSettingsPage =
      page === 'AccountSettingsPage' && ACCOUNT_SETTINGS_PAGES.includes(currentPage);
    return currentPage === page || isAccountSettingsPage ? css.currentPage : null;
  };

  const geolocation = currentUserListing?.attributes?.geolocation || {};
  const origin = `origin=${geolocation.lat}%2C${geolocation.lng}`;
  const distance = 'distance=30';
  const location = currentUserListing?.attributes?.publicData?.location;

  const oppositeUserType =
    userType === EMPLOYER ? CAREGIVER : userType === CAREGIVER ? EMPLOYER : null;

  const listingLink =
    isAuthenticated && currentUserListingFetched && currentUserListing && !isNewListing ? (
      <ListingLink
        className={classNames(css.navigationLink, 'bg-secondary')}
        listing={currentUserListing}
        children={<FormattedMessage id="TopbarDesktop.viewListing" />}
      />
    ) : null;

  const createListingLink =
    !isAuthenticated || !(currentUserListingFetched && !currentUserListing) ? (
      isNewListing ? (
        <OwnListingLink
          className={classNames(css.navigationLink, 'bg-secondary')}
          listingFetched={currentUserListingFetched}
          listing={currentUserListing}
        >
          <FormattedMessage id="TopbarDesktop.finishYourListingLink" />
        </OwnListingLink>
      ) : null
    ) : (
      <NamedLink className={classNames(css.navigationLink, 'bg-secondary')} name="NewListingPage">
        <FormattedMessage id="TopbarDesktop.createListing" />
      </NamedLink>
    );

  return (
    <div className={css.root}>
      <Avatar className={css.avatar} initialsClassName={css.avatarInitials} user={currentUser} />
      <div className={css.content}>
        <span className={css.greeting}>
          <FormattedMessage id="TopbarMobileMenu.greeting" values={{ displayName }} />
        </span>
        <InlineTextButton rootClassName={css.logoutButton} onClick={onLogout}>
          <FormattedMessage id="TopbarMobileMenu.logoutLink" />
        </InlineTextButton>
        <div className="mt-10 flex gap-4 flex-wrap">
          {createListingLink}
          {listingLink}
          {bookingsLink}
          <NamedLink
            className={classNames(css.navigationLink, currentPageClass('AccountSettingsPage'))}
            name="AccountSettingsPage"
          >
            Account Settings
          </NamedLink>
          {referralLink}
          {/* {feedbackLink} */}
        </div>
      </div>
      <div className={css.footer}>
        {!isNewListing ? (
          <NamedLink
            className={css.createNewListingLink}
            name="SearchPage"
            to={{
              search: `?${origin}&${distance}&sort=relevant${oppositeUserType &&
                `&listingType=${oppositeUserType}`}`,
            }}
          >
            {userType === CAREGIVER ? <span>Job Listings</span> : <span>Find Caregivers</span>}
          </NamedLink>
        ) : (
          <NamedLink className={css.createNewListingLink} name="NewListingPage">
            {userType === CAREGIVER ? (
              <FormattedMessage id="TopbarMobileMenu.newListingLinkCaregiver" />
            ) : (
              <FormattedMessage id="TopbarMobileMenu.newListingLinkEmployer" />
            )}
          </NamedLink>
        )}
      </div>
    </div>
  );
};

export default TopbarMobileMenu;
