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
  const {
    className,
    currentUser,
    onChangeModalValue,
    currentUserListing,
    modalText,
    modalTitle,
  } = props;

  const backgroundCheckApprovedStatus =
    currentUser?.attributes?.profile?.metadata?.backgroundCheckApproved?.status;
  const emailVerified = !!currentUser.attributes.emailVerified;

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
  const listingComplete =
    state === 'published' || state === 'closed' || state === 'pendingApproval';

  const completedItems = {
    emailVerified,
    backgroundCheck: backgroundCheckApprovedStatus === BACKGROUND_CHECK_APPROVED,
    listingComplete,
  };
  const noCompletedItems = Object.values(completedItems).every(item => item !== true);

  return (
    <div className={className}>
      <p className={css.modalTitle}>{modalTitle ? modalTitle : "It's not you, it's us..."}</p>
      <p className={css.modalMessage}>
        To be able to send messages and access your inbox, we need you to complete the following
        steps by clicking on the links in blue. These help to ensure the safety of everyone on our
        platform.
      </p>
      <p className={css.modalMessage}>{modalText}</p>

      <div className={css.requirementsBottomWrapper}>
        {!noCompletedItems ? (
          <div>
            <p className="underline">Complete</p>
            <ul className={css.requirementsList}>
              {completedItems.emailVerified ? (
                <li className={css.requirementsListItem}>
                  <span className={css.listCircle}>
                    <IconCheckmark />
                  </span>
                  Email Verified
                </li>
              ) : null}
              {completedItems.backgroundCheck ? (
                <li className={css.requirementsListItem}>
                  <span className={css.listCircle}>
                    <IconCheckmark />
                  </span>
                  Background Check
                </li>
              ) : null}
              {completedItems.listingComplete ? (
                <li className={css.requirementsListItem}>
                  <span className={css.listCircle}>
                    <IconCheckmark />
                  </span>
                  <span>Listing Complete</span>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
        <div>
          <p className="underline">To Do</p>
          <ul className={css.requirementsList}>
            {!completedItems.emailVerified ? (
              <li
                className={css.requirementsListItem}
                onClick={() => closeModalOnLinkClick(emailVerified)}
              >
                <span className={css.listCircle} />
                <NamedLink name="SignupPage" target="_blank">
                  <FormattedMessage id="ModalMissingInformation.verifyEmail" />
                </NamedLink>
              </li>
            ) : null}
            {!completedItems.backgroundCheck ? (
              <li
                className={css.requirementsListItem}
                onClick={() => closeModalOnLinkClick(backgroundCheckApprovedStatus)}
              >
                <span className={css.listCircle} />
                {!!currentUserListing ? (
                  <NamedLink name="BackgroundCheckPage" target="_blank">
                    Complete Your Background Check
                  </NamedLink>
                ) : (
                  <NamedLink name="NewListingPage" target="_blank">
                    Complete Your Background Check
                  </NamedLink>
                )}
              </li>
            ) : null}
            {!completedItems.listingComplete ? (
              <li
                className={css.requirementsListItem}
                onClick={() => closeModalOnLinkClick(listingComplete)}
              >
                <span className={css.listCircle} />
                {!!currentUserListing ? (
                  <NamedLink
                    name="EditListingPage"
                    params={{
                      id: listingId,
                      slug: createSlug(title),
                      type: listingType,
                      tab: 'profile-picture',
                    }}
                    target="_blank"
                  >
                    Finish Creating Your Listing
                  </NamedLink>
                ) : (
                  <NamedLink name="NewListingPage" target="_blank">
                    Finish Creating Your Listing
                  </NamedLink>
                )}
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MissingRequirementsReminder;
