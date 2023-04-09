import React, { useState } from 'react';
import { IconCar, IconEdit, IconVerticalDots, Modal } from '../../components';
import { isToday, isYesterday, timestampToDate } from '../../util/dates';
import moment from 'moment';
import classNames from 'classnames';

import css from './NotificationsPage.module.css';

const formatPreviewDate = createdAt => {
  if (isToday(createdAt)) {
    return timestampToDate(createdAt).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  }

  if (isYesterday(createdAt)) {
    return (
      'yesterday at ' +
      timestampToDate(createdAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      })
    );
  }

  return moment(createdAt).format('MMM DD');
};

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
        const { title, date, text } = notification.metadata;
        const { createdAt, type, id, isRead } = notification;
        const notificationDot = !isRead ? <div className={css.notificationDot} /> : null;
        const activeClass = activeNotificationId === id ? css.active : null;
        return (
          <div
            className={classNames(css.notificationPreview, activeClass)}
            key={index}
            onClick={() => onPreviewClick(id)}
          >
            <div className={css.previewHoverLine} />
            <div className={css.notificationPreviewContent}>
              <div className={css.notificationPreviewUpper}>
                <div className={css.notificationTitle}>{title}</div>
                {notificationDot}
                <div className={css.notificationDate}>{formatPreviewDate(createdAt)}</div>
              </div>
              <div className={css.notificationPreviewLower}>
                <div className={css.notificationText}>{text}</div>
                <div
                  className={css.notificationPreviewAction}
                  onClick={() => handleOpenDeleteNotificationModal(id)}
                >
                  <IconVerticalDots height="0.75rem" width="1rem" className={css.menuIcon} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SideNav;
