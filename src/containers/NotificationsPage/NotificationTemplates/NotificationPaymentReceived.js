import React from 'react';
import { NamedLink } from '../../../components';

import css from './NotificationTemplates.module.css';

const NotificationPaymentRequested = props => {
  const { notification } = props;

  const { senderName, paymentAmount } = notification.metadata;

  return (
    <div className={css.root}>
      <h1 className={css.title}>Payment Received</h1>
      <p className={css.message}>
        You have received a payment of ${Number.parseFloat(paymentAmount).toFixed(2)} from{' '}
        <span className={css.noWrapText}>{senderName}</span>.
      </p>
    </div>
  );
};

export default NotificationPaymentRequested;
