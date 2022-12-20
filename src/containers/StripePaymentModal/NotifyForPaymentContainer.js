import React from 'react';

import { userDisplayNameAsString } from '../../util/data';
import { UserListingPreview, Button } from '../../components';
import { FormattedMessage } from '../../util/reactIntl';

import css from './StripePaymentModal.module.css';
import classNames from 'classnames';

const NotifyForPaymentContainer = props => {
  const {
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

  const notifyButtonDisabled =
    !currentUser || !provider || !providerListing || sendNotifyForPaymentSuccess;

  const notifyProviderMessage = intl.formatMessage({
    id: 'StripePaymentModal.notifyProviderMessage',
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
          id="StripePaymentModal.providerMissingStripeAccountText"
          values={{ providerName }}
        />
      </p>
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
