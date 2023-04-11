import React from 'react';
import { IconBell, IconSpinner } from '../../components';
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
  const {
    notifications,
    notification,
    listing,
    currentUser,
    fetchCurrentUserInProgress,
    onFetchSenderListing,
    sender,
    senderListing,
    fetchSenderListingInProgress,
    fetchSenderListingError,
  } = props;

  let notificationTemplate = null;

  switch (notification?.type) {
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
      notificationTemplate = (
        <NotificationPaymentRequested
          notification={notification}
          onFetchSenderListing={onFetchSenderListing}
          sender={sender}
          senderListing={senderListing}
          fetchSenderListingInProgress={fetchSenderListingInProgress}
          fetchSenderListingError={fetchSenderListingError}
        />
      );
      break;
    default:
      notificationTemplate =
        notifications.length === 0 ? (
          <div className={css.noNotificationsContainer}>
            <div className={css.noNotifications}>
              <IconBell className={css.bell} height="10rem" width="10rem" />
              <h1 className={css.noNotificationsText}>No Notifications</h1>
            </div>
          </div>
        ) : fetchCurrentUserInProgress ? (
          <IconSpinner className={css.mainSpinner} />
        ) : (
          <h1 className={css.selectANotification}>Select a Notification</h1>
        );
  }

  return <div className={css.notificationContainerRoot}>{notificationTemplate}</div>;
};

export default NotificationContainer;
