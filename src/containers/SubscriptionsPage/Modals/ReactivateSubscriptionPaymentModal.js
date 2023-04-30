import React from 'react';

import { Modal, Button, SavedCardDetails } from '../../../components';
import { ensurePaymentMethodCard } from '../../../util/data';
import ReactivateInfo from './ReactivateInfo';
import { SUBSCRIPTION_ACTIVE_TYPES } from '../../../util/constants';

import { FormattedMessage } from 'react-intl';

import css from './Modals.module.css';

const TODAY = new Date();

const VINE = 'vine';
const BASIC = 'basic';

const ReactivateSubscriptionPaymentModal = props => {
  const {
    cancelSubscriptionError,
    cancelSubscriptionInProgress,
    handleReactivateSubscription,
    bcType,
    card,
    createSubscriptionError,
    createSubscriptionInProgress,
    isOpen,
    onClose,
    onFetchDefaultPayment,
    onManageDisableScrolling,
    openType,
    renewalDate,
    stripeCustomer,
    updateSubscriptionError,
    updateSubscriptionInProgress,
    bcStatus,
    cancelAtPeriodEnd,
    customerCreditBalance,
  } = props;

  const hasErrors = createSubscriptionError || updateSubscriptionError || cancelSubscriptionError;
  const inProgress =
    createSubscriptionInProgress || updateSubscriptionInProgress || cancelSubscriptionInProgress;

  const isUpgrading =
    bcType === BASIC && SUBSCRIPTION_ACTIVE_TYPES.includes(bcStatus) && !cancelAtPeriodEnd;

  return (
    <Modal
      id="reactivateSubscriptionPaymentModal"
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      containerClassName={css.modalContainer}
      usePortal
    >
      <p className={css.modalTitle}>
        {isUpgrading ? (
          <FormattedMessage id="SubscriptionsPage.upgradeSubscriptionModalTitle" />
        ) : (
          <FormattedMessage id="SubscriptionsPage.reactivateSubscriptionModalTitle" />
        )}
      </p>
      <div className={css.paymentContainer}>
        <div className={css.paymentCard}>
          <h2> Payment Method </h2>
          {card && (
            <SavedCardDetails
              card={ensurePaymentMethodCard(card)}
              onFetchDefaultPayment={onFetchDefaultPayment}
              onManageDisableScrolling={onManageDisableScrolling}
              stripeCustomer={stripeCustomer}
            />
          )}
        </div>
        <ReactivateInfo
          backgroundCheckType={openType}
          customerCreditBalance={customerCreditBalance}
        />
        {renewalDate && renewalDate > TODAY && !(openType === VINE && bcType === BASIC) ? (
          <div className={css.wontChargeUntil}>
            <FormattedMessage
              id="SubscriptionsPage.wontChargeUntil"
              values={{ renewalDate: renewalDate.toLocaleDateString() }}
            />
          </div>
        ) : null}
      </div>

      {hasErrors && (
        <p className={css.modalError}>
          <FormattedMessage id="SubscriptionsPage.reactivateSubscriptionError" />
        </p>
      )}
      <Button inProgress={inProgress} onClick={handleReactivateSubscription}>
        {isUpgrading ? 'Upgrade' : 'Reactivate'}
      </Button>
    </Modal>
  );
};

export default ReactivateSubscriptionPaymentModal;
