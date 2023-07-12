import React from 'react';

import { Avatar, Button, IconCareVineGold, InfoTooltip, IconArrowHead } from '..';
import { formatPrice, userDisplayNameAsString } from '../../util/data';
import { richText } from '../../util/richText';
import { compose } from 'redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { calculateDistanceBetweenOrigins } from '../../util/maps';
import { CAREGIVER, EMPLOYER, SUBSCRIPTION_ACTIVE_TYPES } from '../../util/constants';
import SectionReviews from '../../containers/ListingPage/SectionReviews';
import BookingContainer from '../../containers/ListingPage/BookingContainer';
import { useMediaQuery } from '@mui/material';

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
    onShowListingPreview,
    isMobile,
    fetchExistingConversationInProgress,
    onCloseListing,
    closeListingInProgress,
    openListingInProgress,
    onOpenListing,
    isFromSearchPage,
    onGoBackToSearchResults,
    origin,
    reviews,
    fetchReviewsError,
    onManageDisableScrolling,
    onContinueBooking,
    authorDisplayName,
    hasStripeAccount,
    hasStripeAccountInProgress,
    hasStripeAccountError,
  } = props;

  const [isBookingModalOpen, setIsBookingModalOpen] = React.useState(false);

  const { publicData, geolocation, title } = listing.attributes;
  const { author } = listing;
  const { minPrice, maxPrice, location } = publicData;
  const authorMetadata = author?.attributes?.profile?.metadata;

  const backgroundCheckSubscription = authorMetadata?.backgroundCheckSubscription;

  const hasPremiumSubscription =
    SUBSCRIPTION_ACTIVE_TYPES.includes(backgroundCheckSubscription?.status) &&
    backgroundCheckSubscription?.type === 'vine';

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

  const isListingClosed = listing.attributes.state !== 'published';

  const { formattedMinPrice, priceTitle } = formatPrice([minPrice, maxPrice], intl);

  const distanceFromLocation =
    geolocation && origin ? calculateDistanceBetweenOrigins(origin, geolocation) : '0.00';
  const backgroundCheckTitle = (
    <p>
      <FormattedMessage id="CaregiverListingCard.continuouslyVerified" />
    </p>
  );

  const listingUserType = listing.attributes.metadata.listingType;
  const hasBooking = listingUserType === CAREGIVER && !isOwnListing;
  const isLarge = useMediaQuery('(min-width:1024px)');

  return (
    <div className={css.root}>
      {isFromSearchPage && !isOwnListing && (
        <div className={css.backButtonContainer}>
          <Button onClick={onGoBackToSearchResults} rootClassName={css.goBackButton} type="button">
            <IconArrowHead rootClassName={css.arrowIcon} direction="left" size="small" />
            <span className={css.goBackText}>
              {isMobile ? 'Go Back' : 'Back to Search Results'}
            </span>
          </Button>
        </div>
      )}
      <div className={css.topRow}>
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
        {userType === CAREGIVER ? (
          <SectionReviews
            reviews={reviews}
            fetchReviewsError={fetchReviewsError}
            onManageDisableScrolling={onManageDisableScrolling}
            providerDisplayName={displayName}
          />
        ) : null}
      </div>
      {!isOwnListing ? (
        <div className={css.buttonContainer}>
          <Button
            className={css.button}
            onClick={onContactUser}
            disabled={fetchExistingConversationInProgress}
          >
            <FormattedMessage id="ListingSummary.message" />
          </Button>
          {hasStripeAccount && isLarge ? (
            <Button
              className={css.button}
              onClick={() => setIsBookingModalOpen(true)}
              disabled={fetchExistingConversationInProgress}
            >
              Book Now
            </Button>
          ) : null}
        </div>
      ) : (
        <div className={css.buttonContainer}>
          {!isListingClosed ? (
            <Button
              className={css.button}
              onClick={() => onCloseListing(listing.id.uuid)}
              disabled={closeListingInProgress || !listing?.id?.uuid}
              inProgress={closeListingInProgress}
            >
              <FormattedMessage id="ListingSummary.closeListing" />
            </Button>
          ) : (
            <Button
              className={css.button}
              onClick={() => onOpenListing(listing.id.uuid)}
              disabled={openListingInProgress || !listing?.id?.uuid}
              inProgress={openListingInProgress}
            >
              <FormattedMessage id="ListingSummary.openListing" />
            </Button>
          )}
          <Button className={css.button} onClick={onShowListingPreview}>
            <FormattedMessage id="ListingSummary.viewPreview" />
          </Button>
        </div>
      )}
      {hasBooking ? (
        <BookingContainer
          listing={listing}
          onSubmit={onContinueBooking}
          onManageDisableScrolling={onManageDisableScrolling}
          authorDisplayName={authorDisplayName}
          hasStripeAccount={hasStripeAccount}
          hasStripeAccountInProgress={hasStripeAccountInProgress}
          hasStripeAccountError={hasStripeAccountError}
          isBookingModalOpen={isBookingModalOpen}
          onBookingModalClose={() => setIsBookingModalOpen(false)}
          onBookingModalOpen={() => setIsBookingModalOpen(true)}
        />
      ) : null}
    </div>
  );
};

const ListingSummary = compose(injectIntl)(ListingSummaryComponent);

export default ListingSummary;
