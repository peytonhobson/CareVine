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

export const EmployerListingCardMobileComponent = props => {
  const {
    className,
    rootClassName,
    intl,
    listing,
    filtersConfig,
    currentUserListing,
    onManageDisableScrolling,
    disableProfileLink,
    origin,
  } = props;

  const [isOneTimeScheduleModalOpen, setIsOneTimeScheduleModalOpen] = useState(false);

  const currentListing = ensureListing(listing);
  const id = currentListing?.id?.uuid;
  const currentAuthor = currentListing?.author;
  const userDisplayName = userDisplayNameAsString(currentAuthor) + '.';
  const { publicData, title, geolocation: otherGeolocation } = currentListing?.attributes;
  const {
    location = {},
    careTypes,
    careSchedule,
    minPrice = 0,
    maxPrice = 0,
    scheduleType,
  } = publicData;
  const slug = createSlug(userDisplayName);

  const classes = classNames(rootClassName || css.root, className);

  const distanceFromLocation =
    origin && otherGeolocation ? calculateDistanceBetweenOrigins(origin, otherGeolocation) : null;

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

  const careTypesLabels = findOptionsForSelectFilter('careTypes', filtersConfig)
    .filter(option => careTypes.includes(option.key))
    .map(option => option.label);
  const additionalCareTypesText = (
    <ul>
      {careTypesLabels.map((careType, index) => (
        <li>{index > 2 && careType && careType.split('/')[0]}</li>
      ))}
    </ul>
  );

  const scheduleTypeOptions = findOptionsForSelectFilter('scheduleType', filtersConfig) || [];
  const scheduleTypeLabel = scheduleTypeOptions?.find(option => option.key === scheduleType)?.label;

  const Card = styled(props => <MuiCard {...props} />)(({ theme }) => ({
    width: '100%',
    maxWidth: '30rem',
    height: 'auto',
    marginBottom: '1.5rem',
    '&.MuiPaper-rounded': {
      borderRadius: 'var(--borderRadius)',
    },
    '&.MuiCard-root': {
      border: '1px solid var(--marketplaceColor)',
    },
  }));

  const selectedSessions = careSchedule?.selectedSessions;
  const entries = careSchedule?.entries;
  const availableDays = careSchedule?.availableDays;
  const isLiveIn = careSchedule?.liveIn;

  const originString = `${origin?.lat}%2C${origin?.lng}`;

  return (
    <>
      <Card>
        <div className={classes}>
          <div className={css.mobileTitleContainer}>
            <div className={css.user}>
              {avatarComponent}
              <div className={css.userTitle}>
                {richText(userDisplayName, {
                  longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
                  longWordClass: css.longWord,
                })}
              </div>
            </div>
            <div className={css.mobileTitleTextContainer}>
              <div className={css.title}>{title}</div>
              <h3 className={css.location}>{location.city}</h3>
              <h3 className={css.location}>{distanceFromLocation} miles away</h3>
            </div>
          </div>
          <div className={css.topRow}>
            <div className={css.topInfo}>
              <h3 className={css.scheduleType}>
                <FormattedMessage
                  id={'EmployerListingCard.scheduleType'}
                  values={{ type: `${scheduleTypeLabel}${isLiveIn ? ' (Live-In)' : ''}` }}
                />
              </h3>
              {scheduleType === '24hour' || scheduleType === 'repeat' ? (
                <AvailabilityPreview entries={entries} availableDays={availableDays} />
              ) : (
                <Button
                  onClick={e => {
                    e.preventDefault();
                    setIsOneTimeScheduleModalOpen(true);
                  }}
                  className={css.viewScheduleButton}
                >
                  <FormattedMessage id={'EmployerListingCard.viewSchedule'} />
                </Button>
              )}
            </div>
          </div>
          <div className={css.providedServices}>
            <div className={css.serviceCardList}>
              {careTypesLabels.slice(0, 2).map(careType => (
                <p className={css.serviceCardItem}>{careType?.split('/')[0]}</p>
              ))}
              {careTypes?.length > 3 && (
                <InfoTooltip
                  styles={{ paddingInline: 0, color: 'var(--matterColor)', marginLeft: '0.7rem' }}
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
        </div>
        <NamedLink
          className={css.buttonContainer}
          name="ListingPage"
          params={{ id, slug, search: origin ? `?origin=${originString}` : '' }}
          style={{ pointerEvents: disableProfileLink && 'none' }}
          to={{ state: { from: 'SearchPage' } }}
        >
          <div className={css.priceValue} title={priceTitle}>
            {formattedMinPrice}-{maxPrice / 100}
            <span className={css.perUnit}>
              &nbsp;
              <FormattedMessage id={'EmployerListingCard.perUnit'} />
            </span>
          </div>
          <div className={css.messageButton}>
            <FormattedMessage id={'EmployerListingCard.viewProfile'} />
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
          <ViewCalendar selectedSessions={selectedSessions} planType={scheduleType} />
        </Modal>
      )}
    </>
  );
};

EmployerListingCardMobileComponent.defaultProps = {
  className: null,
  rootClassName: null,
  renderSizes: null,
  filtersConfig: config.custom.filters,
  setActiveListing: () => null,
};

EmployerListingCardMobileComponent.propTypes = {
  className: string,
  rootClassName: string,
  filtersConfig: array,
  intl: intlShape.isRequired,
  listing: propTypes.listing.isRequired,

  // Responsive image sizes hint
  renderSizes: string,

  setActiveListing: func,
};

export default injectIntl(EmployerListingCardMobileComponent);
