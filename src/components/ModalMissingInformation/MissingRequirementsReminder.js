import React from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import { NamedLink, IconCheckmark } from '../';
import { LISTING_STATE_DRAFT } from '../../util/types';
import {
  LISTING_PAGE_PARAM_TYPE_DRAFT,
  LISTING_PAGE_PARAM_TYPE_EDIT,
  createSlug,
} from '../../util/urlHelpers';
import { BACKGROUND_CHECK_APPROVED } from '../../util/constants';

import css from './ModalMissingInformation.module.css';

const MissingRequirementsReminder = props => {
  const { className, currentUser, onChangeModalValue, currentUserListing } = props;

  const backgroundCheckApprovedStatus =
    currentUser?.attributes?.profile?.metadata?.backgroundCheckApproved?.status;
  const emailVerified = currentUser && currentUser.attributes.emailVerified;

  const closeModalOnLinkClick = value => {
    if (!value) {
      onChangeModalValue(null);
    }
  };

  const listingId = currentUserListing?.id?.uuid;
  const title = currentUserListing?.attributes?.title;

  const state = currentUserListing?.attributes?.state;
  const isDraft = state === LISTING_STATE_DRAFT;
  const listingType = isDraft ? LISTING_PAGE_PARAM_TYPE_DRAFT : LISTING_PAGE_PARAM_TYPE_EDIT;

  return (
    <div className={className}>
      <p className={css.modalTitle}>
        <FormattedMessage id="ModalMissingInformation.missingRequirementsTitle" />
      </p>
      <p className={css.modalMessage}>
        <FormattedMessage id="ModalMissingInformation.closeToMessagingText" />
      </p>
      <p className={css.modalMessage}>
        <FormattedMessage id="ModalMissingInformation.pleaseCompleteText" />
      </p>

      <div className={css.requirementsBottomWrapper}>
        <ul className={css.requirementsList}>
          <li
            className={css.requirementsListItem}
            onClick={() => closeModalOnLinkClick(emailVerified)}
          >
            <span className={css.listCircle}>{emailVerified && <IconCheckmark />}</span>
            {emailVerified ? (
              <FormattedMessage id="ModalMissingInformation.verifyEmail" />
            ) : (
              <NamedLink name="SignupPage">
                <FormattedMessage id="ModalMissingInformation.verifyEmail" />
              </NamedLink>
            )}
          </li>
          <li
            className={css.requirementsListItem}
            onClick={() => closeModalOnLinkClick(backgroundCheckApprovedStatus)}
          >
            <span className={css.listCircle}>
              {backgroundCheckApprovedStatus === BACKGROUND_CHECK_APPROVED && <IconCheckmark />}
            </span>
            {backgroundCheckApprovedStatus === BACKGROUND_CHECK_APPROVED ? (
              <FormattedMessage id="ModalMissingInformation.completeBackgroundCheck" />
            ) : !!currentUserListing ? (
              <NamedLink
                name="EditListingPage"
                params={{
                  id: listingId,
                  slug: createSlug(title),
                  type: listingType,
                  tab: 'background-check',
                }}
              >
                <FormattedMessage id="ModalMissingInformation.completeBackgroundCheck" />
              </NamedLink>
            ) : (
              <NamedLink name="NewListingPage">
                <FormattedMessage id="ModalMissingInformation.completeBackgroundCheck" />
              </NamedLink>
            )}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default MissingRequirementsReminder;
