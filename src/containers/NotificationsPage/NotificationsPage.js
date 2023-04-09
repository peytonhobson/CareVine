import React, { useEffect, useReducer } from 'react';

import { compose } from 'redux';
import { connect } from 'react-redux';

import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { manageDisableScrolling, isScrollingDisabled } from '../../ducks/UI.duck';
import { updateNotifications } from '../../ducks/user.duck';

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

import css from './NotificationsPage.module.css';
import SideNav from './SideNav';

const DELETE_NOTIFICATION = 'DELETE_NOTIFICATION';
const SET_DELETE_MODAL_OPEN = 'SET_DELETE_MODAL_OPEN';
const SET_ACTIVE_NOTIFICATION = 'SET_ACTIVE_NOTIFICATION';

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
        activeNotificationId: action.payload,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, isRead: true } : n
        ),
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
  } = props;

  const notifications = [
    {
      id: '1',
      type: 'booking',
      createdAt: new Date(),
      isRead: false,
      metadata: {
        title: 'Notification title',
        date: new Date(),
        text: 'Notification text',
      },
    },
    {
      id: '2',
      type: 'booking',
      createdAt: new Date(),
      isRead: false,
      metadata: {
        title: 'Notification title',
        text: 'Notification text',
      },
    },
    ,
    {
      id: '3',
      type: 'booking',
      createdAt: new Date(),
      isRead: true,
      metadata: {
        title: 'Notification title',
        text: 'Notification text',
      },
    },
  ];

  const initialState = {
    notifications,
    isDeleteModalOpen: false,
    activeNotificationId: notifications.length > 0 ? notifications[0].id : null,
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    onUpdateNotifications(state.notifications);
  }, [state.notifications]);

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
            activeNotificationId={state.activeNotificationId}
          />
        </LayoutWrapperSideNav>
        <LayoutWrapperMain></LayoutWrapperMain>
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
  const { currentUser } = state.user;

  return {
    currentUser,
    scrollingDisabled: isScrollingDisabled(state),
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
