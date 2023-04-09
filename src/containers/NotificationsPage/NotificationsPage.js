import React, { useEffect, useReducer, useRef } from 'react';

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
      type: NOTIFICATION_TYPE_PAYMENT_RECEIVED,
      createdAt: new Date().getTime(),
      isRead: false,
      metadata: {
        senderName: 'John D',
        paymentAmount: 100,
      },
    },
    {
      id: '2',
      type: NOTIFICATION_TYPE_PAYMENT_REQUESTED,
      createdAt: new Date().getTime(),
      isRead: false,
      metadata: {
        senderName: 'John D',
        channelUrl:
          'sendbird_group_channel_6352e1f6-c07c-403c-84ac-48bbaef586a2-6426d34c-0c4a-4e68-a140-a56e04d5c5a9',
      },
    },
    {
      id: '3',
      type: NOTIFICATION_TYPE_NOTIFY_FOR_PAYMENT,
      createdAt: new Date().getTime(),
      isRead: true,
      metadata: {
        senderName: 'John D',
      },
    },
    {
      id: '4',
      type: NOTIFICATION_TYPE_NEW_MESSAGE,
      createdAt: new Date().getTime(),
      isRead: true,
      metadata: {
        senderName: 'John D',
        channelUrl:
          'sendbird_group_channel_6352e1f6-c07c-403c-84ac-48bbaef586a2-6426d06d-ce9f-4a26-ab53-23e4e1de5789',
      },
    },
  ];

  const sortedNotifications = notifications.sort((a, b) => {
    return b.createdAt - a.createdAt;
  });

  const initialState = {
    notifications: sortedNotifications,
    isDeleteModalOpen: false,
    activeNotification: notifications.length > 0 ? notifications[0] : null,
  };

  const [state, dispatch] = useReducer(reducer, initialState);

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
          />
        </LayoutWrapperSideNav>
        <LayoutWrapperMain className={css.mainWrapper}>
          <NotificationContainer notification={state.activeNotification} />
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
