import React from 'react';
import { createSlug } from '../../../util/urlHelpers';

import { NamedLink } from '../../../components';
import { userDisplayNameAsString } from '../../../util/data';

import css from './NotificationTemplates.module.css';

const NotificationListingOpened = props => {
  const { currentUser, listing } = props;

  return (
    <div className={css.root}>
      <h1 className={css.title}>Success!</h1>
      <p className={css.message}>
        Your profile listing has been posted on the marketplace and is now viewable by others.
      </p>
      <NamedLink
        className={css.linkButton}
        name="ListingPage"
        params={{
          slug: createSlug(userDisplayNameAsString(currentUser)),
          id: listing?.id.uuid ?? 'string',
        }}
      >
        <span>View Listing</span>
      </NamedLink>
    </div>
  );
};

export default NotificationListingOpened;
