import React, { useEffect, useReducer, useRef, useMemo } from 'react';

import { compose } from 'redux';
import { connect } from 'react-redux';
import { isEqual } from 'lodash';

import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { manageDisableScrolling, isScrollingDisabled } from '../../ducks/UI.duck';
import { updateNotifications } from '../../ducks/user.duck';
import {
  NOTIFICATION_TYPE_LISTING_REMOVED,
  NOTIFICATION_TYPE_LISTING_OPENED,
  NOTIFICATION_TYPE_NEW_MESSAGE,
  NOTIFICATION_TYPE_NOTIFY_FOR_PAYMENT,
  NOTIFICATION_TYPE_PAYMENT_RECEIVED,
  NOTIFICATION_TYPE_PAYMENT_REQUESTED,
} from '../../util/constants';

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

import css from './NotificationsPage.module.css';
import SideNav from './SideNav';

const DELETE_NOTIFICATION = 'DELETE_NOTIFICATION';
const SET_DELETE_MODAL_OPEN = 'SET_DELETE_MODAL_OPEN';
const SET_ACTIVE_NOTIFICATION = 'SET_ACTIVE_NOTIFICATION';
const SET_NOTIFICATION_READ = 'SET_NOTIFICATION_READ';
const SET_NOTIFICATIONS = 'SET_NOTIFICATIONS';

const reducer = (state, action) => {
  switch (action.type) {
    case DELETE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
        isDeleteModalOpen: false,
      };
    case SET_DELETE_MODAL_OPEN:
      return { ...state, isDeleteModalOpen: action.payload };
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
        activeNotification: action.payload.length > 0 ? action.payload[0] : null,
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
  } = props;

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
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (sortedNotifications.length === 0) return;
    dispatch({ type: SET_NOTIFICATIONS, payload: sortedNotifications });
  }, [sortedNotifications.length]);

  const usePrevious = value => {
    const ref = useRef();
    useEffect(() => {
      ref.current = value;
    });
    return ref.current;
  };

  const previousNotifications = usePrevious(state.notifications);

  useEffect(() => {
    if (previousNotifications && !isEqual(state.notifications, previousNotifications)) {
      onUpdateNotifications(state.notifications);
    }
  }, [state.notifications]);

  useEffect(() => {
    if (state.activeNotification && !state.activeNotification.isRead) {
      dispatch({ type: SET_NOTIFICATION_READ, payload: state.activeNotification.id });
    }
  }, [state.activeNotification?.id]);

  const handleOpenDeleteNotificationModal = id => {
    dispatch({ type: SET_DELETE_MODAL_OPEN, payload: id });
  };

  const handleDeleteNotification = () => {
    dispatch({ type: DELETE_NOTIFICATION, payload: state.isDeleteModalOpen });
  };

  const handlePreviewClick = id => {
    dispatch({ type: SET_ACTIVE_NOTIFICATION, payload: id });
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
            fetchCurrentUserInProgress={fetchCurrentUserInProgress}
          />
        </LayoutWrapperSideNav>
        <LayoutWrapperMain className={css.mainWrapper}>
          <NotificationContainer
            notifications={state.notifications}
            notification={state.activeNotification}
            listing={currentUserListing}
            currentUser={currentUser}
            fetchCurrentUserInProgress={fetchCurrentUserInProgress}
          />
        </LayoutWrapperMain>
      </LayoutSideNavigation>
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
          <div className={css.modalButtons}>
            <SecondaryButton
              className={css.modalButtonCancel}
              onClick={() => dispatch({ type: SET_DELETE_MODAL_OPEN, payload: false })}
            >
              <FormattedMessage id="NotificationsPage.deleteModalCancel" />
            </SecondaryButton>
            <Button className={css.modalButtonDelete} onClick={handleDeleteNotification}>
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
  };
};

const mapDispatchToProps = dispatch => ({
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
  onUpdateNotifications: notifications => dispatch(updateNotifications(notifications)),
});

const NotificationsPage = compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(NotificationsPageComponent);

export default NotificationsPage;
