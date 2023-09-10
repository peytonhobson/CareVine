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
    notificationCount,
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
      notificationCount={notificationCount}
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

const calculateUnreadMessages = (conversations, state) => {
  const currentUser = state.user.currentUser;

  const unreadMessages = conversations?.reduce((acc, conversation) => {
    const unreadMessageCount = conversation.attributes.metadata.unreadMessageCount;

    const myUnreadMessages = unreadMessageCount && unreadMessageCount[currentUser?.id?.uuid];

    return acc + (myUnreadMessages ? myUnreadMessages : 0);
  }, 0);

  console.log(conversations?.[4]?.attributes.metadata);

  return unreadMessages;
};

const mapStateToProps = state => {
  // Topbar needs isAuthenticated
  const { isAuthenticated, logoutError, authScopes } = state.Auth;

  const { modalValue, messageTransactionRefs } = state.TopbarContainer;

  const unreadMessages = calculateUnreadMessages(
    getMarketplaceEntities(state, messageTransactionRefs),
    state
  );

  console.log('unreadMessages', unreadMessages);

  // Topbar needs user info.
  const {
    currentUser,
    currentUserHasListings,
    currentUserListing,
    currentUserListingFetched,
    currentUserHasOrders,
    currentUserNotificationCount: notificationCount,
    sendVerificationEmailInProgress,
    sendVerificationEmailError,
  } = state.user;
  const hasGenericError = !!(logoutError || hasCurrentUserErrors(state));

  console.log(notificationCount);
  return {
    authInProgress: authenticationInProgress(state),
    currentUser,
    currentUserHasListings,
    currentUserListing,
    currentUserListingFetched,
    currentUserHasOrders,
    notificationCount,
    isAuthenticated,
    authScopes,
    sendVerificationEmailInProgress,
    sendVerificationEmailError,
    hasGenericError,
    modalValue,
    unreadMessages,
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
