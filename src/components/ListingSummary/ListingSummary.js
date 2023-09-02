import React from 'react';

import { Avatar, Button, IconCareVineGold, InfoTooltip, IconArrowHead } from '..';
import { formatPrice, userDisplayNameAsString } from '../../util/data';
import { richText } from '../../util/richText';
import { compose } from 'redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { calculateDistanceBetweenOrigins } from '../../util/maps';
import { CAREGIVER, EMPLOYER, SUBSCRIPTION_ACTIVE_TYPES } from '../../util/constants';
import SectionReviews from '../../containers/SectionReviews/SectionReviews';
import BookingContainer from '../../containers/ListingPage/BookingContainer';
import { useMediaQuery } from '@mui/material';
import { getMissingInfoModalValue } from '../../util/data';

import css from './ListingSummary.module.css';

const whiteListedCaregiverIds = [
  '646cfff8-1bac-4cf8-ab52-5171c1322e68',
  '646d0a79-bc93-43ad-8fcd-ed7acce16f20',
  '646d128f-618b-4986-9ffb-5c05cb65afc1',
  '646d23fa-4c97-48fb-976c-106f92b58933',
  '646d352d-b1c1-4e6a-90ed-9059bba066ca',
  '646d3aa3-a683-44f5-be23-947a4987e3b1',
  '646d6371-35fc-442d-83c2-c77f9dec75da',
  '646d6938-2bb0-4949-b8e4-e69132076b9c',
  '646e251e-f57b-4bfc-9282-f17f84cbff41',
  '646e2e04-8bf3-451d-8792-31b3f7fc0067',
  '647a3963-6cb9-4dbe-91f0-d50461aed926',
  '647a3fa1-1326-450e-b502-14ef5285bc25',
  '647a4b35-3a5a-4a85-b6f4-45d32852cd9e',
  '647a4cee-14cb-4491-9e94-68111fc84b2d',
  '647b8492-aaa9-4af5-8652-b5861603affa',
  '647b8962-031c-456f-b74f-86ec443d27a2',
  '647b8c08-3a97-4882-a764-b7193df46530',
  '647b8df5-6fce-4239-a87d-5debcdee22e6',
  '647b9379-78ae-45de-b9c3-da973b42cd9e',
  '647ba33d-228b-408a-b6f2-1e6011ddf595',
  '647caffb-bdc3-41ed-a24f-9370f487082d',
  '647d1155-5155-491b-aca9-30c103bfd80f',
  '647d1304-b878-4d56-a0eb-139c04781a6d',
  '647d1919-ae23-4c64-a02f-98d60b9aabe3',
  '647dfd75-367d-4507-8e82-6c395c2537f3',
  '6480d22c-ebb4-481a-bc0f-ee50c2a3ff64',
  '6480d9e0-2cd6-4fcf-8d46-9df242c7e497',
  '6480e2ea-aa0b-4c7b-84b1-711755cb6ee4',
  '64d6844f-aa14-4446-baa6-e071fde9a299',
];

const MIN_LENGTH_FOR_LONG_WORDS = 16;

const ListingSummaryComponent = props => {
  const {
    listing,
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
    onManageDisableScrolling,
    onContinueBooking,
    authorDisplayName,
    hasStripeAccount,
    hasStripeAccountInProgress,
    hasStripeAccountError,
    currentUser,
    currentUserListing,
    onChangeModalValue,
    history,
  } = props;

  const [isBookingModalOpen, setIsBookingModalOpen] = React.useState(false);

  const authorMetadata = listing?.author?.attributes?.profile?.metadata;
  const backgroundCheckSubscription = authorMetadata?.backgroundCheckSubscription;

  const handleClickMessage = () => {
    if (!currentUser?.id.uuid) {
      history.push('/signup');
      return;
    }

    const missingInfoModalValue = getMissingInfoModalValue(currentUser, currentUserListing);

    if (missingInfoModalValue) {
      onChangeModalValue(missingInfoModalValue);
      return;
    }

    onContactUser();
  };

  const handleClickBook = () => {
    if (!currentUser?.id.uuid) {
      history.push('/signup');
      return;
    }

    const missingInfoModalValue = getMissingInfoModalValue(currentUser);

    if (missingInfoModalValue) {
      onChangeModalValue(missingInfoModalValue);
      return;
    }

    setIsBookingModalOpen(true);
  };

  const { publicData, geolocation, title } = listing.attributes;
  const { author } = listing;
  const { minPrice, maxPrice, location } = publicData;
  const authorWhiteListed = whiteListedCaregiverIds.includes(author.id.uuid);

  const thisUserHasStripeAccount =
    hasStripeAccount?.data && hasStripeAccount?.userId === author.id.uuid;

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

  const hasActiveSubscription = backgroundCheckSubscription?.status === 'active';
  const showBookingButton =
    (thisUserHasStripeAccount || authorWhiteListed) && hasActiveSubscription;

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
          <SectionReviews providerDisplayName={displayName} listingId={listing?.id.uuid} />
        ) : null}
      </div>
      {!isOwnListing ? (
        <div className={css.buttonContainer}>
          <Button
            className={css.button}
            onClick={handleClickMessage}
            disabled={fetchExistingConversationInProgress}
          >
            <FormattedMessage id="ListingSummary.message" />
          </Button>
          {showBookingButton && isLarge ? (
            <Button
              className={css.button}
              onClick={handleClickBook}
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
          onBookingModalOpen={handleClickBook}
          authorWhiteListed={authorWhiteListed}
        />
      ) : null}
    </div>
  );
};

const ListingSummary = compose(injectIntl)(ListingSummaryComponent);

export default ListingSummary;
