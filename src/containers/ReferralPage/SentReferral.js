import React from 'react';

import { FormattedMessage } from '../../util/reactIntl';
import { IconBell, InfoTooltip, IconSpinner, IconCheckmark } from '../../components';

import css from './ReferralPage.module.css';

const MILLISECONDS_THREE_DAYS = 259200000;

const SentReferral = props => {
  const { referral, onRemind, sendReminderInProgress, reminderSent } = props;

  const canRemind =
    (Date.now() - referral.lastReminder > MILLISECONDS_THREE_DAYS || !referral.lastReminder) &&
    Date.now() - referral.createdAt > MILLISECONDS_THREE_DAYS &&
    !referral.claimed;

  const reminderTooSoon = (
    <p>
      <FormattedMessage id="SentReferral.reminderTooSoon" />
    </p>
  );

  const remind = (
    <div>
      {sendReminderInProgress === referral.email ? (
        <IconSpinner />
      ) : reminderSent === referral.email ? (
        <IconCheckmark />
      ) : (
        <IconBell height="1.25em" width="1.25em" />
      )}
      {reminderSent !== referral.email && (
        <p className={css.remind}>
          <FormattedMessage id="SentReferral.remind" />
        </p>
      )}
    </div>
  );

  const canRemindTooltipStyles = {
    color: 'var(--marketplaceColor)',
    paddingBlock: '0.5rem',
    borderRadius: '5px',
    '&:hover': {
      backgroundColor: 'var(--matterColorNegative)',
    },
  };

  const cantRemindTooltipStyles = {
    color: 'var(--matterColorNegative)',
  };

  return (
    <div className={css.sentReferral}>
      <div>
        <p className={css.referralEmail}>{referral.email}</p>
        {referral.claimed ? (
          <p className={css.referralClaimed}>
            <FormattedMessage id="SentReferral.claimed" />
          </p>
        ) : (
          <p className={css.referralUnclaimed}>
            <FormattedMessage id="SentReferral.unclaimed" />
          </p>
        )}
      </div>
      <div className={css.referralReminderContainer}>
        {!referral.claimed && (
          <InfoTooltip
            icon={remind}
            onClick={canRemind && !sendReminderInProgress ? () => onRemind(referral) : null}
            title={!canRemind ? reminderTooSoon : null}
            styles={canRemind ? canRemindTooltipStyles : cantRemindTooltipStyles}
          />
        )}
      </div>
    </div>
  );
};

export default SentReferral;
