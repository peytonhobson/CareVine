import React, { useEffect, useReducer, useMemo } from 'react';

import { compose } from 'redux';
import { connect } from 'react-redux';
import { isEqual } from 'lodash';
import classNames from 'classnames';

import { FormattedMessage, injectIntl } from '../../util/reactIntl';
import { manageDisableScrolling, isScrollingDisabled } from '../../ducks/UI.duck';
import { updateNotifications, fetchCurrentUser } from '../../ducks/user.duck';
import { deleteNotification, fetchSenderListing } from './NotificationsPage.duck';

import {
  Page,
  LayoutSideNavigation,
  LayoutWrapperTopbar,
  LayoutWrapperSideNav,
  LayoutWrapperMain,
  Button,
  SecondaryButton,
  Modal,
} from '../../components';
import { TopbarContainer } from '..';
import NotificationContainer from './NotificationContainer';
import { useCheckMobileScreen, usePrevious } from '../../util/hooks';

import css from './NotificationsPage.module.css';
import SideNav from './SideNav';

const SET_DELETE_MODAL_OPEN = 'SET_DELETE_MODAL_OPEN';
const SET_NOTIFICATION_MODAL_OPEN = 'SET_NOTIFICATION_MODAL_OPEN';
const SET_ACTIVE_NOTIFICATION_ID = 'SET_ACTIVE_NOTIFICATION_ID';
const SET_NOTIFICATION_READ = 'SET_NOTIFICATION_READ';
const SET_NOTIFICATIONS = 'SET_NOTIFICATIONS';
const SET_CURRENT_USER_INITIAL_FETCHED = 'SET_CURRENT_USER_INITIAL_FETCHED';
const SET_INITIAL_NOTIFICATION = 'SET_INITIAL_NOTIFICATION';

const reducer = (state, action) => {
  switch (action.type) {
    case SET_DELETE_MODAL_OPEN:
      return { ...state, isDeleteModalOpen: action.payload };
    case SET_NOTIFICATION_MODAL_OPEN:
      return { ...state, isNotificationModalOpen: action.payload };
    case SET_ACTIVE_NOTIFICATION_ID:
      return {
        ...state,
        activeNotificationId: action.payload,
      };
    case SET_NOTIFICATION_READ:
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, isRead: true } : n
        ),
      };
    case SET_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload,
        activeNotificationId: state.activeNotificationId
          ? state.activeNotificationId
          : action.payload.length > 0
          ? action.payload[0].id
          : null,
      };
    case SET_CURRENT_USER_INITIAL_FETCHED:
      return { ...state, currentUserInitialFetched: true };
    case SET_INITIAL_NOTIFICATION:
      return {
        ...state,
        activeNotificationId: action.payload.id,
        initialNotificationSet: true,
      };
    default:
      return state;
  }
};

const NotificationsPageComponent = props => {
  const {
    currentUser,
    scrollingDisabled,
    intl,
    onManageDisableScrolling,
    onUpdateNotifications,
    currentUserListing,
    fetchCurrentUserInProgress,
    onFetchSenderListing,
    sender,
    senderListing,
    fetchSenderListingInProgress,
    fetchSenderListingError,
    onFetchCurrentUser,
    deleteNotificationInProgress,
    deleteNotificationError,
    onDeleteNotification,
    params,
  } = props;

  const isMobile = useCheckMobileScreen();

  const { notificationId } = params;

  const notifications = currentUser?.attributes.profile.privateData.notifications || [];

  const sortedNotifications = useMemo(
    () => notifications.sort((a, b) => b.createdAt - a.createdAt),
    [notifications]
  );

  const initialState = {
    notifications: sortedNotifications,
    isDeleteModalOpen: false,
    activeNotificationId: notifications.length > 0 ? notifications[0].id : null,
    isNotificationModalOpen: false,
    initialNotificationSet: false,
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  const previousNotificationsLength = usePrevious(sortedNotifications.length);

  useEffect(() => {
    if (
      sortedNotifications.length === 0 ||
      previousNotificationsLength === sortedNotifications.length
    )
      return;
    dispatch({ type: SET_NOTIFICATIONS, payload: sortedNotifications });
  }, [previousNotificationsLength, sortedNotifications.length]);

  useEffect(() => {
    const firstNotification = state.notifications.find(n => n.id === notificationId);
    if (!state.initialNotificationSet && notificationId && firstNotification) {
      dispatch({ type: SET_INITIAL_NOTIFICATION, payload: firstNotification });

      if (isMobile) {
        dispatch({ type: SET_NOTIFICATION_MODAL_OPEN, payload: true });
      }
    }
  }, [notificationId, state.notifications?.length]);

  const activeNotification = useMemo(
    () => state.notifications.find(n => n.id === state.activeNotificationId),
    [state.activeNotificationId, JSON.stringify(state.notifications)]
  );

  useEffect(() => {
    if (activeNotification && !activeNotification.isRead) {
      const newNotifications = state.notifications.map(n =>
        n.id === state.activeNotificationId ? { ...n, isRead: true } : n
      );

      const newSortedNotifications = newNotifications.sort((a, b) => b.createdAt - a.createdAt);

      dispatch({ type: SET_NOTIFICATIONS, payload: newSortedNotifications });

      onUpdateNotifications(newNotifications);
      onFetchCurrentUser();
    }
  }, [state.activeNotificationId]);

  const previousFetchCurrentUserInProgress = usePrevious(fetchCurrentUserInProgress);

  useEffect(() => {
    if (previousFetchCurrentUserInProgress && !fetchCurrentUserInProgress) {
      dispatch({ type: SET_CURRENT_USER_INITIAL_FETCHED });
    }
  }, [fetchCurrentUserInProgress]);

  const handleOpenDeleteNotificationModal = id => {
    dispatch({ type: SET_DELETE_MODAL_OPEN, payload: id });
  };

  useEffect(() => {
    if (!deleteNotificationInProgress && !deleteNotificationError) {
      dispatch({ type: SET_DELETE_MODAL_OPEN, payload: false });
    }
  }, [deleteNotificationInProgress]);

  const handleDeleteNotification = () => {
    onDeleteNotification(state.isDeleteModalOpen, currentUser);
  };

  const handlePreviewClick = id => {
    dispatch({ type: SET_ACTIVE_NOTIFICATION_ID, payload: id });

    if (isMobile) {
      dispatch({ type: SET_NOTIFICATION_MODAL_OPEN, payload: true });
    }
  };

  const unreadCount = state.notifications.filter(n => !n.isRead).length;
  const title = intl.formatMessage(
    { id: 'NotificationsPage.title' },
    {
      unreadCount,
    }
  );

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSideNavigation className={css.layoutSideNav} containerClassName={css.layoutContainer}>
        <LayoutWrapperTopbar>
          <TopbarContainer
            className={css.topbar}
            mobileRootClassName={css.mobileTopbar}
            desktopClassName={css.desktopTopbar}
            currentPage="NotificationsPage"
          />
        </LayoutWrapperTopbar>
        <LayoutWrapperSideNav className={css.navigation}>
          <SideNav
            notifications={state.notifications}
            handleOpenDeleteNotificationModal={handleOpenDeleteNotificationModal}
            onPreviewClick={handlePreviewClick}
            activeNotificationId={state.activeNotificationId}
            fetchCurrentUserInProgress={
              fetchCurrentUserInProgress && !state.currentUserInitialFetched
            }
            isMobile={isMobile}
          />
        </LayoutWrapperSideNav>

        <LayoutWrapperMain className={css.mainWrapper}>
          {!isMobile ? (
            <NotificationContainer
              notifications={state.notifications}
              notification={activeNotification}
              listing={currentUserListing}
              currentUser={currentUser}
              fetchCurrentUserInProgress={
                fetchCurrentUserInProgress && !state.currentUserInitialFetched
              }
              onFetchSenderListing={onFetchSenderListing}
              sender={sender}
              senderListing={senderListing}
              fetchSenderListingInProgress={fetchSenderListingInProgress}
              fetchSenderListingError={fetchSenderListingError}
              onManageDisableScrolling={onManageDisableScrolling}
            />
          ) : null}
        </LayoutWrapperMain>
      </LayoutSideNavigation>
      <Modal
        id="NotificationsPageNotificationModal"
        isOpen={state.isNotificationModalOpen}
        onClose={() => dispatch({ type: SET_NOTIFICATION_MODAL_OPEN, payload: false })}
        onManageDisableScrolling={onManageDisableScrolling}
        containerClassName={css.modalContainer}
        usePortal
      >
        <NotificationContainer
          notifications={state.notifications}
          notification={activeNotification}
          listing={currentUserListing}
          currentUser={currentUser}
          fetchCurrentUserInProgress={
            fetchCurrentUserInProgress && !state.currentUserInitialFetched
          }
          onFetchSenderListing={onFetchSenderListing}
          sender={sender}
          senderListing={senderListing}
          fetchSenderListingInProgress={fetchSenderListingInProgress}
          fetchSenderListingError={fetchSenderListingError}
          onManageDisableScrolling={onManageDisableScrolling}
        />
      </Modal>
      <Modal
        id="NotificationsPageDeleteModal"
        isOpen={state.isDeleteModalOpen}
        onClose={() => dispatch({ type: SET_DELETE_MODAL_OPEN, payload: false })}
        onManageDisableScrolling={onManageDisableScrolling}
        containerClassName={css.modalContainer}
        usePortal
      >
        <div className={css.modalContent}>
          <h1 className={css.modalTitle}>
            <FormattedMessage id="NotificationsPage.deleteModalTitle" />
          </h1>
          <p className={css.modalMessage}>
            <FormattedMessage id="NotificationsPage.deleteModalText" />
          </p>
          {deleteNotificationError && (
            <p className={classNames(css.modalMessage, css.error)}>
              <FormattedMessage id="NotificationPage.deleteNotificationError" />
            </p>
          )}
          <div className={css.modalButtons}>
            <SecondaryButton
              className={css.modalButtonCancel}
              onClick={() => dispatch({ type: SET_DELETE_MODAL_OPEN, payload: false })}
            >
              <FormattedMessage id="NotificationsPage.deleteModalCancel" />
            </SecondaryButton>
            <Button
              className={css.modalButtonDelete}
              onClick={handleDeleteNotification}
              inProgress={deleteNotificationInProgress}
              disabled={deleteNotificationInProgress}
            >
              <FormattedMessage id="NotificationsPage.deleteModalConfirm" />
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  );
};

const mapStateToProps = state => {
  const { currentUser, fetchCurrentUserInProgress, currentUserListing } = state.user;

  return {
    currentUser,
    scrollingDisabled: isScrollingDisabled(state),
    currentUserListing,
    fetchCurrentUserInProgress,
    ...state.NotificationsPage,
  };
};

const mapDispatchToProps = {
  onManageDisableScrolling: manageDisableScrolling,
  onUpdateNotifications: updateNotifications,
  onFetchSenderListing: fetchSenderListing,
  onFetchCurrentUser: fetchCurrentUser,
  onDeleteNotification: deleteNotification,
};

const NotificationsPage = compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(NotificationsPageComponent);

export default NotificationsPage;
