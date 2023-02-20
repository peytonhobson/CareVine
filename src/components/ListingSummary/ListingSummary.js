import React from 'react';

import { Avatar, AvailabilityPreview, Button, SecondaryButton } from '..';
import { formatPrice, userDisplayNameAsString } from '../../util/data';
import { richText } from '../../util/richText';
import { compose } from 'redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { calculateDistanceBetweenOrigins } from '../../util/maps';
import { CAREGIVER } from '../../util/constants';

import css from './ListingSummary.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 16;

const ListingSummaryComponent = props => {
  const {
    listing,
    currentUserListing,
    params,
    intl,
    onContactUser,
    isOwnListing,
    onOpenBookingModal,
  } = props;

  const { publicData, geolocation, title } = listing.attributes;
  const { author } = listing;
  const { minPrice, maxPrice, availabilityPlan, location } = publicData;

  const currentUserGeolocation = currentUserListing?.attributes?.geolocation;

  const userType = author?.attributes?.profile?.metadata?.userType;

  const displayName = userDisplayNameAsString(author);

  const richName = (
    <span className={userType === CAREGIVER ? css.name : css.title}>
      {richText(userType === CAREGIVER ? displayName : title, {
        longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
        longWordClass: css.longWord,
      })}
    </span>
  );

  const { formattedMinPrice, priceTitle } = formatPrice([minPrice, maxPrice], intl);

  const distanceFromLocation =
    geolocation && currentUserGeolocation
      ? calculateDistanceBetweenOrigins(currentUserGeolocation, geolocation)
      : null;

  return (
    <div className={css.root}>
      <div className={css.user}>
        <div className={css.userDisplay}>
          <Avatar
            className={css.avatar}
            renderSizes="(max-width: 767px) 96px, 240px"
            user={author}
            initialsClassName={css.avatarInitials}
            disableProfileLink
          />
        </div>
        <div className={css.topInfo} style={{ flexDirection: userType !== CAREGIVER && 'row' }}>
          <div style={{ width: '100%' }}>{richName}</div>
          <div className={css.priceValue} title={priceTitle}>
            {formattedMinPrice}-{maxPrice / 100}
            <span className={css.perUnit}>
              &nbsp;
              <FormattedMessage id={'CaregiverListingCard.perUnit'} />
            </span>
          </div>
          <div style={{ color: userType !== CAREGIVER && 'var(--marketplaceColor)' }}>
            <h3 className={css.location}>{location.city}</h3>
            <h3 className={css.location}>
              <FormattedMessage
                id={'CaregiverListingCard.distance'}
                values={{ distance: distanceFromLocation }}
              />
            </h3>
          </div>
        </div>
      </div>
      {!isOwnListing ? (
        <div className={css.buttonContainer}>
          <Button className={css.button} onClick={onOpenBookingModal}>
            <FormattedMessage id="ListingSummary.bookNow" />
          </Button>
          <Button className={css.secondaryButton} onClick={onContactUser}>
            <FormattedMessage id="ListingSummary.message" />
          </Button>
        </div>
      ) : null}
    </div>
  );
};

const ListingSummary = compose(injectIntl)(ListingSummaryComponent);

export default ListingSummary;
