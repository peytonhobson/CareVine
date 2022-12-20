import React, { useEffect, useState } from 'react';

import { bool, shape, func } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import StripePaymentModal from '../StripePaymentModal/StripePaymentModal';
import { IconSpinner, SendbirdApp } from '../../components';
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
  generateAccessToken,
} from './InboxPage.duck';
import {
  Page,
  LayoutWrapperMain,
  LayoutWrapperTopbar,
  LayoutWrapperFooter,
  Footer,
  FullPageError,
} from '../../components';
import { TopbarContainer } from '..';

import css from './InboxPage.module.css';

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
  const profileUrl =
    ensuredCurrentUser.profileImage &&
    ensuredCurrentUser.profileImage.attributes &&
    ensuredCurrentUser.profileImage.attributes.variants &&
    ensuredCurrentUser.profileImage.attributes.variants['square-small'] &&
    ensuredCurrentUser.profileImage.attributes.variants['square-small'].url;
  const accessToken =
    ensuredCurrentUser.attributes.profile.privateData &&
    ensuredCurrentUser.attributes.profile.privateData.sbAccessToken;

  useEffect(() => {
    if (!!ensuredCurrentUser.id && !accessToken) {
      onGenerateAccessToken(ensuredCurrentUser);
    }
  }, [ensuredCurrentUser, accessToken]);

  const sendbirdColorSet = {
    '--sendbird-light-primary-500': '#043c2c',
    '--sendbird-light-primary-400': '#043c2c',
    '--sendbird-light-primary-300': '#568a6e',
    '--sendbird-light-primary-200': '#568a6e',
    '--sendbird-light-primary-100': '#74ad8a',
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
              <SendbirdApp
                currentUser={ensuredCurrentUser}
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
              />
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
            sendbirdContext={modalInitialValues.sendbirdContext}
            channelUrl={modalInitialValues.channelUrl}
            isOpen={isPaymentModalOpen}
            onClose={onClosePaymentModal}
            provider={modalInitialValues.provider}
            providerListing={otherUserListing}
          />
        )}
      </LayoutWrapperMain>
      <LayoutWrapperFooter>
        <Footer />
      </LayoutWrapperFooter>
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
    generateAccessTokenError,
    generateAccessTokenInProgress,
    generateAccessTokenSuccess,
    otherUserListing,
    otherUserRef,
    sendRequestForPaymentError,
    sendRequestForPaymentInProgress,
    sendRequestForPaymentSuccess,
    transitionToRequestPaymentError,
    transitionToRequestPaymentInProgress,
    transitionToRequestPaymentSuccess,
  } = state.InboxPage;

  const otherUser = otherUserRef && getMarketplaceEntities(state, [otherUserRef])[0];

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
  };
};

const mapDispatchToProps = dispatch => ({
  onFetchOtherUserListing: (channelUrl, currentUserId) =>
    dispatch(fetchOtherUserListing(channelUrl, currentUserId)),
  onFetchUserFromChannelUrl: (channelUrl, currentUserId) =>
    dispatch(fetchUserFromChannelUrl(channelUrl, currentUserId)),
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
});

const InboxPage = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(InboxPageComponent);

export default InboxPage;
