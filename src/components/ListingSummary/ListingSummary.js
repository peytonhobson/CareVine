import React from 'react';

import {
  Avatar,
  AvailabilityPreview,
  Button,
  SecondaryButton,
  IconCareVineGold,
  InfoTooltip,
} from '..';
import { formatPrice, userDisplayNameAsString } from '../../util/data';
import { richText } from '../../util/richText';
import { compose } from 'redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { calculateDistanceBetweenOrigins } from '../../util/maps';
import { CAREGIVER, EMPLOYER } from '../../util/constants';

import css from './ListingSummary.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 16;

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

const ListingSummaryComponent = props => {
  const {
    listing,
    currentUserListing,
    params,
    intl,
    onContactUser,
    isOwnListing,
    onOpenBookingModal,
    onBookNow,
  } = props;

  const { publicData, geolocation, title } = listing.attributes;
  const { author } = listing;
  const { minPrice, maxPrice, availabilityPlan, location } = publicData;
  const authorMetadata = author?.attributes?.profile?.metadata;

  console.log(authorMetadata);

  const backgroundCheckSubscription = authorMetadata?.backgroundCheckSubscription;

  const hasPremiumSubscription =
    backgroundCheckSubscription?.status === 'active' &&
    backgroundCheckSubscription?.type === 'vine';

  const currentUserGeolocation = currentUserListing?.attributes?.geolocation;

  const userType = author?.attributes?.profile?.metadata?.userType;

  const displayName = userDisplayNameAsString(author);

  const richName = (
    <span
      className={userType === CAREGIVER ? css.name : css.title}
      style={{ width: userType === CAREGIVER && isMobile && 'auto !important' }}
    >
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

  const handleBook = () => {
    const initialValues = {
      listing,
      bookingStartTime: new Date().getTime(),
      bookingEndTime: new Date().getTime() + 360000000,
    };

    onBookNow(initialValues);
  };

  const backgroundCheckTitle = (
    <p>
      <FormattedMessage id="CaregiverListingCard.continuouslyVerified" />
    </p>
  );

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
          {isMobile ? (
            userType === EMPLOYER ? (
              <div className={css.priceValue} title={priceTitle}>
                {formattedMinPrice}-{maxPrice / 100}
                <span className={css.perUnit}>
                  &nbsp;
                  <FormattedMessage id={'CaregiverListingCard.perUnit'} />
                </span>
              </div>
            ) : (
              <div className={css.nameContainer} style={{ marginTop: '0.5rem' }}>
                {richName}
                {hasPremiumSubscription && (
                  <div className={css.goldBadge}>
                    <InfoTooltip
                      title={backgroundCheckTitle}
                      icon={
                        <IconCareVineGold
                          height={isMobile ? '1.2em' : '1.6em'}
                          width={isMobile ? '1.4em' : '2em'}
                        />
                      }
                      styles={{ paddingInline: '0' }}
                    />
                  </div>
                )}
              </div>
            )
          ) : null}
        </div>
        <div
          className={css.topInfo}
          style={{
            flexDirection: userType !== CAREGIVER && 'row',
            alignItems: userType === CAREGIVER ? 'flex-start' : 'center',
            justifyContent: userType === CAREGIVER && isMobile && 'center',
            marginTop: userType === CAREGIVER && '0',
          }}
        >
          {isMobile && userType === CAREGIVER ? null : (
            <div className={css.nameContainer}>
              {richName}
              {hasPremiumSubscription && (
                <div className={css.goldBadge}>
                  <InfoTooltip
                    title={backgroundCheckTitle}
                    icon={
                      <IconCareVineGold
                        height={isMobile ? '15' : '1.6em'}
                        width={isMobile ? '16' : '2em'}
                      />
                    }
                    styles={{ paddingInline: '0' }}
                  />
                </div>
              )}
            </div>
          )}
          {(!isMobile || userType === CAREGIVER) && (
            <div
              className={css.priceValue}
              title={priceTitle}
              style={{ marginTop: userType === CAREGIVER && '0' }}
            >
              {formattedMinPrice}-{maxPrice / 100}
              <span className={css.perUnit}>
                &nbsp;
                <FormattedMessage id={'CaregiverListingCard.perUnit'} />
              </span>
            </div>
          )}
          <div
            className={css.locations}
            style={{ color: userType !== CAREGIVER && 'var(--marketplaceColor)' }}
          >
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
          {/* TODO: Add booking functionality back in when complete */}
          {/* {userType === CAREGIVER && (
            <Button className={css.button} onClick={onOpenBookingModal}>
              <FormattedMessage id="ListingSummary.bookNow" />
            </Button>
          )} */}
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
