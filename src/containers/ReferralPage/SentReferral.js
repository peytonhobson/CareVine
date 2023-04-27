import React from 'react';

import { IconBell, InfoTooltip } from '../../components';

import css from './ReferralPage.module.css';

const MILLISECONDS_THREE_DAYS = 259200000;

const SentReferral = props => {
  const { referral } = props;

  // TODO: Implement function
  const handleSendReminder = () => {
    console.log('Send reminder');
  };

  const canRemind =
    Date.now() - referral.lastReminder > MILLISECONDS_THREE_DAYS && !referral.claimed;

  const reminderTooSoon = (
    <p>It's a little too soon to send a reminder. Check back in a few days!</p>
  );

  const remind = (
    <div>
      <IconBell height="1.25em" width="1.25em" />
      <p className={css.remind}>Remind</p>
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
          <p className={css.referralClaimed}>Claimed</p>
        ) : (
          <p className={css.referralUnclaimed}>Unclaimed</p>
        )}
      </div>
      <div className={css.referralReminderContainer}>
        {!referral.claimed && (
          <InfoTooltip
            icon={remind}
            onClick={canRemind ? handleSendReminder : null}
            title={!canRemind ? reminderTooSoon : null}
            styles={canRemind ? canRemindTooltipStyles : cantRemindTooltipStyles}
          />
        )}
      </div>
    </div>
  );
};

export default SentReferral;
