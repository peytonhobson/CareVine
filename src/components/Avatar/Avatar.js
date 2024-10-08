import React from 'react';
import { string, oneOfType, bool, object } from 'prop-types';
import { injectIntl, intlShape } from '../../util/reactIntl';
import classNames from 'classnames';
import { propTypes } from '../../util/types';
import {
  ensureUser,
  ensureCurrentUser,
  userDisplayNameAsString,
  userAbbreviatedName,
} from '../../util/data';
import { ResponsiveImage, IconBannedUser, NamedLink } from '../../components/';
import DefaultAvatar1 from '../../assets/Dava1.png';
import DefaultAvatar2 from '../../assets/Dava2.png';
import DefaultAvatar3 from '../../assets/Dava3.png';
import DefaultAvatar4 from '../../assets/Dava4.png';

import css from './Avatar.module.css';
import { createSlug } from '../../util/urlHelpers';

// Responsive image sizes hint
const AVATAR_SIZES = '40px';
const AVATAR_SIZES_MEDIUM = '60px';
const AVATAR_SIZES_LARGE = '96px';

const AVATAR_IMAGE_VARIANTS = [
  // 40x40
  'square-xsmall',

  // 80x80
  'square-xsmall2x',

  // 240x240
  'square-small',

  // 480x480
  'square-small2x',

  'default',
];

export const AvatarComponent = props => {
  const { rootClassName, className, initialsClassName, user, renderSizes, intl, listing } = props;
  const classes = classNames(rootClassName || css.root, className);

  const userIsCurrentUser = user && user.type === 'currentUser';
  const avatarUser = userIsCurrentUser ? ensureCurrentUser(user) : ensureUser(user);

  const isBannedUser = avatarUser.attributes.banned;
  const isDeletedUser = avatarUser.attributes.deleted;

  const bannedUserDisplayName = intl.formatMessage({
    id: 'Avatar.bannedUserDisplayName',
  });

  const deletedUserDisplayName = intl.formatMessage({
    id: 'Avatar.deletedUserDisplayName',
  });

  const defaultUserDisplayName = isBannedUser
    ? bannedUserDisplayName
    : isDeletedUser
    ? deletedUserDisplayName
    : '';

  const defaultUserAbbreviatedName = '';

  let defaultAvatarImage = null;

  const defaultAvatar = avatarUser.attributes.profile.publicData?.defaultAvatar;

  switch (defaultAvatar) {
    case '1':
      defaultAvatarImage = css.defaultContainer1;
      break;
    case '2':
      defaultAvatarImage = css.defaultContainer2;
      break;
    case '3':
      defaultAvatarImage = css.defaultContainer3;
      break;
    case '4':
      defaultAvatarImage = css.defaultContainer4;
      break;
    default:
      break;
  }

  const displayName = userDisplayNameAsString(avatarUser, defaultUserDisplayName);
  const abbreviatedName = userAbbreviatedName(avatarUser, defaultUserAbbreviatedName);
  const rootProps = { className: classes, title: displayName };
  const linkProps = {
    name: 'ListingPage',
    params: { id: listing?.id.uuid, slug: createSlug(avatarUser) },
  };
  const hasProfileImage = avatarUser?.profileImage?.id;
  const profileLinkEnabled = !!listing?.id.uuid;

  const classForInitials = classNames(css.initials, initialsClassName);

  if (isBannedUser || isDeletedUser) {
    return (
      <div {...rootProps}>
        <IconBannedUser className={css.bannedUserIcon} />
      </div>
    );
  } else if (hasProfileImage && profileLinkEnabled) {
    return (
      <NamedLink {...rootProps} {...linkProps}>
        <ResponsiveImage
          rootClassName={css.avatarImage}
          alt={displayName}
          image={avatarUser.profileImage || avatarUser.relationships.profileImage.data}
          variants={AVATAR_IMAGE_VARIANTS}
          sizes={renderSizes}
        />
      </NamedLink>
    );
  } else if (hasProfileImage) {
    return (
      <div {...rootProps}>
        <ResponsiveImage
          rootClassName={css.avatarImage}
          alt={displayName}
          image={avatarUser.profileImage || avatarUser.relationships.profileImage.data}
          variants={AVATAR_IMAGE_VARIANTS}
          sizes={renderSizes}
        />
      </div>
    );
  } else if (profileLinkEnabled) {
    // Placeholder avatar (initials)
    return (
      <NamedLink {...rootProps} {...linkProps} className={classNames(classes, defaultAvatarImage)}>
        <span className={classForInitials}>{abbreviatedName}</span>
      </NamedLink>
    );
  } else {
    // Placeholder avatar (initials)
    return (
      <div {...rootProps} className={classNames(classes, defaultAvatarImage)}>
        <span className={classForInitials}>{abbreviatedName}</span>
      </div>
    );
  }
};

AvatarComponent.defaultProps = {
  className: null,
  rootClassName: null,
  initialsClassName: null,
  user: null,
  renderSizes: AVATAR_SIZES,
  disableProfileLink: false,
};

AvatarComponent.propTypes = {
  rootClassName: string,
  className: string,
  initialsClassName: string,
  user: oneOfType([propTypes.user, propTypes.currentUser, object]),

  renderSizes: string,
  disableProfileLink: bool,

  // from injectIntl
  intl: intlShape.isRequired,
};

const Avatar = injectIntl(AvatarComponent);

export default Avatar;

export const AvatarMedium = props => (
  <Avatar rootClassName={css.mediumAvatar} renderSizes={AVATAR_SIZES_MEDIUM} {...props} />
);
AvatarMedium.displayName = 'AvatarMedium';

export const AvatarLarge = props => (
  <Avatar rootClassName={css.largeAvatar} renderSizes={AVATAR_SIZES_LARGE} {...props} />
);
AvatarLarge.displayName = 'AvatarLarge';
