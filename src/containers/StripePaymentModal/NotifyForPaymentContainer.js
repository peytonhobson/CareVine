import React from 'react';

import { userDisplayNameAsString } from '../../util/data';
import { UserListingPreview, Button } from '../../components';
import { FormattedMessage } from '../../util/reactIntl';

import css from './StripePaymentModal.module.css';
import classNames from 'classnames';

const checkIfNotifiedInLastDay = (currentUser, listingId) => {
  const sentNotificationsForBooking =
    currentUser.attributes.profile.privateData?.sentNotificationsForBooking || [];

  const withinLastDay =
    sentNotificationsForBooking.find(notification => notification.listingId === listingId)
      ?.createdAt >
    Date.now() - 24 * 60 * 60 * 1000;

  return withinLastDay;
};

const NotifyForPaymentContainer = props => {
  const {
    currentUser,
    intl,
    onSendNotifyForPayment,
    provider,
    providerListing,
    sendNotifyForPaymentInProgress,
    sendNotifyForPaymentSuccess,
    sendNotifyForPaymentError,
  } = props;

  const providerName = userDisplayNameAsString(provider);

  const handleNotifyForPayment = () => {
    onSendNotifyForPayment(providerListing);
  };

  const notifiedInLastDay = checkIfNotifiedInLastDay(currentUser, providerListing?.id.uuid);

  const notifyButtonDisabled =
    !currentUser ||
    !provider ||
    !providerListing ||
    sendNotifyForPaymentSuccess ||
    notifiedInLastDay;

  const notifyProviderMessage = intl.formatMessage({
    id: 'NotifyForPaymentContainer.notifyButtonLabel',
  });

  const rootClasses = classNames(css.root, css.single);

  return (
    <div className={rootClasses}>
      <UserListingPreview
        intl={intl}
        otherUser={provider}
        otherUserListing={providerListing}
        rootClassName={css.userPreviewRoot}
      />
      <p className={css.noPayoutMessage}>
        {providerName} hasn't set up their payment details, so you won't be able to book them yet.
      </p>
      <p className={css.noPayoutMessage}>
        Click the button below to notify {providerName} that you're interested in booking them.
      </p>
      {notifiedInLastDay && (
        <p className={css.notifyDisabledMessage}>
          <FormattedMessage id="NotifyForPaymentContainer.notifyDisabledMessage" />
        </p>
      )}
      {sendNotifyForPaymentError && <p className="text-error">Failed to send request.</p>}
      <div className={css.notifyButtonWrapper}>
        <Button
          disabled={notifyButtonDisabled}
          inProgress={sendNotifyForPaymentInProgress}
          onClick={handleNotifyForPayment}
          ready={sendNotifyForPaymentSuccess}
        >
          Request to Book
        </Button>
      </div>
    </div>
  );
};

export default NotifyForPaymentContainer;
