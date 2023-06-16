import React from 'react';

import { NamedLink } from '../../../components';

import css from './NotificationTemplates.module.css';

const NotificationListingRemoved = props => {
  const { notification } = props;

  return (
    <div className={css.root}>
      <h1 className={css.title}>Booking Request</h1>

      <NamedLink name="SubscriptionsPage" className={css.linkButton}>
        Reactivate
      </NamedLink>
    </div>
  );
};

export default NotificationListingRemoved;
