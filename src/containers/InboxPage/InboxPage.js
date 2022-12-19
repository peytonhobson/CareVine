import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { arrayOf, bool, number, shape, string, func, array } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { withRouter } from 'react-router-dom';
import queryString from 'query-string';
import { propTypes } from '../../util/types';
import { ensureCurrentUser, cutTextToPreview } from '../../util/data';
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/UI.duck';
import { changeModalValue } from '../TopbarContainer/TopbarContainer.duck';
import { setCurrentTransaction } from '../../ducks/transactions.duck';
import {
  fetchOtherUserListing,
  transitionToRequestPayment,
  fetchUserFromChannelUrl,
  sendRequestForPayment,
  generateAccessToken,
} from './InboxPage.duck';
import { fetchTransaction } from '../../ducks/transactions.duck';
import {
  Page,
  LayoutSideNavigation,
  LayoutWrapperMain,
  LayoutWrapperTopbar,
  LayoutWrapperFooter,
  Footer,
} from '../../components';
import { TopbarContainer, NotFoundPage } from '..';
import config from '../../config';
import StripePaymentModal from '../StripePaymentModal/StripePaymentModal';

import { SendbirdApp } from '../../components';
import '@sendbird/uikit-react/dist/index.css';
import SBProvider from '@sendbird/uikit-react/SendbirdProvider';

import css from './InboxPage.module.css';
import { set } from 'lodash';

export const InboxPageComponent = props => {
  const {
    currentUser,
    currentUserListing,
    intl,
    otherUser,
    params,
    notificationCount,
    scrollingDisabled,
    onChangeMissingInfoModal,
    history,
    onFetchOtherUserListing,
    otherUserListing,
    onManageDisableScrolling,
    onTransitionToRequestPayment,
    transitionToRequestPaymentInProgress,
    transitionToRequestPaymentError,
    transitionToRequestPaymentSuccess,
    onFetchUserFromChannelUrl,
    fetchUserFromChannelUrlInProgress,
    onSendRequestForPayment,
    sendRequestForPaymentInProgress,
    sendRequestForPaymentError,
    sendRequestForPaymentSuccess,
    onGenerateAccessToken,
    generateAccessTokenInProgress,
    generateAccessTokenError,
    generateAccessTokenSuccess,
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
  const userId = currentUser && currentUser.id && currentUser.id.uuid;
  const nickname =
    currentUser && currentUser.attributes && currentUser.attributes.profile.displayName;
  const profileUrl =
    currentUser &&
    currentUser.profileImage &&
    currentUser.profileImage.attributes.variants['square-small'].url;
  const userEmail = currentUser && currentUser.attributes && currentUser.attributes.email;
  const accessToken =
    currentUser &&
    currentUser.attributes &&
    currentUser.attributes.profile.privateData &&
    currentUser.attributes.profile.privateData.sbAccessToken;

  useEffect(() => {
    if (!!currentUser && !!currentUser.id && !accessToken) {
      onGenerateAccessToken(currentUser);
    }
  }, [currentUser, accessToken]);

  const sendbirdColorSet = {
    '--sendbird-light-primary-500': '#043c2c',
    '--sendbird-light-primary-400': '#043c2c',
    '--sendbird-light-primary-300': '#568a6e',
    '--sendbird-light-primary-200': '#568a6e',
    '--sendbird-light-primary-100': '#74ad8a',
  };

  return (
    <Page title="Inbox" scrollingDisabled={scrollingDisabled}>
      <LayoutSideNavigation className={css.sideNavigation}>
        <LayoutWrapperTopbar>
          <TopbarContainer
            className={css.topbar}
            mobileRootClassName={css.mobileTopbar}
            desktopClassName={css.desktopTopbar}
            currentPage="InboxPage"
          />
        </LayoutWrapperTopbar>
        <LayoutWrapperMain className={css.wrapper}>
          {userId && (
            <SBProvider
              appId={appId}
              userId={userId}
              accessToken={accessToken}
              nickname={nickname}
              profileUrl={profileUrl}
              colorSet={sendbirdColorSet}
            >
              <SendbirdApp
                history={history}
                onOpenPaymentModal={onOpenPaymentModal}
                otherUserListing={otherUserListing}
                otherUser={otherUser}
                userEmail={userEmail}
                ownListing={currentUserListing}
                currentUser={currentUser}
                onFetchOtherUserListing={onFetchOtherUserListing}
                onRequestPayment={onTransitionToRequestPayment}
                transitionToRequestPaymentInProgress={transitionToRequestPaymentInProgress}
                transitionToRequestPaymentError={transitionToRequestPaymentError}
                transitionToRequestPaymentSuccess={transitionToRequestPaymentSuccess}
                onFetchUserFromChannelUrl={onFetchUserFromChannelUrl}
                onSendRequestForPayment={onSendRequestForPayment}
                sendRequestForPaymentInProgress={sendRequestForPaymentInProgress}
                sendRequestForPaymentError={sendRequestForPaymentError}
                sendRequestForPaymentSuccess={sendRequestForPaymentSuccess}
                isPaymentModalOpen={isPaymentModalOpen}
                fetchUserFromChannelUrlInProgress={fetchUserFromChannelUrlInProgress}
              />
            </SBProvider>
          )}
          {isPaymentModalOpen && (
            <StripePaymentModal
              containerClassName={css.paymentModal}
              isOpen={isPaymentModalOpen}
              onClose={onClosePaymentModal}
              channelContext={modalInitialValues.channelContext}
              channelUrl={modalInitialValues.channelUrl}
              provider={modalInitialValues.provider}
              providerListing={otherUserListing}
            />
          )}
        </LayoutWrapperMain>
        <LayoutWrapperFooter>
          <Footer />
        </LayoutWrapperFooter>
      </LayoutSideNavigation>
    </Page>
  );
};

InboxPageComponent.defaultProps = {
  unitType: config.bookingUnitType,
  currentUser: null,
  currentUserListing: null,
  currentUserHasOrders: null,
  pagination: null,
  notifications: [],
  sendVerificationEmailError: null,
  updateViewedMessagesSuccess: false,
  updateViewedMessagesInProgress: false,
  updateViewedMessagesError: null,
};

InboxPageComponent.propTypes = {
  unitType: propTypes.bookingUnitType,
  currentUser: propTypes.currentUser,
  currentUserListing: propTypes.ownListing,
  pagination: propTypes.pagination,
  notifications: array,
  scrollingDisabled: bool.isRequired,

  /* from withRouter */
  history: shape({
    push: func.isRequired,
  }).isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  const {
    fetchTransactionsInProgress,
    fetchTransactionsError,
    pagination,
    fetchMessagesInProgress,
    totalMessagePages,
    messages,
    oldestMessagePageFetched,
    initialMessageFailedToTransaction,
    fetchMessagesError,
    sendMessageInProgress,
    sendMessageError,
    transactionRefs,
    otherUserListing,
    updateViewedMessagesSuccess,
    updateViewedMessagesInProgress,
    updateViewedMessagesError,
    updateViewedNotificationsSuccess,
    updateViewedNotificationsInProgress,
    updateViewedNotificationsError,
    transitionToRequestPaymentInProgress,
    transitionToRequestPaymentError,
    transitionToRequestPaymentSuccess,
    otherUserRef,
    sendRequestForPaymentInProgress,
    sendRequestForPaymentError,
    sendRequestForPaymentSuccess,
    generateAccessTokenInProgress,
    generateAccessTokenError,
    generateAccessTokenSuccess,
    fetchUserFromChannelUrlInProgress,
  } = state.InboxPage;

  const otherUser = otherUserRef && getMarketplaceEntities(state, [otherUserRef])[0];
  const {
    currentUser,
    currentUserListing,
    currentUserNotifications: notifications,
    fetchCurrentUserNotificationsInProgress,
    fetchCurrentUserNotificationsError,
  } = state.user;
  return {
    currentUser,
    currentUserListing,
    fetchTransactionsInProgress,
    fetchTransactionsError,
    pagination,
    notifications,
    scrollingDisabled: isScrollingDisabled(state),
    fetchMessagesInProgress,
    totalMessagePages,
    messages,
    oldestMessagePageFetched,
    initialMessageFailedToTransaction,
    fetchMessagesError,
    sendMessageInProgress,
    sendMessageError,
    otherUserListing,
    fetchCurrentUserNotificationsInProgress,
    fetchCurrentUserNotificationsError,
    updateViewedMessagesSuccess,
    updateViewedMessagesInProgress,
    updateViewedMessagesError,
    updateViewedNotificationsSuccess,
    updateViewedNotificationsInProgress,
    updateViewedNotificationsError,
    transitionToRequestPaymentInProgress,
    transitionToRequestPaymentError,
    transitionToRequestPaymentSuccess,
    otherUser,
    sendRequestForPaymentInProgress,
    sendRequestForPaymentError,
    sendRequestForPaymentSuccess,
    generateAccessTokenInProgress,
    generateAccessTokenError,
    generateAccessTokenSuccess,
    fetchUserFromChannelUrlInProgress,
  };
};

const mapDispatchToProps = dispatch => ({
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
  onChangeMissingInfoModal: value => dispatch(changeModalValue(value)),
  onFetchOtherUserListing: (channelUrl, currentUserId) =>
    dispatch(fetchOtherUserListing(channelUrl, currentUserId)),
  onTransitionToRequestPayment: tx => dispatch(transitionToRequestPayment(tx)),
  onFetchUserFromChannelUrl: (channelUrl, currentUserId) =>
    dispatch(fetchUserFromChannelUrl(channelUrl, currentUserId)),
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
  onGenerateAccessToken: currentUser => dispatch(generateAccessToken(currentUser)),
});

const InboxPage = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(InboxPageComponent);

export default InboxPage;
