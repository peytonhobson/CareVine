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
} from '../../components';
import { TopbarSearchForm } from '../../forms';
import { ensureCurrentUser } from '../../util/data';

import MenuIcon from './MenuIcon';
import SearchIcon from './SearchIcon';
import css from './Topbar.module.css';

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

  componentDidMount() {
    const { currentUser } = this.props;
    const userAccessCode = currentUser?.id?.uuid;

    if (userAccessCode && !this.pollingInterval) {
      this.props.onFetchUnreadMessages();
      this.props.onFetchCurrentUser();
      this.pollingInterval = setInterval(() => {
        this.props.onFetchUnreadMessages();
        this.props.onFetchCurrentUser();
      }, 10000);
    }
  }

  componentDidUpdate(prevProps) {
    const { currentUser } = this.props;
    const userAccessCode = currentUser?.id?.uuid;

    if (userAccessCode && !this.pollingInterval) {
      this.props.onFetchUnreadMessages();
      this.props.onFetchCurrentUser();
      this.pollingInterval = setInterval(() => {
        this.props.onFetchUnreadMessages();
        this.props.onFetchCurrentUser();
      }, 10000);
    }
  }

  componentWillUnmount() {
    clearInterval(this.pollingInterval);
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
      currentUserHasOrders,
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
    } = this.props;

    const { mobilemenu } = parse(location.search, {
      latlng: ['origin'],
      latlngBounds: ['bounds'],
    });

    const ensuredCurrentUser = ensureCurrentUser(currentUser);
    const unreadNotificationCount = ensuredCurrentUser.attributes.profile.privateData.notifications?.filter(
      notification => !notification.isRead
    )?.length;

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
          currentUserHasListings={currentUserHasListings}
          currentUserListing={currentUserListing}
          currentUserHasOrders={currentUserHasOrders}
          location={location}
          onManageDisableScrolling={onManageDisableScrolling}
          onResendVerificationEmail={onResendVerificationEmail}
          sendVerificationEmailInProgress={sendVerificationEmailInProgress}
          sendVerificationEmailError={sendVerificationEmailError}
          modalValue={modalValue}
          onChangeModalValue={onChangeModalValue}
        />

        <GenericError
          show={showGenericError}
          errorText={<FormattedMessage id="Topbar.genericError" />}
        />
      </div>
    );
  }
}

TopbarComponent.defaultProps = {
  className: null,
  rootClassName: null,
  desktopClassName: null,
  mobileRootClassName: null,
  mobileClassName: null,
  notificationCount: 0,
  currentUser: null,
  currentUserHasOrders: null,
  currentPage: null,
  sendVerificationEmailError: null,
  authScopes: [],
};

TopbarComponent.propTypes = {
  className: string,
  rootClassName: string,
  desktopClassName: string,
  mobileRootClassName: string,
  mobileClassName: string,
  isAuthenticated: bool.isRequired,
  authScopes: array,
  authInProgress: bool.isRequired,
  currentUser: propTypes.currentUser,
  currentUserHasListings: bool.isRequired,
  currentUserHasOrders: bool,
  currentPage: string,
  notificationCount: number,
  onLogout: func.isRequired,
  onManageDisableScrolling: func.isRequired,
  onResendVerificationEmail: func.isRequired,
  sendVerificationEmailInProgress: bool.isRequired,
  sendVerificationEmailError: propTypes.error,
  showGenericError: bool.isRequired,

  // These are passed from Page to keep Topbar rendering aware of location changes
  history: shape({
    push: func.isRequired,
  }).isRequired,
  location: shape({
    search: string.isRequired,
  }).isRequired,

  // from withViewport
  viewport: shape({
    width: number.isRequired,
    height: number.isRequired,
  }).isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const Topbar = compose(withViewport, injectIntl)(TopbarComponent);

Topbar.displayName = 'Topbar';

export default Topbar;
