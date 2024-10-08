import React from 'react';
import { array, bool, func, number, object, shape, string } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { propTypes } from '../../util/types';
import {
  sendVerificationEmail,
  hasCurrentUserErrors,
  fetchCurrentUser,
} from '../../ducks/user.duck';
import { logout, authenticationInProgress } from '../../ducks/Auth.duck';
import { manageDisableScrolling } from '../../ducks/UI.duck';
import { changeModalValue, fetchUnreadMessageCount } from './TopbarContainer.duck';
import { Topbar } from '../../components';
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { fetchConversations } from '../InboxPage/InboxPage.duck';

export const TopbarContainerComponent = props => {
  const {
    authInProgress,
    currentPage,
    currentSearchParams,
    currentUser,
    currentUserHasListings,
    currentUserListing,
    currentUserListingFetched,
    currentUserHasOrders,
    history,
    isAuthenticated,
    authScopes,
    hasGenericError,
    location,
    onLogout,
    onManageDisableScrolling,
    sendVerificationEmailInProgress,
    sendVerificationEmailError,
    onResendVerificationEmail,
    modalValue,
    onChangeModalValue,
    onFetchUnreadMessages,
    ...rest
  } = props;

  return (
    <Topbar
      authInProgress={authInProgress}
      currentPage={currentPage}
      currentSearchParams={currentSearchParams}
      currentUser={currentUser}
      currentUserHasListings={currentUserHasListings}
      currentUserListing={currentUserListing}
      currentUserListingFetched={currentUserListingFetched}
      currentUserHasOrders={currentUserHasOrders}
      history={history}
      isAuthenticated={isAuthenticated}
      authScopes={authScopes}
      location={location}
      onLogout={onLogout}
      onManageDisableScrolling={onManageDisableScrolling}
      onResendVerificationEmail={onResendVerificationEmail}
      sendVerificationEmailInProgress={sendVerificationEmailInProgress}
      sendVerificationEmailError={sendVerificationEmailError}
      showGenericError={hasGenericError}
      modalValue={modalValue}
      onChangeModalValue={onChangeModalValue}
      onFetchUnreadMessages={onFetchUnreadMessages}
      {...rest}
    />
  );
};

const mapStateToProps = state => {
  // Topbar needs isAuthenticated
  const { isAuthenticated, logoutError, authScopes } = state.Auth;

  const { modalValue, unreadMessageCount } = state.TopbarContainer;

  // Topbar needs user info.
  const {
    currentUser,
    currentUserHasListings,
    currentUserListing,
    currentUserListingFetched,
    currentUserHasOrders,
    sendVerificationEmailInProgress,
    sendVerificationEmailError,
  } = state.user;
  const hasGenericError = !!(logoutError || hasCurrentUserErrors(state));

  return {
    authInProgress: authenticationInProgress(state),
    currentUser,
    currentUserHasListings,
    currentUserListing,
    currentUserListingFetched,
    currentUserHasOrders,
    isAuthenticated,
    authScopes,
    sendVerificationEmailInProgress,
    sendVerificationEmailError,
    hasGenericError,
    modalValue,
    unreadMessages: unreadMessageCount,
  };
};

const mapDispatchToProps = {
  onLogout: logout,
  onManageDisableScrolling: manageDisableScrolling,
  onResendVerificationEmail: sendVerificationEmail,
  onChangeModalValue: changeModalValue,
  onFetchUnreadMessages: fetchUnreadMessageCount,
  onFetchCurrentUser: fetchCurrentUser,
  onFetchConversations: fetchConversations,
};

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const TopbarContainer = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(TopbarContainerComponent);

export default TopbarContainer;
