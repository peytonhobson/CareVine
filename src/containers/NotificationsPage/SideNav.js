import React from 'react';

import css from './NotificationsPage.module.css';
import NotificationPreview from './NotificationPreview';

const SideNav = props => {
  const {
    notifications,
    handleOpenDeleteNotificationModal,
    onPreviewClick,
    activeNotificationId,
  } = props;

  return (
    <div className={css.sidenavRoot}>
      {notifications.map((notification, index) => {
        return (
          <NotificationPreview
            key={index}
            notification={notification}
            active={notification.id === activeNotificationId}
            onPreviewClick={onPreviewClick}
            handleOpenDeleteNotificationModal={handleOpenDeleteNotificationModal}
          />
        );
      })}
    </div>
  );
};

export default SideNav;
