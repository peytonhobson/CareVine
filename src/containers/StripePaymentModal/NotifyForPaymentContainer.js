import React from 'react';

import { userDisplayNameAsString } from '../../util/data';
import { UserListingPreview, Button } from '../../components';
import { FormattedMessage } from '../../util/reactIntl';

import css from './StripePaymentModal.module.css';
import classNames from 'classnames';

const checkIfNotifiedInLastDay = messages => {
  let withinADay = false;

  messages &&
    messages
      .filter(message => {
        return message.customType === 'NOTIFY_FOR_PAYMENT';
      })
      .forEach(message => {
        if (new Date(message.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
          withinADay = true;
        }
      });
  return withinADay;
};

const NotifyForPaymentContainer = props => {
  const {
    channelContext,
    channelUrl,
    currentUser,
    intl,
    onSendNotifyForPayment,
    provider,
    providerListing,
    sendbirdContext,
    sendNotifyForPaymentInProgress,
    sendNotifyForPaymentSuccess,
  } = props;

  const providerName = userDisplayNameAsString(provider);

  const handleNotifyForPayment = () => {
    const currentUserId = currentUser.id && currentUser.id.uuid;
    onSendNotifyForPayment(
      currentUserId,
      providerName,
      channelUrl,
      sendbirdContext,
      providerListing
    );
  };

  const notifiedInLastDay = checkIfNotifiedInLastDay(channelContext.allMessages);

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
