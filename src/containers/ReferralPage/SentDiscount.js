import React from 'react';

import { IconBell, InfoTooltip } from '../../components';

import css from './ReferralPage.module.css';

const MILLISECONDS_THREE_DAYS = 259200000;

const SentDiscount = props => {
  const { discount } = props;

  // TODO: Implement function
  const handleSendReminder = () => {
    console.log('Send reminder');
  };

  const canRemind =
    Date.now() - discount.lastReminder > MILLISECONDS_THREE_DAYS && !discount.claimed;

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
    <div className={css.sentDiscount}>
      <div>
        <p className={css.discountEmail}>{discount.email}</p>
        <p className={css.discountClaimed}>{discount.claimed ? 'Claimed' : 'Unclaimed'}</p>
      </div>
      <div className={css.discountReminderContainer}>
        {!discount.claimed && (
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

export default SentDiscount;
