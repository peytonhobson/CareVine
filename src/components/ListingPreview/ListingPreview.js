import React from 'react';

import { CAREGIVER } from '../../util/constants';
import { CaregiverListingCard, EmployerListingCard, GradientButton } from '..';

import { FormattedMessage } from '../../util/reactIntl';

import css from './ListingPreview.module.css';
import EmployerListingCardMobile from '../EmployerListingCard/EmployerListingCardMobile';

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

const ListingPreview = props => {
  const { currentUser, currentUserListing, onShowFullProfile, onManageDisableScrolling } = props;

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
