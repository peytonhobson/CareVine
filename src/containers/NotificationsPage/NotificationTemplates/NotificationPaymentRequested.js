import React from 'react';
import { NamedLink } from '../../../components';

import css from './NotificationTemplates.module.css';

const NotificationPaymentRequested = props => {
  const { notification } = props;

  const { senderName, channelUrl } = notification.metadata;

  return (
    <div className={css.root}>
      <h1 className={css.title}>Payment Requested</h1>
      <p className={css.message}>
        {senderName} has requested payment from you. Click the button below to go to the payment
        page. Once there, click the "Pay" button in the top right to pay them.
      </p>
      <NamedLink
        name="InboxPageWithChannel"
        params={{ channel: channelUrl }}
        className={css.linkButton}
      >
        Go to Payment
      </NamedLink>
    </div>
  );
};

export default NotificationPaymentRequested;
