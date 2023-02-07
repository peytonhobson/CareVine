import React from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import IconCheckmark from '../IconCheckmark/IconCheckmark';
import { NamedLink } from '../';

import css from './ModalMissingInformation.module.css';
import { createSlug } from '../../util/urlHelpers';

const MissingRequirementsReminder = props => {
  const { className, currentUser, onChangeModalValue, currentUserListing } = props;

  const backgroundCheckApproved =
    currentUser && currentUser.attributes.profile.privateData.backgroundCheckApproved;
  const emailVerified = currentUser && currentUser.attributes.emailVerified;
  const stripeAccount = currentUser && currentUser.stripeAccount;

  const closeModalOnLinkClick = value => {
    if (!value) {
      onChangeModalValue(null);
    }
  };

  const listingId = currentUserListing && currentUserListing.id.uuid;
  const title = currentUserListing && currentUserListing.attributes.title;
  const listingType = currentUserListing && currentUserListing.attributes.state;

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
            onClick={() => closeModalOnLinkClick(backgroundCheckApproved)}
          >
            <span className={css.listCircle}>{backgroundCheckApproved && <IconCheckmark />}</span>
            {backgroundCheckApproved ? (
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
          <li
            className={css.requirementsListItem}
            onClick={() => closeModalOnLinkClick(stripeAccount)}
          >
            <span className={css.listCircle}>{stripeAccount && <IconCheckmark />}</span>
            {!!stripeAccount ? (
              <FormattedMessage id="ModalMissingInformation.providePayoutDetails" />
            ) : (
              <NamedLink name="StripePayoutPage">
                <FormattedMessage id="ModalMissingInformation.providePayoutDetails" />
              </NamedLink>
            )}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default MissingRequirementsReminder;
