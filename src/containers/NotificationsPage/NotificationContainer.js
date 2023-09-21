import React from 'react';
import { IconBell, IconSpinner } from '../../components';
import {
  NOTIFICATION_TYPE_LISTING_REMOVED,
  NOTIFICATION_TYPE_LISTING_OPENED,
  NOTIFICATION_TYPE_NEW_MESSAGE,
  NOTIFICATION_TYPE_NOTIFY_FOR_PAYMENT,
  NOTIFICATION_TYPE_PAYMENT_RECEIVED,
  NOTIFICATION_TYPE_PAYMENT_REQUESTED,
  NOTIFICATION_TYPE_BOOKING_REQUESTED,
} from '../../util/constants';
import {
  NotificationPaymentRequested,
  NotificationPaymentReceived,
  NotificationNotifyForPayment,
  NotificationNewMessage,
  NotificationListingRemoved,
  NotificationListingOpened,
  NotificationNewBookingRequest,
} from './NotificationTemplates';
import { compose } from 'redux';
import { connect } from 'react-redux';
import {
  transitionTransaction,
  fetchTransaction,
  acceptBooking,
} from '../../ducks/transactions.duck';

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
    onManageDisableScrolling,
    transitionTransactionInProgress,
    transitionTransactionError,
    currentTransaction,
    onTransitionTransaction,
    fetchTransactionError,
    fetchTransactionInProgress,
    onFetchTransaction,
    acceptBookingInProgress,
    acceptBookingError,
    acceptBookingSuccess,
    onAcceptBooking,
    declineBookingError,
    declineBookingInProgress,
    declineBookingSuccess,
    onDeclineBooking,
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
    case NOTIFICATION_TYPE_BOOKING_REQUESTED:
      notificationTemplate = (
        <NotificationNewBookingRequest
          notification={notification}
          currentUser={currentUser}
          onManageDisableScrolling={onManageDisableScrolling}
          transitionTransactionInProgress={transitionTransactionInProgress}
          transitionTransactionError={transitionTransactionError}
          currentTransaction={currentTransaction}
          onTransitionTransaction={onTransitionTransaction}
          fetchTransactionError={fetchTransactionError}
          fetchTransactionInProgress={fetchTransactionInProgress}
          onFetchTransaction={onFetchTransaction}
          acceptBookingInProgress={acceptBookingInProgress}
          acceptBookingError={acceptBookingError}
          onAcceptBooking={onAcceptBooking}
          acceptBookingSuccess={acceptBookingSuccess}
          declineBookingError={declineBookingError}
          declineBookingInProgress={declineBookingInProgress}
          declineBookingSuccess={declineBookingSuccess}
          onDeclineBooking={onDeclineBooking}
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
          <div className="w-full h-full flex justify-center items-center">
            <h1 className={css.selectANotification}>Select a Notification</h1>
          </div>
        );
  }

  return <div className={css.notificationContainerRoot}>{notificationTemplate}</div>;
};

const mapStateToProps = state => {
  const {
    transitionTransactionInProgress,
    transitionTransactionError,
    currentTransaction,
    fetchTransactionError,
    fetchTransactionInProgress,
    acceptBookingInProgress,
    acceptBookingError,
    acceptBookingSuccess,
    declineBookingError,
    declineBookingInProgress,
    declineBookingSuccess,
  } = state.transactions;

  return {
    transitionTransactionInProgress,
    transitionTransactionError,
    currentTransaction,
    fetchTransactionError,
    fetchTransactionInProgress,
    acceptBookingInProgress,
    acceptBookingError,
    acceptBookingSuccess,
    declineBookingError,
    declineBookingInProgress,
    declineBookingSuccess,
  };
};

const mapDispatchToProps = {
  onTransitionTransaction: transitionTransaction,
  onFetchTransaction: fetchTransaction,
  onAcceptBooking: acceptBooking,
  onDeclineBooking: declineBooking,
};

export default compose(connect(mapStateToProps, mapDispatchToProps))(NotificationContainer);
