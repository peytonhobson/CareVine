import React, { useMemo } from 'react';
import { IconBell, IconSpinner } from '../../components';
import NotificationPreview from './NotificationPreview';

import css from './NotificationsPage.module.css';

const SideNav = props => {
  const {
    notifications,
    handleOpenDeleteNotificationModal,
    onPreviewClick,
    activeNotificationId,
    fetchCurrentUserInProgress,
    isMobile,
  } = props;

  const sortedNotifications = useMemo(
    () => notifications?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) ?? [],
    [notifications]
  );

  return (
    <div className={css.sidenavRoot}>
      {sortedNotifications.length > 0 ? (
        sortedNotifications.map((notification, index) => {
          return (
            <NotificationPreview
              key={index}
              notification={notification}
              active={notification.id === activeNotificationId}
              onPreviewClick={onPreviewClick}
              handleOpenDeleteNotificationModal={handleOpenDeleteNotificationModal}
              isMobile={isMobile}
            />
          );
        })
      ) : (
        <div className={css.noNotificationsContainer}>
          {fetchCurrentUserInProgress ? (
            <IconSpinner className={css.sideNavSpinner} />
          ) : (
            <div className={css.noNotifications}>
              <IconBell
                className={css.bell}
                height={isMobile ? '7em' : '5em'}
                width={isMobile ? '7em' : '5em'}
              />
              <span className={css.noNotificationsText}>No Notifications</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SideNav;
