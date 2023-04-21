import React from 'react';
import { AvatarMedium, NamedLink, UserDisplayName } from '../';
import { createSlug, stringify } from '../../util/urlHelpers';
import classNames from 'classnames';

import css from './UserListingPreview.module.css';

const createListingLink = (listing, otherUser, searchParams = {}, className = '') => {
  const listingId = listing.id?.uuid;
  const label = listing.attributes.title;
  const listingDeleted = listing.attributes.deleted;

  if (!listingDeleted) {
    const params = { id: listingId, slug: createSlug(label) };
    const to = { search: stringify(searchParams) };
    return (
      <NamedLink className={css.avatarLink} name="ListingPage" params={params} to={to}>
        <AvatarLarge user={otherUser} disableProfileLink className={css.avatar} />
      </NamedLink>
    );
  } else {
    return <FormattedMessage id="TransactionPanel.deletedListingOrderTitle" />;
  }
};

const UserListingPreview = props => {
  const { otherUser, intl, rootClassName, className } = props;

  const userDisplayName = <UserDisplayName user={otherUser} intl={intl} />;

  const rootClass = classNames(rootClassName || css.userPreviewRoot);
  const usernameClass = classNames(className || css.usernameContainer);

  return (
    <div className={rootClass}>
      <div className={css.avatarContainer}>
        <AvatarMedium user={otherUser} className={css.avatar} />
      </div>
      <div className={usernameClass}>{userDisplayName}</div>
    </div>
  );
};

export default UserListingPreview;
