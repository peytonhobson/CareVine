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

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

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
  if (type === NOTIFICATION_TYPE_PAYMENT_RECEIVED) {
    return `You have received a payment of $${Number.parseFloat(metadata.paymentAmount).toFixed(
      2
    )} from ${metadata.senderName}.`;
  }
  if (type === NOTIFICATION_TYPE_NOTIFY_FOR_PAYMENT) {
    return `You haven't completed the payout details portion of your account and you are unable to
        receive payment. To complete this and receive payment from ${metadata.senderName}, please click the
        button below.`;
  }
  if (type === NOTIFICATION_TYPE_NEW_MESSAGE) {
    return `You have a new message from ${metadata.senderName}. To view this message, click the button below.`;
  }
  if (type === NOTIFICATION_TYPE_LISTING_REMOVED) {
    return `Your CareVine listing has been removed and is no longer active. To reactivate your
        subscription to be listed on the CareVine marketplace, click on the reactivate button below.`;
  }
  if (type === NOTIFICATION_TYPE_LISTING_OPENED) {
    return `Your profile listing has been posted on the marketplace and is now viewable by others.`;
  }
};

const TitleContent = ({ type, metadata }) => {
  if (type === NOTIFICATION_TYPE_PAYMENT_REQUESTED) {
    return (
      <span>
        Payment request from <span className={css.noWrapText}>{metadata.senderName}</span>
      </span>
    );
  }
  if (type === NOTIFICATION_TYPE_PAYMENT_RECEIVED) {
    return (
      <span>
        Payment received from <span className={css.noWrapText}>{metadata.senderName}</span>
      </span>
    );
  }
  if (type === NOTIFICATION_TYPE_NOTIFY_FOR_PAYMENT) {
    return (
      <span>
        <span className={css.noWrapText}>{metadata.senderName}</span> Wants to Pay You!
      </span>
    );
  }
  if (type === NOTIFICATION_TYPE_NEW_MESSAGE) {
    return (
      <span>
        New Message from <span className={css.noWrapText}>{metadata.senderName}</span>
      </span>
    );
  }
  if (type === NOTIFICATION_TYPE_LISTING_REMOVED) {
    return <span>Listing Removed</span>;
  }
  if (type === NOTIFICATION_TYPE_LISTING_OPENED) {
    return <span>Listing Opened</span>;
  }
};

const NotificationPreview = props => {
  const { notification, onPreviewClick, active, handleOpenDeleteNotificationModal } = props;

  const { createdAt, type, id, isRead, metadata } = notification;
  const notificationDot = !isRead ? <div className={css.notificationDot} /> : null;
  const activeClass = active ? css.active : null;

  const title = <TitleContent type={type} metadata={metadata} />;
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
          {notificationDot}
          <div className={css.notificationTitle}>{title}</div>
          <div className={css.notificationDate}>{formatPreviewDate(createdAt)}</div>
        </div>
        <div className={css.notificationPreviewLower}>
          <div className={css.notificationText}>{text}</div>
        </div>
        <div
          className={css.notificationPreviewAction}
          onClick={e => {
            e.stopPropagation();
            handleOpenDeleteNotificationModal(id);
          }}
        >
          <IconVerticalDots
            height={isMobile ? '1.5em' : '0.75em'}
            width={isMobile ? '1.75em' : '1em'}
            className={css.menuIcon}
          />
        </div>
      </div>
    </div>
  );
};

export default NotificationPreview;
