import React from 'react';

import { CAREGIVER } from '../../util/constants';
import { CaregiverListingCard, EmployerListingCard, GradientButton } from '..';

import { FormattedMessage } from '../../util/reactIntl';

import css from './ListingPreview.module.css';

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
        />
      ) : (
        <EmployerListingCard
          className={css.listingCard}
          currentUser={currentUser}
          currentUserListing={listingWithAuthor}
          listing={listingWithAuthor}
          onManageDisableScrolling={onManageDisableScrolling}
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
