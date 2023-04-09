import React from 'react';

import {
  NOTIFICATION_TYPE_LISTING_REMOVED,
  NOTIFICATION_TYPE_LISTING_OPENED,
  NOTIFICATION_TYPE_NEW_MESSAGE,
  NOTIFICATION_TYPE_NOTIFY_FOR_PAYMENT,
  NOTIFICATION_TYPE_PAYMENT_RECEIVED,
  NOTIFICATION_TYPE_PAYMENT_REQUESTED,
} from '../../util/constants';
import { IconVerticalDots } from '../../components';
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

const truncateString = function(fullStr, strLen) {
  if (!strLen) strLen = 40;
  if (fullStr === null || fullStr === undefined) return '';
  if (fullStr.length <= strLen) return fullStr;
  var separator = '...';
  var sepLen = separator.length;
  var charsToShow = strLen - sepLen;
  var frontChars = Math.ceil(charsToShow / 2);
  var backChars = Math.floor(charsToShow / 2);
  return fullStr.substr(0, frontChars) + separator + fullStr.substr(fullStr.length - backChars);
};

const buildText = (type, metadata) => {
  if (type === NOTIFICATION_TYPE_PAYMENT_REQUESTED) {
    return `${metadata.senderName} has requested payment from you. Click the button below to go to the payment page. Once there, click the "Pay" button in the top right to pay them.`;
  }
};

const buildTitle = (type, metadata) => {
  if (type === NOTIFICATION_TYPE_PAYMENT_REQUESTED) {
    return `Payment request from ${metadata.senderName}`;
  }
};

const NotificationPreview = props => {
  const { notification, onPreviewClick, active, handleOpenDeleteNotificationModal } = props;

  const { createdAt, type, id, isRead, metadata } = notification;
  const notificationDot = !isRead ? <div className={css.notificationDot} /> : null;
  const activeClass = active ? css.active : null;

  const title = buildTitle(type, metadata);
  const text = truncateString(buildText(type, metadata));

  return (
    <div
      className={classNames(css.notificationPreview, activeClass)}
      key={id}
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
};

export default NotificationPreview;
