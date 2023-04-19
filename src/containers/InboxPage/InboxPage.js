import React, { useEffect, useMemo, useReducer, useRef } from 'react';
import { arrayOf, bool, number, shape, string, func } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { isEqual } from 'lodash';
import { withRouter } from 'react-router-dom';
import queryString from 'query-string';
import { propTypes } from '../../util/types';
import { ensureCurrentUser, cutTextToPreview } from '../../util/data';
import { formatDate } from '../../util/dates';
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/UI.duck';
import { changeModalValue } from '../TopbarContainer/TopbarContainer.duck';
import {
  fetchMoreMessages,
  sendMessage,
  clearMessages,
  fetchOtherUserListing,
} from './InboxPage.duck';
import { fetchTransaction } from '../../ducks/transactions.duck';
import {
  NotificationBadge,
  Page,
  PaginationLinks,
  LinkTabNavHorizontal,
  LayoutSideNavigation,
  LayoutWrapperMain,
  LayoutWrapperSideNav,
  LayoutWrapperTopbar,
  LayoutWrapperFooter,
  Footer,
  MessagePanel,
  InboxChannelHeader,
} from '../../components';
import { TopbarContainer, NotFoundPage, StripePaymentModal } from '..';
import config from '../../config';
import SideNav from './SideNav';
import { useCheckMobileScreen } from '../../util/userAgent';

import css from './InboxPage.module.css';

const DELETE_CONVERSATION = 'DELETE_CONVERSATION';
const SET_DELETE_MODAL_OPEN = 'SET_DELETE_MODAL_OPEN';
const SET_CHAT_MODAL_OPEN = 'SET_CHAT_MODAL_OPEN';
const SET_ACTIVE_CONVERSATION = 'SET_ACTIVE_CONVERSATION';
const SET_NOTIFICATION_READ = 'SET_NOTIFICATION_READ';
const SET_CONVERSATIONS = 'SET_CONVERSATIONS';
const SET_CURRENT_USER_INITIAL_FETCHED = 'SET_CURRENT_USER_INITIAL_FETCHED';
const SET_STRIPE_MODAL_OPEN = 'SET_STRIPE_MODAL_OPEN';

const reducer = (state, action) => {
  switch (action.type) {
    case DELETE_CONVERSATION:
      return {
        ...state,
        conversations: state.conversations.filter(n => n.id.uuid !== action.payload),
        isDeleteModalOpen: false,
        activeConversation:
          state.activeConversation.id.uuid === action.payload
            ? state.conversations.length > 1
              ? state.conversations[0]
              : null
            : state.conversations,
      };
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
      return {
        ...state,
        conversations: action.payload,
        activeConversation: state.conversations.find(n => n.id.uuid === state.activeConversation.id)
          ? state.activeConversation
          : action.payload.length > 0
          ? action.payload[0]
          : null,
      };
    case SET_CURRENT_USER_INITIAL_FETCHED:
      return { ...state, currentUserInitialFetched: true };
    case SET_STRIPE_MODAL_OPEN:
      return { ...state, isStripeModalOpen: action.payload };
    default:
      return state;
  }
};

export const InboxPageComponent = props => {
  const {
    unitType,
    currentUser,
    currentUserListing,
    intl,
    pagination,
    params,
    providerNotificationCount,
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
    transactionRole,
    onClearMessages,
    onSendMessage,
    onFetchOtherUserListing,
    otherUserListing,
    onManageDisableScrolling,
    onFetchTransaction,
    conversations,
    fetchConversationsInProgress,
    fetchConversationsError,
    fetchOtherUserListingInProgress,
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
  };
  const [state, dispatch] = useReducer(reducer, initialState);

  const customer = state.activeConversation?.customer;
  const provider = state.activeConversation?.provider;
  const otherUser = currentUser.id.uuid === provider?.id?.uuid ? customer : provider;

  useEffect(() => {
    if (conversations.length === 0) return;
    dispatch({ type: SET_CONVERSATIONS, payload: conversations });
  }, [conversations.length]);

  const conversationId = params.id;

  useEffect(() => {
    if (conversationId && state.conversations.find(n => n.id === conversationId)) {
      dispatch({ type: SET_ACTIVE_CONVERSATION, payload: conversationId });

      if (isMobile) {
        dispatch({ type: SET_CHAT_MODAL_OPEN, payload: true });
      }
    }
  }, [conversationId]);

  useEffect(() => {
    if (state.activeConversation) {
      onFetchOtherUserListing(otherUser.id.uuid);
    }
  }, [state.activeConversation?.id?.uuid]);

  // TODO: Create separate hook for this and export
  const usePrevious = value => {
    const ref = useRef();
    useEffect(() => {
      ref.current = value;
    });
    return ref.current;
  };

  const previousConversations = usePrevious(state.conversations);

  useEffect(() => {
    // TODO: Make function to refetch conversations
    if (previousConversations && !isEqual(state.conversations, previousConversations)) {
      // onFetchCurrentUser();
    }
  }, [state.conversations]);

  const handleOpenDeleteConversationModal = id => {
    dispatch({ type: SET_DELETE_MODAL_OPEN, payload: id });
  };

  const handleDeleteConversation = id => {
    dispatch({ type: DELETE_CONVERSATION, payload: id });
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

  const error = fetchConversationsError ? (
    <p className={css.error}>
      <FormattedMessage id="InboxPage.fetchFailed" />
    </p>
  ) : null;

  // Need to make this dynamic when notifications are added
  const noResults =
    !fetchConversationsInProgress && conversations.length === 0 && !fetchConversationsError ? (
      <li key="noResults" className={css.noResults}>
        <FormattedMessage id="InboxPage.noMessagesFound" />
      </li>
    ) : null;

  const hasConversations = conversations.length > 0;

  const pagingLinks =
    hasConversations && pagination && pagination.totalPages > 1 ? (
      <PaginationLinks
        className={css.pagination}
        pageName="InboxPage"
        pagePathParams={params}
        pagination={pagination}
      />
    ) : null;

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
            conversations={conversations}
            currentConversation={state.activeConversation}
            messages={messages}
            fetchConversationsInProgress={fetchConversationsInProgress}
            currentUser={ensuredCurrentUser}
            intl={intl}
            params={params}
            onOpenDeleteConversationModal={handleOpenDeleteConversationModal}
            onPreviewClick={handlePreviewClick}
            isMobile={isMobile}
          />
          {noResults}
          {pagingLinks}
        </LayoutWrapperSideNav>
        <LayoutWrapperMain className={css.wrapper}>
          <InboxChannelHeader
            isMobile={isMobile}
            listing={otherUserListing}
            otherUser={otherUser}
            currentUser={currentUser}
            fetchOtherUserListingInProgress={fetchOtherUserListingInProgress}
            onOpenPaymentModal={handleChangeStripeModal}
          />
          {state.activeConversation?.id?.uuid && (
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
              transactionRole={transactionRole}
              onSendMessage={onSendMessage}
              otherUserListing={otherUserListing}
              onManageDisableScrolling={onManageDisableScrolling}
              onFetchTransaction={onFetchTransaction}
            />
          )}
          {state.isStripeModalOpen && (
            <StripePaymentModal
              isOpen={state.isStripeModalOpen}
              onClose={handleChangeStripeModal}
              provider={otherUser}
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

const mapStateToProps = state => {
  const {
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
    fetchConversationsInProgress,
    fetchConversationsError,
    fetchOtherUserListingInProgress,
  } = state.InboxPage;
  const {
    currentUser,
    currentUserListing,
    currentUserNotificationCount: providerNotificationCount,
  } = state.user;
  return {
    currentUser,
    currentUserListing,
    pagination,
    providerNotificationCount,
    scrollingDisabled: isScrollingDisabled(state),
    conversations: getMarketplaceEntities(state, transactionRefs),
    fetchMessagesInProgress,
    totalMessagePages,
    messages,
    oldestMessagePageFetched,
    initialMessageFailedToTransaction,
    fetchMessagesError,
    sendMessageInProgress,
    sendMessageError,
    otherUserListing,
    fetchConversationsInProgress,
    fetchConversationsError,
    fetchOtherUserListingInProgress,
  };
};

const mapDispatchToProps = dispatch => ({
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
  onShowMoreMessages: txId => dispatch(fetchMoreMessages(txId)),
  onSendMessage: (txId, message) => dispatch(sendMessage(txId, message)),
  onClearMessages: () => dispatch(clearMessages()),
  onFetchOtherUserListing: userId => dispatch(fetchOtherUserListing(userId)),
  onFetchTransaction: txId => dispatch(fetchTransaction(txId)),
});

const InboxPage = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(InboxPageComponent);

export default InboxPage;
