import React from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import { NamedLink, IconCheckmark } from '../';

import css from './ModalMissingInformation.module.css';
import { createSlug } from '../../util/urlHelpers';

const MissingSubscriptionReminder = props => {
  const { className, onChangeModalValue } = props;

  return (
    <div className={className}>
      <p className={css.modalTitle}>
        <FormattedMessage id="ModalMissingInformation.missingSubscriptionTitle" />
      </p>
      <p className={css.modalMessage}>
        <FormattedMessage id="ModalMissingInformation.missingSubscriptionText" />
      </p>
      <p className={css.modalMessage}>
        <FormattedMessage id="ModalMissingInformation.clickSubscribeButton" />
      </p>

      <div className={css.bottomWrapper} onClick={() => onChangeModalValue(null)}>
        <NamedLink className={css.reminderModalLinkButton} name="SubscriptionsPage">
          <FormattedMessage id="ModalMissingInformation.goToSubscriptions" />
        </NamedLink>
      </div>
    </div>
  );
};

export default MissingSubscriptionReminder;
