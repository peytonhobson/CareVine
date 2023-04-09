import React from 'react';

import { NamedLink } from '../../../components';

import css from './NotificationTemplates.module.css';

const NotificationNotifyForPayment = props => {
  const { notification } = props;

  const { senderName } = notification.metadata;

  return (
    <div className={css.root}>
      <h1 className={css.title}>{senderName} Wants to Pay You!</h1>
      <p className={css.message}>
        You haven&apos;t completed the payout details portion of your account and you are unable to
        receive payment. To complete this and receive payment from {senderName}, please click the
        button below.
      </p>
      <NamedLink name="StripePayoutPage" className={css.linkButton}>
        Setup Payout Details
      </NamedLink>
    </div>
  );
};

export default NotificationNotifyForPayment;
