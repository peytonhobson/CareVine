import React, { Component } from 'react';
import { array, bool, func, number, shape, string } from 'prop-types';
import { compose } from 'redux';
import { FormattedMessage, intlShape, injectIntl } from '../../util/reactIntl';
import pickBy from 'lodash/pickBy';
import classNames from 'classnames';
import config from '../../config';
import routeConfiguration from '../../routeConfiguration';
import { withViewport } from '../../util/contextHelpers';
import { parse, stringify } from '../../util/urlHelpers';
import { createResourceLocatorString, pathByRouteName } from '../../util/routes';
import { propTypes } from '../../util/types';
import {
  Button,
  LimitedAccessBanner,
  Logo,
  Modal,
  ModalMissingInformation,
  NamedLink,
  TopbarDesktop,
  TopbarMobileMenu,
  GenericError,
  SessionTimeout,
} from '../../components';
import { ensureCurrentUser } from '../../util/data';

import MenuIcon from './MenuIcon';
import SearchIcon from './SearchIcon';
import css from './Topbar.module.css';
import SocketClient from './SocketClient';

const MAX_MOBILE_SCREEN_WIDTH = 768;

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

const redirectToURLWithModalState = (props, modalStateParam) => {
  const { history, location } = props;
  const { pathname, search, state } = location;
  const searchString = `?${stringify({ [modalStateParam]: 'open', ...parse(search) })}`;
  history.push(`${pathname}${searchString}`, state);
};

const redirectToURLWithoutModalState = (props, modalStateParam) => {
  const { history, location } = props;
  const { pathname, search, state } = location;
  const queryParams = pickBy(parse(search), (v, k) => {
    return k !== modalStateParam;
  });
  const stringified = stringify(queryParams);
  const searchString = stringified ? `?${stringified}` : '';
  history.push(`${pathname}${searchString}`, state);
};

class TopbarComponent extends Component {
  constructor(props) {
    super(props);

    this.state = { started: false };

    this.handleMobileMenuOpen = this.handleMobileMenuOpen.bind(this);
    this.handleMobileMenuClose = this.handleMobileMenuClose.bind(this);
    this.handleMobileSearchOpen = this.handleMobileSearchOpen.bind(this);
    this.handleMobileSearchClose = this.handleMobileSearchClose.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
  }

  handleMobileMenuOpen() {
    redirectToURLWithModalState(this.props, 'mobilemenu');
  }

  handleMobileMenuClose() {
    redirectToURLWithoutModalState(this.props, 'mobilemenu');
  }

  handleMobileSearchOpen() {
    redirectToURLWithModalState(this.props, 'mobilesearch');
  }

  handleMobileSearchClose() {
    redirectToURLWithoutModalState(this.props, 'mobilesearch');
  }

  handleSubmit(values) {
    const { currentSearchParams } = this.props;
    const { search, selectedPlace } = values.location;
    const { history } = this.props;
    const { origin, bounds } = selectedPlace;
    const distance = 30;
    const originMaybe = config.sortSearchByDistance ? { origin } : {};
    const searchParams = {
      ...currentSearchParams,
      ...originMaybe,
      address: search,
      bounds,
      distance,
    };
    history.push(createResourceLocatorString('SearchPage', routeConfiguration(), {}, searchParams));
  }

  handleLogout() {
    const { onLogout, history } = this.props;
    onLogout().then(() => {
      const path = pathByRouteName('LandingPage', routeConfiguration());

      // In production we ensure that data is really lost,
      // but in development mode we use stored values for debugging
      if (config.dev) {
        history.push(path);
      } else if (typeof window !== 'undefined') {
        window.location = path;
      }

      console.log('logged out'); // eslint-disable-line
    });
  }

  render() {
    const {
      className,
      rootClassName,
      desktopClassName,
      mobileRootClassName,
      mobileClassName,
      isAuthenticated,
      authScopes,
      authInProgress,
      currentUser,
      currentUserHasListings,
      currentUserListing,
      currentUserListingFetched,
      currentPage,
      viewport,
      intl,
      location,
      onManageDisableScrolling,
      onResendVerificationEmail,
      sendVerificationEmailInProgress,
      sendVerificationEmailError,
      showGenericError,
      modalValue,
      onChangeModalValue,
      unreadMessages,
      onFetchConversations,
    } = this.props;

    const { mobilemenu } = parse(location.search, {
      latlng: ['origin'],
      latlngBounds: ['bounds'],
    });

    const ensuredCurrentUser = ensureCurrentUser(currentUser);
    const unreadNotificationCount = ensuredCurrentUser.attributes.profile.privateData.notifications?.filter(
      notification => !notification.isRead
    )?.length;

    console.log(unreadNotificationCount);

    const notificationDot =
      unreadMessages > 0 || unreadNotificationCount > 0 ? (
        <div className={css.notificationDot} />
      ) : null;

    const isMobileLayout = viewport.width < MAX_MOBILE_SCREEN_WIDTH;
    const isMobileMenuOpen = isMobileLayout && mobilemenu === 'open';

    const mobileMenu = (
      <TopbarMobileMenu
        isAuthenticated={isAuthenticated}
        currentUserHasListings={currentUserHasListings}
        currentUserListing={currentUserListing}
        currentUserListingFetched={currentUserListingFetched}
        currentUser={currentUser}
        onLogout={this.handleLogout}
        currentPage={currentPage}
        onChangeModalValue={onChangeModalValue}
        unreadMessages={unreadMessages}
        unreadNotificationCount={unreadNotificationCount}
        isOpen={isMobileMenuOpen}
      />
    );

    const classes = classNames(rootClassName || css.root, className);

    return (
      <div className={classes}>
        <LimitedAccessBanner
          isAuthenticated={isAuthenticated}
          authScopes={authScopes}
          currentUser={currentUser}
          onLogout={this.handleLogout}
          currentPage={currentPage}
        />
        {isMobile ? (
          <div className={classNames(mobileRootClassName || css.container, mobileClassName)}>
            <Button
              rootClassName={css.menu}
              onClick={this.handleMobileMenuOpen}
              title={intl.formatMessage({ id: 'Topbar.menuIcon' })}
            >
              <MenuIcon className={css.menuIcon} />
              {notificationDot}
            </Button>
            <NamedLink
              className={css.home}
              name="LandingPage"
              title={intl.formatMessage({ id: 'Topbar.logoIcon' })}
            >
              <Logo format="mobile" />
            </NamedLink>
            {!isAuthenticated ? (
              <NamedLink className={css.signUp} name="SignupPage" title="Sign up">
                Sign up
              </NamedLink>
            ) : (
              <Button
                rootClassName={css.searchMenu}
                onClick={() => {}}
                title={intl.formatMessage({ id: 'Topbar.searchIcon' })}
              >
                <div>
                  <SearchIcon className={css.searchMenuIcon} />
                  <span className={css.caregivers}>Caregivers</span>
                </div>
              </Button>
            )}
          </div>
        ) : (
          <div className={css.desktop}>
            <TopbarDesktop
              className={desktopClassName}
              currentUserHasListings={currentUserHasListings}
              currentUserListing={currentUserListing}
              currentUserListingFetched={currentUserListingFetched}
              currentUser={currentUser}
              currentPage={currentPage}
              intl={intl}
              isAuthenticated={isAuthenticated}
              onLogout={this.handleLogout}
              onSearchSubmit={this.handleSubmit}
              onChangeModalValue={onChangeModalValue}
              unreadMessages={unreadMessages}
              unreadNotificationCount={unreadNotificationCount}
            />
          </div>
        )}
        <Modal
          id="TopbarMobileMenu"
          isOpen={isMobileMenuOpen}
          onClose={this.handleMobileMenuClose}
          usePortal
          onManageDisableScrolling={onManageDisableScrolling}
        >
          {authInProgress ? null : mobileMenu}
        </Modal>
        <ModalMissingInformation
          id="MissingInformationReminder"
          containerClassName={css.missingInformationModal}
          currentUser={currentUser}
          currentUserListing={currentUserListing}
          location={location}
          onManageDisableScrolling={onManageDisableScrolling}
          onResendVerificationEmail={onResendVerificationEmail}
          sendVerificationEmailInProgress={sendVerificationEmailInProgress}
          sendVerificationEmailError={sendVerificationEmailError}
          modalValue={modalValue}
          onChangeModalValue={onChangeModalValue}
        />
        {isAuthenticated && <SocketClient currentPage={currentPage} />}
        <GenericError
          show={showGenericError}
          errorText={<FormattedMessage id="Topbar.genericError" />}
        />
      </div>
    );
  }
}

const Topbar = compose(withViewport, injectIntl)(TopbarComponent);

Topbar.displayName = 'Topbar';

export default Topbar;
