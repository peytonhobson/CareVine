import React from 'react';

import { NamedLink } from '../../../components';

import css from './NotificationTemplates.module.css';

const NotificationListingRemoved = props => {
  const { notification } = props;

  return (
    <div className={css.root}>
      <h1 className={css.title}>Listing Removed</h1>
      <p className={css.message}>
        Your CareVine listing has been removed and is no longer active. To reactivate your
        subscription to be listed on the CareVine marketplace, click on the reactivate button below.
      </p>
      <NamedLink name="SubscriptionsPage" className={css.linkButton}>
        Reactivate
      </NamedLink>
    </div>
  );
};

export default NotificationListingRemoved;
