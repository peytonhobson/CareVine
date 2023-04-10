import React, { useState } from 'react';
import { IconCar, IconEdit, IconVerticalDots, Modal } from '../../components';
import { isToday, isYesterday, timestampToDate } from '../../util/dates';
import moment from 'moment';
import classNames from 'classnames';
import {
  NOTIFICATION_TYPE_LISTING_REMOVED,
  NOTIFICATION_TYPE_LISTING_OPENED,
  NOTIFICATION_TYPE_NEW_MESSAGE,
  NOTIFICATION_TYPE_NOTIFY_FOR_PAYMENT,
  NOTIFICATION_TYPE_PAYMENT_RECEIVED,
  NOTIFICATION_TYPE_PAYMENT_REQUESTED,
} from '../../util/constants';
import {
  NotificationPaymentRequested,
  NotificationPaymentReceived,
  NotificationNotifyForPayment,
  NotificationNewMessage,
  NotificationListingRemoved,
  NotificationListingOpened,
} from './NotificationTemplates';

import css from './NotificationsPage.module.css';

const NotificationContainer = props => {
  const { notification, listing, currentUser } = props;

  let notificationTemplate = null;

  switch (notification.type) {
    case NOTIFICATION_TYPE_LISTING_REMOVED:
      notificationTemplate = <NotificationListingRemoved notification={notification} />;
      break;
    case NOTIFICATION_TYPE_LISTING_OPENED:
      notificationTemplate = (
        <NotificationListingOpened
          notification={notification}
          listing={listing}
          currentUser={currentUser}
        />
      );
      break;
    case NOTIFICATION_TYPE_NEW_MESSAGE:
      notificationTemplate = <NotificationNewMessage notification={notification} />;
      break;
    case NOTIFICATION_TYPE_NOTIFY_FOR_PAYMENT:
      notificationTemplate = <NotificationNotifyForPayment notification={notification} />;
      break;
    case NOTIFICATION_TYPE_PAYMENT_RECEIVED:
      notificationTemplate = <NotificationPaymentReceived notification={notification} />;
      break;
    case NOTIFICATION_TYPE_PAYMENT_REQUESTED:
      notificationTemplate = <NotificationPaymentRequested notification={notification} />;
      break;
    default:
      notificationTemplate = null;
  }

  return <div className={css.notificationContainerRoot}>{notificationTemplate}</div>;
};

export default NotificationContainer;
