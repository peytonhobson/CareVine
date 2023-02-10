import React, { Fragment } from 'react';
import { array, string, func } from 'prop-types';
import { FormattedMessage, intlShape, injectIntl } from '../../util/reactIntl';
import classNames from 'classnames';
import { lazyLoadWithDimensions } from '../../util/contextHelpers';
import { LINE_ITEM_DAY, LINE_ITEM_NIGHT, propTypes } from '../../util/types';
import { formatMoneyInteger } from '../../util/currency';
import { ensureListing, userDisplayNameAsString, cutTextToPreview } from '../../util/data';
import { richText } from '../../util/richText';
import { createSlug } from '../../util/urlHelpers';
import config from '../../config';
import {
  NamedLink,
  ResponsiveImage,
  Avatar,
  Button,
  IconCheckmark,
  InfoTooltip,
  IconSearch,
  IconCertification,
  IconCar,
} from '..';
import { types } from 'sharetribe-flex-sdk';
const { Money, User } = types;
import { findOptionsForSelectFilter } from '../../util/search';
import { calculateDistanceBetweenOrigins } from '../../util/maps';

import css from './CaregiverListingCard.module.css';
import { info } from 'autoprefixer';

const MIN_LENGTH_FOR_LONG_WORDS = 10;
const weekdayAbbreviations = [
  { key: 'sun', label: 'Su' },
  { key: 'mon', label: 'M' },
  { key: 'tue', label: 'T' },
  { key: 'wed', label: 'W' },
  { key: 'thu', label: 'Th' },
  { key: 'fri', label: 'F' },
  { key: 'sat', label: 'Sa' },
];

const priceData = (rates, intl) => {
  const minPriceMoney = new Money(rates[0], 'USD');
  const maxPriceMoney = new Money(rates[1], 'USD');

  if (minPriceMoney && maxPriceMoney) {
    const formattedMinPrice = formatMoneyInteger(intl, minPriceMoney);
    const formattedMaxPrice = formatMoneyInteger(intl, maxPriceMoney);

    return {
      formattedMinPrice,
      formattedMaxPrice,
      priceTitle: formattedMinPrice + ' - ' + formattedMaxPrice,
    };
  } else if (maxPriceMoney && minPriceMoney) {
    return {
      formattedMinPrice: intl.formatMessage(
        { id: 'CaregiverListingCard.unsupportedPrice' },
        { currency: minPriceMoney.currency }
      ),
      formattedMaxPrice: intl.formatMessage(
        { id: 'CaregiverListingCard.unsupportedPrice' },
        { currency: maxPriceMoney.currency }
      ),
      priceTitle: intl.formatMessage(
        { id: 'CaregiverListingCard.unsupportedPriceTitle' },
        { currency: maxPriceMoney.currency }
      ),
    };
  }
  return {};
};

// const LazyImage = lazyLoadWithDimensions(ListingImage, { loadAfterInitialRendering: 3000 });

export const CaregiverListingCardComponent = props => {
  const {
    className,
    rootClassName,
    intl,
    listing,
    renderSizes,
    filtersConfig,
    setActiveListing,
    currentUser,
    onContactUser,
    currentUserListing,
  } = props;

  const currentListing = ensureListing(listing);
  const id = currentListing.id.uuid;
  const currentAuthor = currentListing.author;
  const authorMetadata = currentAuthor.attributes.profile.metadata;
  const userDisplayName = userDisplayNameAsString(currentAuthor) + '.';
  const { publicData, description, geolocation: otherGeolocation } = currentListing.attributes;
  const {
    location = {},
    careTypes: providedServices,
    availabilityPlan,
    additionalInfo,
    certificationsAndTraining,
    experienceLevel,
    minPrice = 0,
    maxPrice = 0,
  } = publicData;
  const slug = createSlug(userDisplayName);

  const backgroundCheckSubscription = authorMetadata && authorMetadata.backgroundCheckSubscription;

  const hasPremiumSubscription =
    backgroundCheckSubscription &&
    backgroundCheckSubscription.status === 'active' &&
    backgroundCheckSubscription.type === 'vine';

  const backgroundCheckApprovedDate =
    authorMetadata &&
    authorMetadata.backgroundCheckApproved &&
    authorMetadata.backgroundCheckApproved.date;

  const classes = classNames(
    rootClassName || css.root,
    className,
    hasPremiumSubscription && css.premium
  );

  const geolocation = currentUserListing && currentUserListing.attributes.geolocation;

  const distanceFromLocation =
    geolocation && otherGeolocation
      ? calculateDistanceBetweenOrigins(geolocation, otherGeolocation)
      : null;

  const { formattedMinPrice, formattedMaxPrice, priceTitle } = priceData(
    [minPrice, maxPrice],
    intl
  );

  const servicesMap = new Map();
  findOptionsForSelectFilter('careTypes', filtersConfig).forEach(option =>
    servicesMap.set(option.key, option.label)
  );
  const certificationsAndTrainingLabels = findOptionsForSelectFilter(
    'certificationsAndTraining',
    filtersConfig
  )
    .filter(option => certificationsAndTraining && certificationsAndTraining.includes(option.key))
    .map(option => option.label);
  const additionalInfoLabels = findOptionsForSelectFilter('additionalInfo', filtersConfig)
    .filter(option => additionalInfo && additionalInfo.includes(option.key))
    .map(option => option.label);

  const avatarComponent = (
    <Avatar
      className={css.avatar}
      renderSizes="(max-width: 767px) 96px, 240px"
      user={currentAuthor}
      initialsClassName={css.avatarInitials}
      disableProfileLink
    />
  );

  const daysInSchedule = weekdayAbbreviations.filter(
    day => availabilityPlan && availabilityPlan.entries.find(entry => entry.dayOfWeek === day.key)
  );

  const premiumIconTitle = <p>This caregiver is continuously verified by CareVine.</p>;
  const additionalServices = providedServices
    .filter((service, index) => index > 1)
    .map(service => servicesMap.get(service));
  const additionalServicesText = (
    <ul>
      {additionalServices.map(service => (
        <li>{service}</li>
      ))}
    </ul>
  );
  const backgroundCheckTitle =
    backgroundCheckSubscription && backgroundCheckSubscription.type === 'vine' ? (
      <p>This caregiver is continuously verified by CareVine.</p>
    ) : (
      <p>
        This caregiver was last background checked on{' '}
        {backgroundCheckApprovedDate && new Date(backgroundCheckApprovedDate).toLocaleDateString()}
      </p>
    );
  const hasCarTitle = <p>This caregiver has a car that can be used for transportation.</p>;
  const experienceLevelTitle = <p>This caregiver has {experienceLevel} years of experience.</p>;

  const certificationsAndTrainingTitle = (
    <div className={css.certAndTrainWrapper}>
      <h3 className={css.certAndTrainTitle}>Certifications and Training</h3>
      <p className={css.note}>*Not verified by CareVine</p>
      <ul className={css.certAndTrainList}>
        {certificationsAndTrainingLabels.map(value => (
          <li>{value}</li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className={css.container}>
      <NamedLink className={classes} name="ListingPage" params={{ id, slug }}>
        <div className={css.user}>
          {avatarComponent}
          <div className={css.title}>
            {richText(userDisplayName, {
              longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
              longWordClass: css.longWord,
            })}
            {hasPremiumSubscription && (
              <InfoTooltip
                title={premiumIconTitle}
                icon={<IconCheckmark className={css.premiumIcon} />}
              />
            )}
          </div>
        </div>
        <div className={css.mainInfo}>
          <div className={css.topInfo}>
            <div>
              <div className={css.priceValue} title={priceTitle}>
                {formattedMinPrice}-{maxPrice / 100}
                <span className={css.perUnit}>
                  &nbsp;
                  <FormattedMessage id={'CaregiverListingCard.perUnit'} />
                </span>
              </div>
              <div className={css.location}>
                {location.city} - {distanceFromLocation} miles away
              </div>
            </div>
            <Button
              className={css.messageButton}
              onClick={() => onContactUser(currentAuthor, currentListing.id)}
            >
              Message
            </Button>
          </div>
          <div className={css.schedule}>
            <span className={css.bold}>Schedule: </span>
            {weekdayAbbreviations.map(day => {
              const dayInSchedule = daysInSchedule.find(
                dayInSchedule => dayInSchedule.key === day.key
              );
              const dayClasses = classNames(css.dayBox, dayInSchedule && css.active);
              return <div className={dayClasses}>{day.label}</div>;
            })}
          </div>
          <div className={css.badges}>
            <div className={css.badge}>
              <InfoTooltip title={backgroundCheckTitle} icon={<IconSearch />} />
            </div>
            {certificationsAndTraining && (
              <div className={css.badge}>
                <InfoTooltip title={certificationsAndTrainingTitle} icon={<IconCertification />} />
              </div>
            )}
            {additionalInfo && additionalInfo.includes('hasCar') && (
              <div className={css.badge}>
                <InfoTooltip title={hasCarTitle} icon={<IconCar />} />
              </div>
            )}
            <div className={css.badge}>
              <InfoTooltip
                title={experienceLevelTitle}
                icon={<div className={css.yearsExperience}>{experienceLevel}</div>}
              />
            </div>
          </div>

          <div className={css.providedServices}>
            <span className={css.bold}>Provides services for: </span>
            <div className={css.serviceCardList}>
              {providedServices.slice(0, 2).map(service => (
                <p className={css.serviceCardItem}>{servicesMap.get(service)}</p>
              ))}
              {additionalServices && additionalServices.length > 0 && (
                <InfoTooltip
                  styles={{ paddingInline: 0, color: 'var(--matterColor)' }}
                  title={additionalServicesText}
                  icon={<p className={css.serviceCardItem}>+{additionalServices.length} more</p>}
                />
              )}
            </div>
          </div>
          <div className={css.descriptionBox}></div>
        </div>
      </NamedLink>
    </div>
  );
};

CaregiverListingCardComponent.defaultProps = {
  className: null,
  rootClassName: null,
  renderSizes: null,
  filtersConfig: config.custom.filters,
  setActiveListing: () => null,
};

CaregiverListingCardComponent.propTypes = {
  className: string,
  rootClassName: string,
  filtersConfig: array,
  intl: intlShape.isRequired,
  listing: propTypes.listing.isRequired,

  // Responsive image sizes hint
  renderSizes: string,

  setActiveListing: func,
};

export default injectIntl(CaregiverListingCardComponent);
