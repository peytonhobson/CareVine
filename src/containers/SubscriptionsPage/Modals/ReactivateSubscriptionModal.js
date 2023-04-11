import React from 'react';

import { Modal, SecondaryButton, Button } from '../../../components';
import { FormattedMessage } from 'react-intl';

import css from './Modals.module.css';

const VINE = 'vine';
const BASIC = 'basic';

const ReactivateSubscriptionPaymentModal = props => {
  const {
    isOpen,
    onManageDisableScrolling,
    bcType,
    switchPlans,
    reactivateSubscription,
    onClose,
  } = props;

  return (
    <Modal
      id="reactivateSubscriptionModal"
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      containerClassName={css.modalContainer}
      usePortal
    >
      <p className={css.modalTitle}>
        <FormattedMessage id="SubscriptionsPage.reactivateSubscriptionModalTitle" />
      </p>
      <p className={css.modalMessage}>
        <FormattedMessage id="SubscriptionsPage.reactivateSubscriptionModalMessage" />
      </p>
      <div className={css.modalButtonContainer}>
        <SecondaryButton onClick={switchPlans} className={css.reactivateModalButton}>
          {bcType === VINE ? 'Switch to Basic' : 'Upgrade to Gold'}
        </SecondaryButton>
        <Button onClick={reactivateSubscription} className={css.reactivateModalButton}>
          Reactivate
        </Button>
      </div>
    </Modal>
  );
};

export default ReactivateSubscriptionPaymentModal;
