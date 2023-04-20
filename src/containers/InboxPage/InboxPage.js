import React, { useEffect, useReducer } from 'react';
import { arrayOf, bool, number, shape, string, func } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { isEqual } from 'lodash';
import { withRouter } from 'react-router-dom';
import { propTypes } from '../../util/types';
import { ensureCurrentUser } from '../../util/data';
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/UI.duck';
import classNames from 'classnames';
import {
  fetchMoreMessages,
  sendMessage,
  fetchOtherUserListing,
  sendRequestForPayment,
  deleteConversation,
  fetchConversations,
} from './InboxPage.duck';
import {
  Page,
  LayoutSideNavigation,
  LayoutWrapperMain,
  LayoutWrapperSideNav,
  LayoutWrapperTopbar,
  IconSpinner,
  IconEnquiry,
  MessagePanel,
  InboxChannelHeader,
  Modal,
  Button,
  SecondaryButton,
  GenericError,
} from '../../components';
import { TopbarContainer, StripePaymentModal } from '..';
import config from '../../config';
import SideNav from './SideNav';
import { useCheckMobileScreen, usePrevious } from '../../util/userAgent';
import { updateTransactionMetadata } from '../../util/api';

import css from './InboxPage.module.css';

const SET_DELETE_MODAL_OPEN = 'SET_DELETE_MODAL_OPEN';
const SET_CHAT_MODAL_OPEN = 'SET_CHAT_MODAL_OPEN';
const SET_ACTIVE_CONVERSATION = 'SET_ACTIVE_CONVERSATION';
const SET_CONVERSATIONS = 'SET_CONVERSATIONS';
const SET_CURRENT_USER_INITIAL_FETCHED = 'SET_CURRENT_USER_INITIAL_FETCHED';
const SET_STRIPE_MODAL_OPEN = 'SET_STRIPE_MODAL_OPEN';
const SET_INITIAL_CONVERSATION = 'SET_INITIAL_CONVERSATION';

const reducer = (state, action) => {
  switch (action.type) {
    case SET_DELETE_MODAL_OPEN:
      return { ...state, isDeleteModalOpen: action.payload };
    case SET_CHAT_MODAL_OPEN:
      return { ...state, isChatModalOpen: action.payload };
    case SET_ACTIVE_CONVERSATION:
      return {
        ...state,
        activeConversation: state.conversations.find(n => n.id.uuid === action.payload),
      };
    case SET_CONVERSATIONS:
      const hasActiveConversation = action.payload.find(
        n => n.id.uuid === state.activeConversation?.id?.uuid
      );
      return {
        ...state,
        conversations: action.payload,
        activeConversation: hasActiveConversation
          ? hasActiveConversation
          : action.payload.length > 0
          ? action.payload[0]
          : null,
      };
    case SET_CURRENT_USER_INITIAL_FETCHED:
      return { ...state, currentUserInitialFetched: true };
    case SET_STRIPE_MODAL_OPEN:
      return { ...state, isStripeModalOpen: action.payload };
    case SET_INITIAL_CONVERSATION:
      return {
        ...state,
        activeConversation: state.conversations.find(n => n.id.uuid === action.payload),
        initialConversationSet: true,
      };
    default:
      return state;
  }
};

export const InboxPageComponent = props => {
  const {
    currentUser,
    intl,
    params,
    scrollingDisabled,
    history,
    fetchMessagesInProgress,
    totalMessagePages,
    messages,
    oldestMessagePageFetched,
    initialMessageFailedToTransaction,
    fetchMessagesError,
    sendMessageInProgress,
    sendMessageError,
    onShowMoreMessages,
    onSendMessage,
    onFetchOtherUserListing,
    otherUserListing,
    onManageDisableScrolling,
    conversations,
    fetchOtherUserListingError,
    fetchConversationsError,
    fetchOtherUserListingInProgress,
    sendRequestForPaymentError,
    sendRequestForPaymentInProgress,
    sendRequestForPaymentSuccess,
    onSendRequestForPayment,
    onDeleteConversation,
    deleteConversationInProgress,
    deleteConversationError,
    fetchInitialConversationsInProgress,
    fetchInitialConversationsError,
    onFetchConversations,
  } = props;
  const { tab } = params;
  const ensuredCurrentUser = ensureCurrentUser(currentUser);

  const isMobile = useCheckMobileScreen();

  const initialState = {
    conversations,
    isDeleteModalOpen: false,
    activeConversation: conversations.length > 0 ? conversations[0] : null,
    isChatModalOpen: false,
    isStripeModalOpen: false,
    initialConversationSet: false,
  };
  const [state, dispatch] = useReducer(reducer, initialState);

  const customer = state.activeConversation?.customer;
  const provider = state.activeConversation?.provider;
  const otherUser = ensuredCurrentUser.id?.uuid === provider?.id?.uuid ? customer : provider;

  useEffect(() => {
    const conversationsPoll = setInterval(() => {
      onFetchConversations();
    }, 5000);

    return () => {
      clearInterval(conversationsPoll);
    };
  }, []);

  const conversationId = params.id;

  useEffect(() => {
    if (
      conversationId &&
      state.conversations?.find(n => n?.id?.uuid === conversationId) &&
      !state.initialConversationSet
    ) {
      dispatch({ type: SET_INITIAL_CONVERSATION, payload: conversationId });

      if (isMobile) {
        dispatch({ type: SET_CHAT_MODAL_OPEN, payload: true });
      }
    }
  }, [conversationId, state.conversations?.length]);

  const previousActiveConversation = usePrevious(state.activeConversation);

  useEffect(() => {
    if (
      state.activeConversation &&
      !isEqual(state.activeConversation, previousActiveConversation)
    ) {
      onFetchOtherUserListing(otherUser?.id?.uuid);

      const id = state.activeConversation.id.uuid;
      const unreadMessageCount = state.activeConversation.attributes.metadata.unreadMessageCount;
      const hasUnreadMessages =
        unreadMessageCount && unreadMessageCount[ensuredCurrentUser.id?.uuid] > 0;

      if (hasUnreadMessages) {
        const metadata = {
          unreadMessageCount: {
            ...unreadMessageCount,
            [ensuredCurrentUser.id?.uuid]: 0,
          },
        };

        updateTransactionMetadata({ txId: id, metadata }).then(() => {
          onFetchConversations();
        });
      }
    }
  }, [previousActiveConversation, state.activeConversation]);

  useEffect(() => {
    if (!isEqual(state.conversations, conversations)) {
      dispatch({ type: SET_CONVERSATIONS, payload: conversations });
    }
  }, [conversations]);

  useEffect(() => {
    if (!deleteConversationInProgress && !deleteConversationError) {
      dispatch({ type: SET_DELETE_MODAL_OPEN, payload: false });
    }
  }, [deleteConversationInProgress]);

  const handleOpenDeleteConversationModal = id => {
    dispatch({ type: SET_DELETE_MODAL_OPEN, payload: id });
  };

  const handleDeleteConversation = () => {
    const txToDelete = state.conversations?.find(n => n.id.uuid === state.isDeleteModalOpen);

    onDeleteConversation(txToDelete, ensuredCurrentUser).then(() => {
      onFetchConversations();
    });
  };

  const handlePreviewClick = id => {
    dispatch({ type: SET_ACTIVE_CONVERSATION, payload: id });

    if (isMobile) {
      dispatch({ type: SET_CHAT_MODAL_OPEN, payload: true });
    }
  };

  const handleChangeStripeModal = () => {
    dispatch({ type: SET_STRIPE_MODAL_OPEN, payload: !state.isStripeModalOpen });
  };

  const error =
    fetchInitialConversationsError || fetchConversationsError ? (
      <div style={{ margin: 'auto' }}>
        <p className={css.error}>
          <FormattedMessage id="InboxPage.fetchFailed" />
        </p>
      </div>
    ) : null;

  const fetchListingError = fetchOtherUserListingError && (
    <FormattedMessage id="InboxPage.fetchListingFailed" />
  );

  const requestPaymentError = sendRequestForPaymentError && (
    <FormattedMessage id="InboxPage.requestPaymentFailed" />
  );

  const initialMessageFailed = !!(
    initialMessageFailedToTransaction &&
    state.activeConversation?.id &&
    initialMessageFailedToTransaction.uuid === state.activeConversation?.id?.uuid
  );

  const currentMessages = messages.get(state.activeConversation?.id?.uuid) || [];

  return (
    <Page title="Inbox" scrollingDisabled={scrollingDisabled}>
      <LayoutSideNavigation>
        <LayoutWrapperTopbar>
          <TopbarContainer
            className={css.topbar}
            mobileRootClassName={css.mobileTopbar}
            desktopClassName={css.desktopTopbar}
            currentPage="InboxPage"
          />
        </LayoutWrapperTopbar>
        <LayoutWrapperSideNav className={css.navigation}>
          {error}
          <SideNav
            conversations={state.conversations}
            currentConversation={state.activeConversation}
            messages={messages}
            fetchConversationsInProgress={fetchInitialConversationsInProgress}
            currentUser={ensuredCurrentUser}
            intl={intl}
            params={params}
            onOpenDeleteConversationModal={handleOpenDeleteConversationModal}
            onPreviewClick={handlePreviewClick}
            isMobile={isMobile}
          />
        </LayoutWrapperSideNav>
        <LayoutWrapperMain className={css.wrapper}>
          {state.activeConversation ? (
            <>
              <InboxChannelHeader
                isMobile={isMobile}
                listing={otherUserListing}
                otherUser={otherUser}
                currentUser={ensuredCurrentUser}
                fetchOtherUserListingInProgress={fetchOtherUserListingInProgress}
                onOpenPaymentModal={handleChangeStripeModal}
                sendRequestForPaymentError={sendRequestForPaymentError}
                sendRequestForPaymentInProgress={sendRequestForPaymentInProgress}
                sendRequestForPaymentSuccess={sendRequestForPaymentSuccess}
                onSendRequestForPayment={onSendRequestForPayment}
                conversationId={state.activeConversation?.id?.uuid}
              />

              <MessagePanel
                transaction={state.activeConversation}
                currentUser={ensuredCurrentUser}
                fetchMessagesError={fetchMessagesError}
                fetchMessagesInProgress={fetchMessagesInProgress}
                initialMessageFailed={initialMessageFailed}
                messages={currentMessages}
                oldestMessagePageFetched={oldestMessagePageFetched}
                onShowMoreMessages={onShowMoreMessages}
                totalMessagePages={totalMessagePages}
                sendMessageInProgress={sendMessageInProgress}
                sendMessageError={sendMessageError}
                onSendMessage={onSendMessage}
              />
            </>
          ) : fetchInitialConversationsInProgress ? (
            <div className={css.spinnerContainer}>
              <IconSpinner className={css.mainSpinner} />
            </div>
          ) : state.conversations?.length === 0 ? (
            <div className={css.noConversationsContainer}>
              <div className={css.noConversations}>
                <IconEnquiry
                  className={css.inquiry}
                  strokeClass={css.inquiryStroke}
                  height={isMobile ? '7em' : '7em'}
                  width={isMobile ? '7em' : '7em'}
                />
                <h2 className={css.noConversationsText}>No Conversations</h2>
              </div>
            </div>
          ) : null}
          {state.isStripeModalOpen && (
            <StripePaymentModal
              conversationId={state.activeConversation?.id?.uuid}
              isOpen={state.isStripeModalOpen}
              onClose={handleChangeStripeModal}
              provider={otherUser}
              providerListing={otherUserListing}
            />
          )}
          {state.isDeleteModalOpen && (
            <Modal
              id="InboxPageDeleteModal"
              isOpen={state.isDeleteModalOpen}
              onClose={() => dispatch({ type: SET_DELETE_MODAL_OPEN, payload: false })}
              onManageDisableScrolling={onManageDisableScrolling}
              containerClassName={css.modalContainer}
              usePortal
            >
              <div className={css.modalContent}>
                <h1 className={css.modalTitle}>
                  <FormattedMessage id="InboxPage.deleteModalTitle" />
                </h1>
                <p className={css.modalMessage}>
                  <FormattedMessage id="InboxPage.deleteModalText" />
                </p>
                {deleteConversationError && (
                  <p className={classNames(css.modalMessage, css.error)}>
                    <FormattedMessage id="InboxPage.deleteConversationError" />
                  </p>
                )}
                <div className={css.modalButtons}>
                  <SecondaryButton
                    className={css.modalButtonCancel}
                    onClick={() => dispatch({ type: SET_DELETE_MODAL_OPEN, payload: false })}
                  >
                    <FormattedMessage id="InboxPage.deleteModalCancel" />
                  </SecondaryButton>
                  <Button
                    className={css.modalButtonDelete}
                    onClick={handleDeleteConversation}
                    inProgress={deleteConversationInProgress}
                    disabled={deleteConversationInProgress}
                  >
                    <FormattedMessage id="InboxPage.deleteModalConfirm" />
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </LayoutWrapperMain>
      </LayoutSideNavigation>
      <GenericError
        show={fetchListingError || requestPaymentError}
        errorText={fetchListingError || requestPaymentError}
      />
    </Page>
  );
};

InboxPageComponent.defaultProps = {
  unitType: config.bookingUnitType,
  currentUser: null,
  currentUserListing: null,
  currentUserHasOrders: null,
  fetchConversationsError: null,
  pagination: null,
  providerNotificationCount: 0,
  sendVerificationEmailError: null,
};

InboxPageComponent.propTypes = {
  params: shape({
    tab: string.isRequired,
    id: string,
  }).isRequired,
  unitType: propTypes.bookingUnitType,
  currentUser: propTypes.currentUser,
  currentUserListing: propTypes.ownListing,
  fetchConversationsInProgress: bool.isRequired,
  fetchConversationsError: propTypes.error,
  pagination: propTypes.pagination,
  providerNotificationCount: number,
  scrollingDisabled: bool.isRequired,
  conversations: arrayOf(propTypes.transaction).isRequired,

  /* from withRouter */
  history: shape({
    push: func.isRequired,
  }).isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const sortTransactions = (a, b) => {
  const aLastMessage =
    a.messages.length > 0 && a.messages[a.messages.length - 1].attributes.createdAt;
  const bLastMessage =
    b.messages.length > 0 && b.messages[b.messages.length - 1].attributes.createdAt;

  if (aLastMessage && bLastMessage) {
    return new Date(bLastMessage) - new Date(aLastMessage);
  }
  return 0;
};

const mapStateToProps = state => {
  const { currentUser, currentUserListing } = state.user;

  const { transactionRefs } = state.InboxPage;

  const conversations = getMarketplaceEntities(state, transactionRefs).sort(sortTransactions);

  return {
    currentUser,
    currentUserListing,
    scrollingDisabled: isScrollingDisabled(state),
    conversations,
    ...state.InboxPage,
  };
};

const mapDispatchToProps = {
  onManageDisableScrolling: manageDisableScrolling,
  onShowMoreMessages: fetchMoreMessages,
  onSendMessage: sendMessage,
  onFetchOtherUserListing: fetchOtherUserListing,
  onSendRequestForPayment: sendRequestForPayment,
  onDeleteConversation: deleteConversation,
  onFetchConversations: fetchConversations,
};

const InboxPage = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(InboxPageComponent);

export default InboxPage;
