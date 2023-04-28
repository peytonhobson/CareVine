/**
 *  TopbarMobileMenu prints the menu content for authenticated user or
 * shows login actions for those who are not authenticated.
 */
import React from 'react';
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
    return (
      <div className={css.root}>
        <div className={css.content}>
          <div className={css.authenticationGreeting}>
            <FormattedMessage
              id="TopbarMobileMenu.unauthorizedGreeting"
              values={{ lineBreak: <br />, signupOrLogin }}
            />
          </div>
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
        <FormattedMessage id="TopbarDesktop.referAFriendLink" />
      </NamedLink>
    ) : null;

  const feedbackLink = isDev ? (
    <NamedLink className={css.navigationLink} name="FeedbackPage">
      <span className={css.feedbackText}>
        <FormattedMessage id="TopbarMobileMenu.feedback" />
      </span>
    </NamedLink>
  ) : null;

  const unreadNotificationCountBadge =
    unreadNotificationCount > 0 ? (
      <NotificationBadge className={css.notificationBadge} count={unreadNotificationCount} />
    ) : null;

  const unreadMessagesBadge =
    unreadMessages > 0 ? (
      <NotificationBadge className={css.messageBadge} count={unreadMessages} />
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
        className={css.navigationLink}
        listing={currentUserListing}
        children={<FormattedMessage id="TopbarDesktop.viewListing" />}
      />
    ) : null;

  const createListingLink =
    !isAuthenticated || !(currentUserListingFetched && !currentUserListing) ? (
      isNewListing ? (
        <OwnListingLink
          className={css.navigationLink}
          listingFetched={currentUserListingFetched}
          listing={currentUserListing}
        >
          <FormattedMessage id="TopbarDesktop.finishYourListingLink" />
        </OwnListingLink>
      ) : null
    ) : (
      <NamedLink className={css.navigationLink} name="NewListingPage">
        <FormattedMessage id="TopbarDesktop.createListing" />
      </NamedLink>
    );

  const notificationsLink = isAuthenticated ? (
    <NamedLink
      className={classNames(css.regularLink, css.notificationsLink)}
      name="NotificationsPage"
    >
      <span className={css.bell}>
        <IconBell height="2.5em" width="2.5em" />
        {unreadNotificationCountBadge}
      </span>
    </NamedLink>
  ) : null;

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
        {notificationsLink}
        {userCanMessage(currentUser) ? (
          <NamedLink
            className={classNames(css.inbox, currentPageClass('InboxPage'))}
            name="InboxPage"
            params={{ tab: 'messages' }}
          >
            <FormattedMessage id="TopbarMobileMenu.inboxLink" />
            {unreadMessagesBadge}
          </NamedLink>
        ) : (
          <span
            className={classNames(css.inbox, currentPageClass('InboxPage'))}
            onClick={() => onChangeModalValue(getMissingInfoModalValue(currentUser))}
          >
            <FormattedMessage id="TopbarMobileMenu.inboxLink" />
            {unreadMessagesBadge}
          </span>
        )}
        {createListingLink}
        {listingLink}
        <NamedLink
          className={classNames(css.navigationLink, currentPageClass('AccountSettingsPage'))}
          name="AccountSettingsPage"
        >
          <FormattedMessage id="TopbarMobileMenu.accountSettingsLink" />
        </NamedLink>
        {referralLink}
        {feedbackLink}
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

TopbarMobileMenu.defaultProps = {
  currentUser: null,
  notificationCount: 0,
  currentPage: null,
  currentUserListing: null,
  currentUserListingFetched: false,
};

TopbarMobileMenu.propTypes = {
  isAuthenticated: bool.isRequired,
  currentUserHasListings: bool.isRequired,
  currentUserListing: propTypes.ownListing,
  currentUserListingFetched: bool,
  currentUser: propTypes.currentUser,
  currentPage: string,
  notificationCount: number,
  onLogout: func.isRequired,
};

export default TopbarMobileMenu;
