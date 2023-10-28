import React, { useMemo } from 'react';

import { CAREGIVER } from '../../util/constants';
import { CaregiverListingCard, EmployerListingCard, GradientButton } from '..';
import { FormattedMessage } from '../../util/reactIntl';
import EmployerListingCardMobile from '../EmployerListingCard/EmployerListingCardMobile';
import { useCheckMobileScreen } from '../../util/hooks';

import css from './ListingPreview.module.css';

const ListingPreview = props => {
  const {
    currentUser,
    currentUserListing: userListing,
    onShowFullProfile,
    onManageDisableScrolling,
  } = props;

  const isMobile = useCheckMobileScreen();

  const currentUserListing = useMemo(() => {
    return userListing;
  }, [userListing?.id?.uuid]);

  const currentUserType = currentUser?.attributes?.profile?.metadata?.userType;
  const listingWithAuthor = {
    author: currentUser,
    ...currentUserListing,
  };

  return (
    <div className={css.root}>
      {currentUserType === CAREGIVER ? (
        <CaregiverListingCard
          className={css.listingCard}
          currentUser={currentUser}
          currentUserListing={listingWithAuthor}
          listing={listingWithAuthor}
          disableProfileLink
          isMobile={isMobile}
        />
      ) : isMobile ? (
        <EmployerListingCardMobile
          className={css.listingCard}
          currentUser={currentUser}
          currentUserListing={listingWithAuthor}
          listing={listingWithAuthor}
          onManageDisableScrolling={onManageDisableScrolling}
          disableProfileLink
        />
      ) : (
        <EmployerListingCard
          className={css.listingCard}
          currentUser={currentUser}
          currentUserListing={listingWithAuthor}
          listing={listingWithAuthor}
          onManageDisableScrolling={onManageDisableScrolling}
          disableProfileLink
        />
      )}
      <div className={css.buttonContainer}>
        <GradientButton className={css.viewProfileButton} onClick={onShowFullProfile}>
          <FormattedMessage id="ListingPreview.viewProfile" />
        </GradientButton>
      </div>
    </div>
  );
};

export default ListingPreview;
