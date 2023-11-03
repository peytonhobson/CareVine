import React from 'react';

import classNames from 'classnames';
import { Card as MuiCard } from '@mui/material';
import { makeStyles } from '@material-ui/styles';
import { styled } from '@material-ui/styles';

import { FormattedMessage, injectIntl } from '../../util/reactIntl';
import { ensureListing, userDisplayNameAsString } from '../../util/data';
import { richText } from '../../util/richText';
import { createSlug } from '../../util/urlHelpers';
import config from '../../config';
import {
  NamedLink,
  Avatar,
  InfoTooltip,
  IconCertification,
  IconCar,
  IconHouse,
  IconCareVineGold,
  ReviewRating,
} from '..';
import { findOptionsForSelectFilter } from '../../util/search';
import { calculateDistanceBetweenOrigins } from '../../util/maps';
import { formatPrice, calculateAverageRating } from '../../util/data';
import { SUBSCRIPTION_ACTIVE_TYPES } from '../../util/constants';

import css from './CaregiverListingCard.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 10;

export const CaregiverListingCardComponent = props => {
  const {
    className,
    rootClassName,
    intl,
    listing,
    filtersConfig,
    disableProfileLink,
    isMobile,
    origin,
  } = props;

  const currentListing = ensureListing(listing);
  const id = currentListing.id.uuid;
  const currentAuthor = currentListing?.author;
  const authorMetadata = currentAuthor?.attributes?.profile?.metadata;
  const userDisplayName = userDisplayNameAsString(currentAuthor) + '.';
  const { publicData, geolocation: otherGeolocation } = currentListing?.attributes;
  const {
    location = {},
    careTypes: providedServices,
    additionalInfo,
    certificationsAndTraining,
    experienceLevel,
    minPrice = 0,
    maxPrice = 0,
    openToLiveIn,
  } = publicData;
  const slug = createSlug(userDisplayName);

  const backgroundCheckSubscription = authorMetadata?.backgroundCheckSubscription;

  const hasPremiumSubscription =
    SUBSCRIPTION_ACTIVE_TYPES.includes(backgroundCheckSubscription?.status) &&
    backgroundCheckSubscription?.type === 'vine';

  const classes = classNames(rootClassName || css.root, className);

  const distanceFromLocation =
    origin && otherGeolocation ? calculateDistanceBetweenOrigins(origin, otherGeolocation) : null;

  const { formattedMinPrice, priceTitle } = formatPrice([minPrice, maxPrice], intl);

  const servicesMap = new Map();
  findOptionsForSelectFilter('careTypes', filtersConfig).forEach(option =>
    servicesMap.set(option.key, option.label)
  );
  const certificationsAndTrainingLabels = findOptionsForSelectFilter(
    'certificationsAndTraining',
    filtersConfig
  )
    .filter(option => certificationsAndTraining?.includes(option.key))
    .map(option => option.label);

  const avatarClasses = classNames(css.avatar, hasPremiumSubscription && css.premium);

  const avatarComponent = (
    <Avatar
      className={avatarClasses}
      renderSizes="(max-width: 767px) 6rem, 15rem"
      user={currentAuthor}
      initialsClassName={css.avatarInitials}
      disableProfileLink
    />
  );

  const additionalServices = providedServices
    .filter((service, index) => index > 1)
    .map(service => servicesMap.get(service));
  const backgroundCheckTitle = (
    <p>
      <FormattedMessage id="CaregiverListingCard.continuouslyVerified" />
    </p>
  );

  const hasCarTitle = (
    <p>
      <FormattedMessage id="CaregiverListingCard.hasCarTitle" />
    </p>
  );
  const experienceLevelTitle = (
    <p>
      <FormattedMessage
        id="CaregiverListingCard.experienceLevelTitle"
        values={{ experienceLevel }}
      />
    </p>
  );

  const certificationsAndTrainingTitle = (
    <div className={css.certAndTrainWrapper}>
      <h3 className={css.certAndTrainTitle}>
        <FormattedMessage id="CaregiverListingCard.certificationsAndTraining" />
      </h3>
      <p className={css.note}>
        <FormattedMessage id="CaregiverListingCard.notVerified" />
      </p>
      <ul className={css.certAndTrainList}>
        {certificationsAndTrainingLabels?.map(value => (
          <li>{value}</li>
        ))}
      </ul>
    </div>
  );

  const Card = styled(props => <MuiCard {...props} />)(({ theme }) => ({
    width: isMobile ? '100%' : '30rem',
    maxWidth: isMobile && '30rem',
    // height: '28rem',
    marginBottom: '3rem',
    marginInline: isMobile ? 0 : '1.5rem',
    '&.MuiPaper-rounded': {
      borderRadius: 'var(--borderRadius)',
    },
  }));

  const useStyles = makeStyles({
    root: props => ({
      border: props.border,
    }),
  });
  const borderProps = {
    border: '3px solid var(--marketplaceColor)',
  };
  const cardClasses = useStyles(borderProps);

  const originString = `${origin?.lat}%2C${origin?.lng}`;

  const Wrapper = ({ children }) => {
    return isMobile ? (
      <div className={classes}>{children}</div>
    ) : (
      <NamedLink
        className={classes}
        name="ListingPage"
        params={{ id, slug, search: origin ? `?origin=${originString}` : '' }}
        style={{ pointerEvents: disableProfileLink && 'none' }}
        to={{ state: { from: 'SearchPage' } }}
      >
        {children}
      </NamedLink>
    );
  };

  const reviews = currentListing?.reviews;
  const reviewsCount = reviews?.length ?? 0;
  const averageRating = calculateAverageRating(reviews);

  return (
    <Card className={cardClasses?.root}>
      <Wrapper>
        <div className={css.topRow}>
          <div className={css.user}>
            {avatarComponent}
            <div className={css.title}>
              {richText(userDisplayName, {
                longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
                longWordClass: css.longWord,
              })}
            </div>
          </div>

          <div className={css.topInfo}>
            <div className={css.priceValue} title={priceTitle}>
              {formattedMinPrice}-{maxPrice / 100}
              <span className={css.perUnit}>
                &nbsp;
                <FormattedMessage id={'CaregiverListingCard.perUnit'} />
              </span>
            </div>
            <div>
              <h3 className={css.location}>{location.city}</h3>
              <h3 className={css.location}>
                <FormattedMessage
                  id={'CaregiverListingCard.distance'}
                  values={{ distance: distanceFromLocation }}
                />
              </h3>
            </div>
            {!isMobile && reviewsCount ? (
              <div className={css.ratingsContainer}>
                <h3 className={css.reviewsHeading}>Reviews ({reviewsCount})</h3>
                <ReviewRating rating={averageRating} reviewStarClassName={css.reviewStar} />
              </div>
            ) : null}
          </div>
        </div>
        <div className={css.mainInfo}>
          <div className={css.mobileMidContainer}>
            <div className={css.badges}>
              {hasPremiumSubscription && (
                <div className={css.goldBadge}>
                  <InfoTooltip
                    title={backgroundCheckTitle}
                    icon={
                      <IconCareVineGold
                        height={isMobile ? '1.3em' : '1.6em'}
                        width={isMobile ? '1.3em' : '1.8em'}
                      />
                    }
                    styles={{ paddingInline: '0' }}
                  />
                </div>
              )}
              {certificationsAndTraining && (
                <div className={css.badge}>
                  <InfoTooltip
                    title={certificationsAndTrainingTitle}
                    icon={
                      <IconCertification
                        height={isMobile ? '15' : null}
                        width={isMobile ? '16' : null}
                      />
                    }
                    styles={{ paddingInline: '0' }}
                  />
                </div>
              )}
              {additionalInfo && additionalInfo.includes('hasCar') && (
                <div className={css.badge}>
                  <InfoTooltip
                    title={hasCarTitle}
                    icon={
                      <IconCar height={isMobile ? '15' : null} width={isMobile ? '16' : null} />
                    }
                    styles={{ paddingInline: '0' }}
                  />
                </div>
              )}
              {experienceLevel !== '0' && (
                <div className={css.badge}>
                  <InfoTooltip
                    title={experienceLevelTitle}
                    icon={<div className={css.yearsExperience}>{experienceLevel}</div>}
                    styles={{ paddingInline: '0' }}
                  />
                </div>
              )}
              {openToLiveIn && (
                <div className={css.badge}>
                  <InfoTooltip
                    title={
                      <p>
                        <FormattedMessage id="CaregiverListingCard.liveInCare" />
                      </p>
                    }
                    icon={
                      <IconHouse height={isMobile ? '15' : null} width={isMobile ? '16' : null} />
                    }
                    styles={{ paddingInline: '0' }}
                  />
                </div>
              )}
            </div>
            {isMobile && reviewsCount ? (
              <div className={css.ratingsContainer}>
                <h3 className={css.reviewsHeading}>Reviews ({reviewsCount})</h3>
                <ReviewRating rating={averageRating} reviewStarClassName={css.reviewStar} />
              </div>
            ) : null}
          </div>
          <div className={css.providedServices}>
            <div className={css.serviceCardList}>
              {providedServices?.slice(0, 2).map(service => (
                <p className={css.serviceCardItem}>{servicesMap.get(service).split('/')[0]}</p>
              ))}
              {providedServices?.length > 3 && (
                <InfoTooltip
                  styles={{ paddingInline: 0, color: 'var(--matterColor)', marginLeft: '0.7rem' }}
                  title={
                    <ul>
                      {providedServices?.slice(2, providedServices?.length).map(service => (
                        <li>{servicesMap.get(service).split('/')[0]}</li>
                      ))}
                    </ul>
                  }
                  icon={
                    <p className={css.serviceCardItem}>
                      <FormattedMessage
                        id="CaregiverListingCard.additionalCareTypes"
                        values={{ count: providedServices.length - 2 }}
                      />
                    </p>
                  }
                />
              )}
            </div>
          </div>
        </div>
      </Wrapper>
      <div className={css.buttonContainer}>
        <NamedLink
          className={css.messageButton}
          name="ListingPage"
          params={{ id, slug, search: `?origin=${originString}` }}
          style={{ pointerEvents: disableProfileLink && 'none' }}
          to={{ state: { from: 'SearchPage' } }}
        >
          <FormattedMessage id="CaregiverListingCard.viewProfile" />
        </NamedLink>
      </div>
    </Card>
  );
};

CaregiverListingCardComponent.defaultProps = {
  filtersConfig: config.custom.filters,
};

export default injectIntl(CaregiverListingCardComponent);
