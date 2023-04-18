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
import { setCurrentTransaction } from '../../ducks/transactions.duck';
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
  IconSpinner,
  MessagePanel,
  InboxItem,
} from '../../components';
import { TopbarContainer, NotFoundPage } from '..';
import config from '../../config';
import SideNav from './SideNav';
import { useCheckMobileScreen } from '../../util/userAgent';

import { getCurrentTransaction } from './InboxPage.helpers';
import css from './InboxPage.module.css';

const DELETE_CONVERSATION = 'DELETE_CONVERSATION';
const SET_DELETE_MODAL_OPEN = 'SET_DELETE_MODAL_OPEN';
const SET_CHAT_MODAL_OPEN = 'SET_CHAT_MODAL_OPEN';
const SET_ACTIVE_TRANSACTION = 'SET_ACTIVE_TRANSACTION';
const SET_NOTIFICATION_READ = 'SET_NOTIFICATION_READ';
const SET_TRANSACTIONS = 'SET_TRANSACTIONS';
const SET_CURRENT_USER_INITIAL_FETCHED = 'SET_CURRENT_USER_INITIAL_FETCHED';

const reducer = (state, action) => {
  switch (action.type) {
    case DELETE_CONVERSATION:
      return {
        ...state,
        transactions: state.notifications.filter(n => n.id.uuid !== action.payload),
        isDeleteModalOpen: false,
        activeTransaction:
          state.activeTransaction.id.uuid === action.payload
            ? state.transactions.length > 1
              ? state.transactions[0]
              : null
            : state.transactions,
      };
    case SET_DELETE_MODAL_OPEN:
      return { ...state, isDeleteModalOpen: action.payload };
    case SET_CHAT_MODAL_OPEN:
      return { ...state, isChatModalOpen: action.payload };
    case SET_ACTIVE_TRANSACTION:
      return {
        ...state,
        activeTransaction: state.transactions.find(n => n.id.uuid === action.payload),
      };
    case SET_TRANSACTIONS:
      return {
        ...state,
        transactions: action.payload,
        activeTransaction: state.transactions.find(n => n.id.uuid === state.activeTransaction.id)
          ? state.activeTransaction
          : action.payload.length > 0
          ? action.payload[0]
          : null,
      };
    case SET_CURRENT_USER_INITIAL_FETCHED:
      return { ...state, currentUserInitialFetched: true };
    default:
      return state;
  }
};

export const InboxPageComponent = props => {
  const {
    unitType,
    currentUser,
    currentUserListing,
    fetchInProgress,
    fetchOrdersOrSalesError,
    intl,
    pagination,
    params,
    providerNotificationCount,
    scrollingDisabled,
    transactions,
    onChangeMissingInfoModal,
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
    onSetCurrentTransaction,
  } = props;
  const { tab } = params;
  const ensuredCurrentUser = ensureCurrentUser(currentUser);

  const isMobile = useCheckMobileScreen();

  const initialState = {
    transactions,
    isDeleteModalOpen: false,
    activeTransaction: transactions.length > 0 ? transactions[0] : null,
    isChatModalOpen: false,
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (transactions.length === 0) return;
    dispatch({ type: SET_TRANSACTIONS, payload: transactions });
  }, [transactions.length]);

  const transactionId = params.transactionId;

  useEffect(() => {
    if (transactionId && state.transactions.find(n => n.id === transactionId)) {
      dispatch({ type: SET_ACTIVE_TRANSACTION, payload: transactionId });

      if (isMobile) {
        dispatch({ type: SET_CHAT_MODAL_OPEN, payload: true });
      }
    }
  }, [transactionId]);

  // TODO: Create separate hook for this and export
  const usePrevious = value => {
    const ref = useRef();
    useEffect(() => {
      ref.current = value;
    });
    return ref.current;
  };

  const previousTransactions = usePrevious(state.transactions);

  useEffect(() => {
    // TODO: Make function to refetch transactions
    if (previousTransactions && !isEqual(state.transactions, previousTransactions)) {
      // onFetchCurrentUser();
    }
  }, [state.transactions]);

  const handleOpenDeleteConversationModal = id => {
    dispatch({ type: SET_DELETE_MODAL_OPEN, payload: id });
  };

  const handleDeleteConversation = id => {
    dispatch({ type: DELETE_CONVERSATION, payload: id });
  };

  const handlePreviewClick = id => {
    dispatch({ type: SET_ACTIVE_TRANSACTION, payload: id });

    if (isMobile) {
      dispatch({ type: SET_CHAT_MODAL_OPEN, payload: true });
    }
  };

  const error = fetchOrdersOrSalesError ? (
    <p className={css.error}>
      <FormattedMessage id="InboxPage.fetchFailed" />
    </p>
  ) : null;

  // Need to make this dynamic when notifications are added
  const noResults =
    !fetchInProgress && transactions.length === 0 && !fetchOrdersOrSalesError ? (
      <li key="noResults" className={css.noResults}>
        <FormattedMessage id="InboxPage.noMessagesFound" />
      </li>
    ) : null;

  const hasTransactions = transactions.length > 0;

  const pagingLinks =
    hasTransactions && pagination && pagination.totalPages > 1 ? (
      <PaginationLinks
        className={css.pagination}
        pageName="InboxPage"
        pagePathParams={params}
        pagination={pagination}
      />
    ) : null;

  const initialMessageFailed = !!(
    initialMessageFailedToTransaction &&
    state.activeTransaction?.id &&
    initialMessageFailedToTransaction.uuid === state.activeTransaction?.id?.uuid
  );

  const currentMessages = messages.get(state.activeTransaction?.id?.uuid) || [];

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
            transactions={transactions}
            currentTransaction={state.activeTransaction}
            messages={messages}
            fetchInProgress={fetchInProgress}
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
          {state.activeTransaction?.id?.uuid && (
            <MessagePanel
              transaction={state.activeTransaction}
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
  fetchOrdersOrSalesError: null,
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
  fetchInProgress: bool.isRequired,
  fetchOrdersOrSalesError: propTypes.error,
  pagination: propTypes.pagination,
  providerNotificationCount: number,
  scrollingDisabled: bool.isRequired,
  transactions: arrayOf(propTypes.transaction).isRequired,

  /* from withRouter */
  history: shape({
    push: func.isRequired,
  }).isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  const {
    fetchInProgress,
    fetchOrdersOrSalesError,
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
  } = state.InboxPage;
  const {
    currentUser,
    currentUserListing,
    currentUserNotificationCount: providerNotificationCount,
  } = state.user;
  return {
    currentUser,
    currentUserListing,
    fetchInProgress,
    fetchOrdersOrSalesError,
    pagination,
    providerNotificationCount,
    scrollingDisabled: isScrollingDisabled(state),
    transactions: getMarketplaceEntities(state, transactionRefs),
    fetchMessagesInProgress,
    totalMessagePages,
    messages,
    oldestMessagePageFetched,
    initialMessageFailedToTransaction,
    fetchMessagesError,
    sendMessageInProgress,
    sendMessageError,
    otherUserListing,
  };
};

const mapDispatchToProps = dispatch => ({
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
  onChangeMissingInfoModal: value => dispatch(changeModalValue(value)),
  onShowMoreMessages: txId => dispatch(fetchMoreMessages(txId)),
  onSendMessage: (txId, message) => dispatch(sendMessage(txId, message)),
  onClearMessages: () => dispatch(clearMessages()),
  onFetchOtherUserListing: userId => dispatch(fetchOtherUserListing(userId)),
  onFetchTransaction: txId => dispatch(fetchTransaction(txId)),
  onSetCurrentTransaction: tx => dispatch(setCurrentTransaction(tx)),
});

const InboxPage = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(InboxPageComponent);

export default InboxPage;
