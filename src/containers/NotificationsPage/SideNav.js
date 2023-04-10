import React from 'react';
import { IconBell } from '../../components';
import NotificationPreview from './NotificationPreview';

import css from './NotificationsPage.module.css';

const SideNav = props => {
  const {
    notifications,
    handleOpenDeleteNotificationModal,
    onPreviewClick,
    activeNotificationId,
  } = props;

  return (
    <div className={css.sidenavRoot}>
      {notifications.length > 0 ? (
        notifications.map((notification, index) => {
          return (
            <NotificationPreview
              key={index}
              notification={notification}
              active={notification.id === activeNotificationId}
              onPreviewClick={onPreviewClick}
              handleOpenDeleteNotificationModal={handleOpenDeleteNotificationModal}
            />
          );
        })
      ) : (
        <div className={css.noNotificationsContainer}>
          <div className={css.noNotifications}>
            <IconBell className={css.bell} height="5rem" width="5rem" />
            <span className={css.noNotificationsText}>No Notifications</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SideNav;
