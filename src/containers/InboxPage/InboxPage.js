import React, { useEffect, useState } from 'react';

import { bool, shape, func } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import StripePaymentModal from '../StripePaymentModal/StripePaymentModal';
import { IconSpinner, SendbirdApp, SendbirdAppMobile } from '../../components';
import '@sendbird/uikit-react/dist/index.css';
import SBProvider from '@sendbird/uikit-react/SendbirdProvider';
import { FormattedMessage } from 'react-intl';

import { isScrollingDisabled } from '../../ducks/UI.duck';
import { propTypes } from '../../util/types';
import { ensureCurrentUser } from '../../util/data';
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { manageDisableScrolling } from '../../ducks/UI.duck';
import {
  fetchOtherUserListing,
  transitionToRequestPayment,
  fetchUserFromChannelUrl,
  sendRequestForPayment,
  fetchOtherUsers,
} from './InboxPage.duck';
import { Page, LayoutWrapperMain, LayoutWrapperTopbar, FullPageError } from '../../components';
import { TopbarContainer } from '..';
import { generateAccessToken } from '../../ducks/sendbird.duck';

import css from './InboxPage.module.css';

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

export const InboxPageComponent = props => {
  const {
    currentUser,
    currentUserListing,
    fetchOtherUserListingError,
    fetchOtherUserListingInProgress,
    fetchUserFromChannelUrlError,
    fetchUserFromChannelUrlInProgress,
    generateAccessTokenError,
    generateAccessTokenInProgress,
    generateAccessTokenSuccess,
    history,
    onFetchOtherUserListing,
    onFetchUserFromChannelUrl,
    onGenerateAccessToken,
    onManageDisableScrolling,
    onSendRequestForPayment,
    onTransitionToRequestPayment,
    otherUser,
    otherUserListing,
    scrollingDisabled,
    sendRequestForPaymentError,
    sendRequestForPaymentInProgress,
    sendRequestForPaymentSuccess,
    transitionToRequestPaymentError,
    transitionToRequestPaymentInProgress,
    transitionToRequestPaymentSuccess,
    params,
    onFetchOtherUsers,
    otherUsers,
    fetchOtherUsersError,
    fetchOtherUsersInProgress,
  } = props;

  const ensuredCurrentUser = ensureCurrentUser(currentUser);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [modalInitialValues, setModalInitialValues] = useState(null);

  const onClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
  };

  const onOpenPaymentModal = initialValues => {
    setModalInitialValues(initialValues);
    setIsPaymentModalOpen(true);
  };

  const appId = process.env.REACT_APP_SENDBIRD_APP_ID;
  const userId = ensuredCurrentUser.id && currentUser.id.uuid;
  const nickname = ensuredCurrentUser.attributes.profile.displayName;
  const profileUrl = ensuredCurrentUser.profileImage?.attributes?.variants['square-small']?.url;
  const accessToken = ensuredCurrentUser.attributes.profile?.privateData?.sbAccessToken;

  useEffect(() => {
    if (!!ensuredCurrentUser.id && !accessToken && !generateAccessTokenInProgress) {
      onGenerateAccessToken(ensuredCurrentUser);
    }
  }, [ensuredCurrentUser, accessToken, generateAccessTokenInProgress]);

  const sendbirdColorSet = {
    '--sendbird-light-primary-500': '#5684a3',
    '--sendbird-light-primary-400': '#5684a3',
    '--sendbird-light-primary-300': '#6ba0b6',
    '--sendbird-light-primary-200': '#6ba0b6',
    '--sendbird-light-primary-100': '#6ba0b6',
  };

  const generateTokenErrorHeader = <FormattedMessage id="InboxPage.generateTokenErrorHeader" />;
  const generateTokenErrorDescription = (
    <FormattedMessage id="InboxPage.generateTokenErrorDescription" />
  );

  return (
    <Page title="Inbox" scrollingDisabled={scrollingDisabled}>
      <LayoutWrapperTopbar>
        <TopbarContainer
          className={css.topbar}
          currentPage="InboxPage"
          desktopClassName={css.desktopTopbar}
          mobileRootClassName={css.mobileTopbar}
        />
      </LayoutWrapperTopbar>
      <LayoutWrapperMain className={css.wrapper}>
        {!generateAccessTokenError ? (
          userId && !generateAccessTokenInProgress ? (
            <SBProvider
              accessToken={accessToken}
              appId={appId}
              colorSet={sendbirdColorSet}
              nickname={nickname}
              profileUrl={profileUrl}
              userId={userId}
            >
              {isMobile ? (
                <SendbirdAppMobile
                  currentUser={ensuredCurrentUser}
                  fetchOtherUserListingError={fetchOtherUserListingError}
                  fetchOtherUserListingInProgress={fetchOtherUserListingInProgress}
                  fetchUserFromChannelUrlError={fetchUserFromChannelUrlError}
                  fetchUserFromChannelUrlInProgress={fetchUserFromChannelUrlInProgress}
                  history={history}
                  isPaymentModalOpen={isPaymentModalOpen}
                  onFetchOtherUserListing={onFetchOtherUserListing}
                  onFetchUserFromChannelUrl={onFetchUserFromChannelUrl}
                  onOpenPaymentModal={onOpenPaymentModal}
                  onRequestPayment={onTransitionToRequestPayment}
                  onSendRequestForPayment={onSendRequestForPayment}
                  otherUser={otherUser}
                  otherUserListing={otherUserListing}
                  ownListing={currentUserListing}
                  sendRequestForPaymentError={sendRequestForPaymentError}
                  sendRequestForPaymentInProgress={sendRequestForPaymentInProgress}
                  sendRequestForPaymentSuccess={sendRequestForPaymentSuccess}
                  transitionToRequestPaymentError={transitionToRequestPaymentError}
                  transitionToRequestPaymentInProgress={transitionToRequestPaymentInProgress}
                  transitionToRequestPaymentSuccess={transitionToRequestPaymentSuccess}
                  pathParams={params}
                  onFetchOtherUsers={onFetchOtherUsers}
                  otherUsers={otherUsers}
                  fetchOtherUsersError={fetchOtherUsersError}
                  fetchOtherUsersInProgress={fetchOtherUsersInProgress}
                />
              ) : (
                <SendbirdApp
                  currentUser={ensuredCurrentUser}
                  fetchOtherUserListingError={fetchOtherUserListingError}
                  fetchOtherUserListingInProgress={fetchOtherUserListingInProgress}
                  fetchUserFromChannelUrlError={fetchUserFromChannelUrlError}
                  fetchUserFromChannelUrlInProgress={fetchUserFromChannelUrlInProgress}
                  history={history}
                  isPaymentModalOpen={isPaymentModalOpen}
                  onFetchOtherUserListing={onFetchOtherUserListing}
                  onFetchUserFromChannelUrl={onFetchUserFromChannelUrl}
                  onOpenPaymentModal={onOpenPaymentModal}
                  onRequestPayment={onTransitionToRequestPayment}
                  onSendRequestForPayment={onSendRequestForPayment}
                  otherUser={otherUser}
                  otherUserListing={otherUserListing}
                  ownListing={currentUserListing}
                  sendRequestForPaymentError={sendRequestForPaymentError}
                  sendRequestForPaymentInProgress={sendRequestForPaymentInProgress}
                  sendRequestForPaymentSuccess={sendRequestForPaymentSuccess}
                  transitionToRequestPaymentError={transitionToRequestPaymentError}
                  transitionToRequestPaymentInProgress={transitionToRequestPaymentInProgress}
                  transitionToRequestPaymentSuccess={transitionToRequestPaymentSuccess}
                  pathParams={params}
                  onFetchOtherUsers={onFetchOtherUsers}
                  otherUsers={otherUsers}
                  fetchOtherUsersError={fetchOtherUsersError}
                  fetchOtherUsersInProgress={fetchOtherUsersInProgress}
                />
              )}
            </SBProvider>
          ) : (
            <IconSpinner className={css.spinner} />
          )
        ) : (
          <FullPageError
            errorDescription={generateTokenErrorDescription}
            errorHeading={generateTokenErrorHeader}
          />
        )}
        {isPaymentModalOpen && (
          <StripePaymentModal
            channelContext={modalInitialValues.channelContext}
            channelUrl={modalInitialValues.channelUrl}
            isOpen={isPaymentModalOpen}
            onClose={onClosePaymentModal}
            provider={modalInitialValues.provider}
            providerListing={otherUserListing}
            sendbirdContext={modalInitialValues.sendbirdContext}
          />
        )}
      </LayoutWrapperMain>
    </Page>
  );
};

InboxPageComponent.defaultProps = {
  fetchOtherUserListingError: null,
  fetchOtherUserListingInProgress: false,
  fetchUserFromChannelUrlError: null,
  fetchUserFromChannelUrlInProgress: false,
  generateAccessTokenError: null,
  generateAccessTokenInProgress: false,
  generateAccessTokenSuccess: false,
  otherUserListing: null,
  otherUserRef: null,
  sendRequestForPaymentError: null,
  sendRequestForPaymentInProgress: false,
  sendRequestForPaymentSuccess: false,
  transitionToRequestPaymentError: null,
  transitionToRequestPaymentInProgress: false,
  transitionToRequestPaymentSuccess: false,
};

InboxPageComponent.propTypes = {
  currentUser: propTypes.currentUser.isRequired,
  currentUserListing: propTypes.ownListing.isRequired,
  fetchOtherUserListingError: propTypes.error,
  fetchOtherUserListingInProgress: bool,
  fetchUserFromChannelUrlError: propTypes.error,
  fetchUserFromChannelUrlInProgress: bool,
  generateAccessTokenError: propTypes.error,
  generateAccessTokenInProgress: bool,
  generateAccessTokenSuccess: bool,
  onFetchOtherUserListing: func.isRequired,
  onFetchUserFromChannelUrl: func.isRequired,
  onGenerateAccessToken: func.isRequired,
  onManageDisableScrolling: func.isRequired,
  onSendRequestForPayment: func.isRequired,
  onTransitionToRequestPayment: func.isRequired,
  otherUser: propTypes.user,
  otherUserListing: propTypes.listing,
  scrollingDisabled: bool.isRequired,
  sendRequestForPaymentError: propTypes.error,
  sendRequestForPaymentInProgress: bool,
  sendRequestForPaymentSuccess: bool,
  transitionToRequestPaymentError: propTypes.error,
  transitionToRequestPaymentInProgress: bool,
  transitionToRequestPaymentSuccess: bool,

  /* from withRouter */
  history: shape({
    push: func.isRequired,
  }).isRequired,
};

const mapStateToProps = state => {
  const {
    fetchOtherUserListingError,
    fetchOtherUserListingInProgress,
    fetchUserFromChannelUrlError,
    fetchUserFromChannelUrlInProgress,
    otherUserListing,
    otherUserRef,
    sendRequestForPaymentError,
    sendRequestForPaymentInProgress,
    sendRequestForPaymentSuccess,
    transitionToRequestPaymentError,
    transitionToRequestPaymentInProgress,
    transitionToRequestPaymentSuccess,
    fetchOtherUsersInProgress,
    fetchOtherUsersError,
    otherUsersRefs,
  } = state.InboxPage;

  const otherUser = otherUserRef && getMarketplaceEntities(state, [otherUserRef])[0];

  const otherUsers = otherUsersRefs && getMarketplaceEntities(state, otherUsersRefs);

  const {
    generateAccessTokenError,
    generateAccessTokenInProgress,
    generateAccessTokenSuccess,
  } = state.sendbird;

  const { currentUser, currentUserListing } = state.user;

  return {
    currentUser,
    currentUserListing,
    fetchOtherUserListingError,
    fetchOtherUserListingInProgress,
    fetchUserFromChannelUrlError,
    fetchUserFromChannelUrlInProgress,
    generateAccessTokenError,
    generateAccessTokenInProgress,
    generateAccessTokenSuccess,
    otherUser,
    otherUserListing,
    scrollingDisabled: isScrollingDisabled(state),
    sendRequestForPaymentError,
    sendRequestForPaymentInProgress,
    sendRequestForPaymentSuccess,
    transitionToRequestPaymentError,
    transitionToRequestPaymentInProgress,
    transitionToRequestPaymentSuccess,
    fetchOtherUsersInProgress,
    fetchOtherUsersError,
    otherUsers,
  };
};

const mapDispatchToProps = dispatch => ({
  onFetchOtherUserListing: (channelUrl, currentUserId, accessToken) =>
    dispatch(fetchOtherUserListing(channelUrl, currentUserId, accessToken)),
  onFetchUserFromChannelUrl: (channelUrl, currentUserId, accessToken) =>
    dispatch(fetchUserFromChannelUrl(channelUrl, currentUserId, accessToken)),
  onGenerateAccessToken: currentUser => dispatch(generateAccessToken(currentUser)),
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
  onSendRequestForPayment: (
    currentUserId,
    customerName,
    channelUrl,
    sendbirdContext,
    otherUserListing
  ) =>
    dispatch(
      sendRequestForPayment(
        currentUserId,
        customerName,
        channelUrl,
        sendbirdContext,
        otherUserListing
      )
    ),
  onTransitionToRequestPayment: tx => dispatch(transitionToRequestPayment(tx)),
  onFetchOtherUsers: (userId, accessToken) => dispatch(fetchOtherUsers(userId, accessToken)),
});

const InboxPage = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(InboxPageComponent);

export default InboxPage;
