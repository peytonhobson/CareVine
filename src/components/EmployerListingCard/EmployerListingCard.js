import React, { useState } from 'react';
import { array, string, func } from 'prop-types';
import classNames from 'classnames';
import { Card as MuiCard } from '@mui/material';
import { styled } from '@material-ui/styles';
import { types } from 'sharetribe-flex-sdk';
const { Money, User } = types;

import { FormattedMessage, intlShape, injectIntl } from '../../util/reactIntl';
import { formatMoneyInteger } from '../../util/currency';
import { ensureListing, userDisplayNameAsString } from '../../util/data';
import { richText } from '../../util/richText';
import { createSlug } from '../../util/urlHelpers';
import config from '../../config';
import {
  NamedLink,
  Avatar,
  Button,
  InfoTooltip,
  InlineTextButton,
  Modal,
  ViewCalendar,
  AvailabilityPreview,
} from '..';
import { findOptionsForSelectFilter } from '../../util/search';
import { calculateDistanceBetweenOrigins } from '../../util/maps';
import { propTypes } from '../../util/types';

import css from './EmployerListingCard.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 10;

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
        { id: 'EmployerListingCard.unsupportedPrice' },
        { currency: minPriceMoney.currency }
      ),
      formattedMaxPrice: intl.formatMessage(
        { id: 'EmployerListingCard.unsupportedPrice' },
        { currency: maxPriceMoney.currency }
      ),
      priceTitle: intl.formatMessage(
        { id: 'EmployerListingCard.unsupportedPriceTitle' },
        { currency: maxPriceMoney.currency }
      ),
    };
  }
  return {};
};

// const LazyImage = lazyLoadWithDimensions(ListingImage, { loadAfterInitialRendering: 3000 });

export const EmployerListingCardComponent = props => {
  const {
    className,
    rootClassName,
    intl,
    listing,
    filtersConfig,
    currentUserListing,
    onManageDisableScrolling,
  } = props;

  const [isOneTimeScheduleModalOpen, setIsOneTimeScheduleModalOpen] = useState(false);

  const currentListing = ensureListing(listing);
  const id = currentListing.id.uuid;
  const currentAuthor = currentListing.author;
  const userDisplayName = userDisplayNameAsString(currentAuthor) + '.';
  const { publicData, title, geolocation: otherGeolocation } = currentListing.attributes;
  const {
    location = {},
    careTypes,
    availabilityPlan,
    minPrice = 0,
    maxPrice = 0,
    scheduleType,
  } = publicData;
  const slug = createSlug(userDisplayName);

  const classes = classNames(rootClassName || css.root, className);

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

  const avatarComponent = (
    <Avatar
      className={css.avatar}
      renderSizes="(max-width: 767px) 96px, 240px"
      user={currentAuthor}
      initialsClassName={css.avatarInitials}
      disableProfileLink
    />
  );

  const currentAuthorName = currentAuthor && userDisplayNameAsString(currentAuthor);

  const careTypesLabels = findOptionsForSelectFilter('careTypes', filtersConfig).map(
    option => careTypes.includes(option.key) && option.label
  );
  const additionalCareTypesText = (
    <ul>
      {careTypesLabels.map((careType, index) => (
        <li>{index > 2 && careType && careType.split('/')[0]}</li>
      ))}
    </ul>
  );

  const scheduleTypeOptions = findOptionsForSelectFilter('scheduleType', filtersConfig) || [];
  const scheduleTypeLabel =
    scheduleType && scheduleTypeOptions.find(option => option.key === scheduleType).label;

  const Card = styled(props => <MuiCard {...props} />)(({ theme }) => ({
    width: '60rem',
    height: '19rem',
    marginBottom: '1.5rem',

    '&.MuiPaper-rounded': {
      borderRadius: '3rem',
    },
    '&.MuiCard-root': {
      border: '1px solid var(--marketplaceColor)',
    },
  }));

  const selectedSessions = availabilityPlan?.selectedSessions;
  const entries = availabilityPlan?.entries;
  const availableDays = availabilityPlan?.availableDays;
  const isLiveIn = availabilityPlan?.liveIn;

  return (
    <>
      <Card>
        <NamedLink className={classes} name="ListingPage" params={{ id, slug }}>
          <div className={css.topRow}>
            <div className={css.user}>
              {avatarComponent}
              <div className={css.userTitle}>
                {richText(userDisplayName, {
                  longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
                  longWordClass: css.longWord,
                })}
              </div>
            </div>

            <div className={css.topInfo}>
              <div>
                <div className={css.title}>{title}</div>
                <h3 className={css.location}>
                  <FormattedMessage
                    id="EmployerListingCard.location"
                    values={{ city: location.city, miles: distanceFromLocation }}
                  />
                </h3>
                <h3 className={css.scheduleType}>
                  <FormattedMessage
                    id={'EmployerListingCard.scheduleType'}
                    values={{ type: `${scheduleTypeLabel}${isLiveIn ? ' (Live-In)' : ''}` }}
                  />
                </h3>
                {scheduleType === '24hour' || scheduleType === 'repeat' ? (
                  <AvailabilityPreview entries={entries} availableDays={availableDays} />
                ) : (
                  <InlineTextButton
                    onClick={e => {
                      e.preventDefault();
                      setIsOneTimeScheduleModalOpen(true);
                    }}
                  >
                    <FormattedMessage id={'EmployerListingCard.viewSchedule'} />
                  </InlineTextButton>
                )}
              </div>
              <div>
                <div className={css.priceValue} title={priceTitle}>
                  {formattedMinPrice}-{maxPrice / 100}
                  <span className={css.perUnit}>
                    &nbsp;
                    <FormattedMessage id={'EmployerListingCard.perUnit'} />
                  </span>
                </div>
                <div className={css.buttonContainer}>
                  <Button className={css.messageButton}>
                    <FormattedMessage id={'EmployerListingCard.viewProfile'} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className={css.providedServices}>
            <div className={css.serviceCardList}>
              {careTypesLabels.slice(0, 3).map(careType => (
                <p className={css.serviceCardItem}>{careType && careType.split('/')[0]}</p>
              ))}
              {careTypes && careTypes.length > 2 && (
                <InfoTooltip
                  styles={{ paddingInline: 0, color: 'var(--matterColor)' }}
                  title={additionalCareTypesText}
                  icon={
                    <p className={css.serviceCardItem}>
                      <FormattedMessage
                        id={'EmployerListingCard.additionalCareTypes'}
                        values={{ count: careTypes.length - 3 }}
                      />
                    </p>
                  }
                />
              )}
            </div>
          </div>
        </NamedLink>
      </Card>
      {onManageDisableScrolling && (
        <Modal
          id="ViewOneTimeScheduleModal"
          isOpen={isOneTimeScheduleModalOpen}
          onClose={() => setIsOneTimeScheduleModalOpen(false)}
          onManageDisableScrolling={onManageDisableScrolling}
          containerClassName={css.modalContainer}
          usePortal
        >
          <h1 className={css.modalTitle}>
            <FormattedMessage
              id={'EmployerListingCard.viewScheduleTitle'}
              values={{ author: currentAuthorName }}
            />
          </h1>
          <ViewCalendar entries={selectedSessions} />
        </Modal>
      )}
    </>
  );
};

EmployerListingCardComponent.defaultProps = {
  className: null,
  rootClassName: null,
  renderSizes: null,
  filtersConfig: config.custom.filters,
  setActiveListing: () => null,
};

EmployerListingCardComponent.propTypes = {
  className: string,
  rootClassName: string,
  filtersConfig: array,
  intl: intlShape.isRequired,
  listing: propTypes.listing.isRequired,

  // Responsive image sizes hint
  renderSizes: string,

  setActiveListing: func,
};

export default injectIntl(EmployerListingCardComponent);
