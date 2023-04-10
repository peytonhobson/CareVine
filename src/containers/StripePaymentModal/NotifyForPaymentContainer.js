import React from 'react';

import { userDisplayNameAsString } from '../../util/data';
import { UserListingPreview, Button } from '../../components';
import { FormattedMessage } from '../../util/reactIntl';

import css from './StripePaymentModal.module.css';
import classNames from 'classnames';

const checkIfNotifiedInLastDay = (currentUser, otherUserId) => {
  const sentNotificationsForPayment =
    currentUser.attributes.profile.privateData?.sentNotificationsForPayment || [];

  const withinLastDay =
    sentNotificationsForPayment.find(notification => notification.userId === otherUserId)
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
  } = props;

  const providerName = userDisplayNameAsString(provider);

  const handleNotifyForPayment = () => {
    onSendNotifyForPayment(currentUser, provider, providerListing);
  };

  const notifiedInLastDay = checkIfNotifiedInLastDay(currentUser, provider.id.uuid);

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
        <FormattedMessage
          id="NotifyForPaymentContainer.providerMissingStripeAccountText"
          values={{ providerName }}
        />
      </p>
      {notifiedInLastDay && (
        <p className={css.notifyDisabledMessage}>
          <FormattedMessage id="NotifyForPaymentContainer.notifyDisabledMessage" />
        </p>
      )}
      <div className={css.notifyButtonWrapper}>
        <Button
          disabled={notifyButtonDisabled}
          inProgress={sendNotifyForPaymentInProgress}
          onClick={handleNotifyForPayment}
          ready={sendNotifyForPaymentSuccess}
        >
          {notifyProviderMessage}
        </Button>
      </div>
    </div>
  );
};

export default NotifyForPaymentContainer;
