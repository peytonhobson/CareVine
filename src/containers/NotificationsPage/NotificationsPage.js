import React, { useEffect, useReducer, useRef, useMemo } from 'react';

import { compose } from 'redux';
import { connect } from 'react-redux';
import { first, isEqual } from 'lodash';
import classNames from 'classnames';

import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
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
import { useCheckMobileScreen, usePrevious } from '../../util/userAgent';

import css from './NotificationsPage.module.css';
import SideNav from './SideNav';

const SET_DELETE_MODAL_OPEN = 'SET_DELETE_MODAL_OPEN';
const SET_NOTIFICATION_MODAL_OPEN = 'SET_NOTIFICATION_MODAL_OPEN';
const SET_ACTIVE_NOTIFICATION = 'SET_ACTIVE_NOTIFICATION';
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
    case SET_ACTIVE_NOTIFICATION:
      return {
        ...state,
        activeNotification: state.notifications.find(n => n.id === action.payload),
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
        activeNotification: state.notifications.find(n => n.id === state.activeNotification.id)
          ? state.activeNotification
          : action.payload.length > 0
          ? action.payload[0]
          : null,
      };
    case SET_CURRENT_USER_INITIAL_FETCHED:
      return { ...state, currentUserInitialFetched: true };
    case SET_INITIAL_NOTIFICATION:
      return {
        ...state,
        activeNotification: action.payload,
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
    () =>
      notifications.sort((a, b) => {
        return b.createdAt - a.createdAt;
      }),
    [notifications]
  );

  const initialState = {
    notifications: sortedNotifications,
    isDeleteModalOpen: false,
    activeNotification: notifications.length > 0 ? notifications[0] : null,
    isNotificationModalOpen: false,
    initialNotificationSet: false,
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (sortedNotifications.length === 0) return;
    dispatch({ type: SET_NOTIFICATIONS, payload: sortedNotifications });
  }, [sortedNotifications.length]);

  useEffect(() => {
    const firstNotification = state.notifications.find(n => n.id === notificationId);
    if (!state.initialNotificationSet && notificationId && firstNotification) {
      dispatch({ type: SET_INITIAL_NOTIFICATION, payload: firstNotification });

      if (isMobile) {
        dispatch({ type: SET_NOTIFICATION_MODAL_OPEN, payload: true });
      }
    }
  }, [notificationId, state.notifications?.length]);

  const previousNotifications = usePrevious(state.notifications);

  useEffect(() => {
    if (previousNotifications && !isEqual(state.notifications, previousNotifications)) {
      onUpdateNotifications(state.notifications);
      onFetchCurrentUser();
    }
  }, [state.notifications]);

  useEffect(() => {
    if (state.activeNotification && !state.activeNotification.isRead) {
      dispatch({ type: SET_NOTIFICATION_READ, payload: state.activeNotification.id });
    }
  }, [state.activeNotification?.id]);

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
    dispatch({ type: SET_ACTIVE_NOTIFICATION, payload: id });

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
      <LayoutSideNavigation className={css.layoutSideNav}>
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
            activeNotificationId={state.activeNotification ? state.activeNotification.id : null}
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
              notification={state.activeNotification}
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
          notification={state.activeNotification}
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
