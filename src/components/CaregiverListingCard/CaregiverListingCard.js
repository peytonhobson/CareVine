import React from 'react';

import { array, string, func } from 'prop-types';
import classNames from 'classnames';
import { types } from 'sharetribe-flex-sdk';
const { Money } = types;
import { Card as MuiCard } from '@mui/material';
import { makeStyles } from '@material-ui/styles';
import { styled } from '@material-ui/styles';

import { FormattedMessage, intlShape, injectIntl } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { ensureListing, userDisplayNameAsString } from '../../util/data';
import { richText } from '../../util/richText';
import { createSlug } from '../../util/urlHelpers';
import config from '../../config';
import {
  NamedLink,
  Avatar,
  Button,
  IconCheckmark,
  InfoTooltip,
  IconSearch,
  IconCertification,
  IconCar,
  IconHouse,
  IconCalendar,
  AvailabilityPreview,
  IconCareVineGold,
} from '..';
import { findOptionsForSelectFilter } from '../../util/search';
import { calculateDistanceBetweenOrigins } from '../../util/maps';
import { formatPrice } from '../../util/data';

import css from './CaregiverListingCard.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 10;

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

export const CaregiverListingCardComponent = props => {
  const { className, rootClassName, intl, listing, filtersConfig, currentUserListing } = props;

  const currentListing = ensureListing(listing);
  const id = currentListing.id.uuid;
  const currentAuthor = currentListing?.author;
  const authorMetadata = currentAuthor?.attributes?.profile?.metadata;
  const userDisplayName = userDisplayNameAsString(currentAuthor) + '.';
  const { publicData, geolocation: otherGeolocation } = currentListing?.attributes;
  const {
    location = {},
    careTypes: providedServices,
    availabilityPlan,
    additionalInfo,
    certificationsAndTraining,
    experienceLevel,
    minPrice = 0,
    maxPrice = 0,
    scheduleTypes,
  } = publicData;
  const slug = createSlug(userDisplayName);

  const backgroundCheckSubscription = authorMetadata?.backgroundCheckSubscription;

  const hasPremiumSubscription =
    backgroundCheckSubscription?.status === 'active' &&
    backgroundCheckSubscription?.type === 'vine';

  const backgroundCheckApprovedDate = authorMetadata?.backgroundCheckApproved?.date;

  const classes = classNames(rootClassName || css.root, className);

  const geolocation = currentUserListing?.attributes?.geolocation;

  const distanceFromLocation =
    geolocation && otherGeolocation
      ? calculateDistanceBetweenOrigins(geolocation, otherGeolocation)
      : null;

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

  const premiumIconTitle = (
    <p>
      <FormattedMessage id="CaregiverListingCard.continuouslyVerified" />
    </p>
  );
  const additionalServices = providedServices
    .filter((service, index) => index > 1)
    .map(service => servicesMap.get(service));
  const additionalServicesText = (
    <ul>
      {additionalServices?.map(service => (
        <li>{service && service.split('/')[0]}</li>
      ))}
    </ul>
  );
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
    // height: '28rem',
    marginBottom: '3rem',
    marginInline: isMobile ? 0 : '1.5rem',
    '&.MuiPaper-rounded': {
      borderRadius: '3rem',
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
  const cardClasses = hasPremiumSubscription ? useStyles(borderProps) : null;

  const Wrapper = ({ children }) => {
    return isMobile ? (
      <div className={classes}>{children}</div>
    ) : (
      <NamedLink className={classes} name="ListingPage" params={{ id, slug }}>
        {children}
      </NamedLink>
    );
  };

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
            {!isMobile && <AvailabilityPreview entries={availabilityPlan?.entries} />}
          </div>
        </div>
        <div className={css.mainInfo}>
          {isMobile && <AvailabilityPreview entries={availabilityPlan?.entries} />}
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
                  icon={<IconCar height={isMobile ? '15' : null} width={isMobile ? '16' : null} />}
                  styles={{ paddingInline: '0' }}
                />
              </div>
            )}
            <div className={css.badge}>
              <InfoTooltip
                title={experienceLevelTitle}
                icon={<div className={css.yearsExperience}>{experienceLevel}</div>}
                styles={{ paddingInline: '0' }}
              />
            </div>
            {scheduleTypes && scheduleTypes.includes('liveIn') && (
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
            {scheduleTypes && scheduleTypes.includes('oneTime') && (
              <div className={css.badge}>
                <InfoTooltip
                  title={
                    <p>
                      <FormattedMessage id="CaregiverListingCard.oneTimeCare" />
                    </p>
                  }
                  icon={
                    <IconCalendar height={isMobile ? '15' : null} width={isMobile ? '16' : null} />
                  }
                  styles={{ paddingInline: '0' }}
                />
              </div>
            )}
          </div>
          <div className={css.providedServices}>
            <div className={css.serviceCardList}>
              {providedServices?.slice(0, 2).map(service => (
                <p className={css.serviceCardItem}>{servicesMap.get(service).split('/')[0]}</p>
              ))}
              {providedServices?.length > 3 && (
                <InfoTooltip
                  styles={{ paddingInline: 0, color: 'var(--matterColor)' }}
                  title={
                    <ul>
                      {providedServices?.slice(3, providedServices?.length).map(service => (
                        <li>{servicesMap.get(service).split('/')[0]}</li>
                      ))}
                    </ul>
                  }
                  icon={
                    <p className={css.serviceCardItem}>
                      <FormattedMessage
                        id="CaregiverListingCard.additionalCareTypes"
                        values={{ count: providedServices.length - 3 }}
                      />
                    </p>
                  }
                />
              )}
            </div>
          </div>
        </div>
      </Wrapper>
      <NamedLink className={css.buttonContainer} name="ListingPage" params={{ id, slug }}>
        <Button className={css.messageButton}>
          <FormattedMessage id="CaregiverListingCard.viewProfile" />
        </Button>
      </NamedLink>
    </Card>
  );
};

CaregiverListingCardComponent.defaultProps = {
  className: null,
  rootClassName: null,
  filtersConfig: config.custom.filters,
};

CaregiverListingCardComponent.propTypes = {
  className: string,
  rootClassName: string,
  filtersConfig: array,
  intl: intlShape.isRequired,
  listing: propTypes.listing.isRequired,
};

export default injectIntl(CaregiverListingCardComponent);
