import React from 'react';

import { Modal, SecondaryButton } from '../../../components';

import { FormattedMessage } from 'react-intl';

import css from './Modals.module.css';

const CancelSubscriptionModal = props => {
  const {
    isOpen,
    openType,
    onManageDisableScrolling,
    updateSubscriptionError,
    updateSubscriptionInProgress,
    handleCancelSubscription,
    handleCancelFutureSubscription,
    onClose,
  } = props;

  const cancelFunction =
    openType === 'future' ? handleCancelFutureSubscription : handleCancelSubscription;

  return (
    <Modal
      id="cancelSubscriptionModal"
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      containerClassName={css.modalContainer}
      usePortal
    >
      <p className={css.modalTitle}>
        <FormattedMessage id="SubscriptionsPage.cancelSubscriptionModalTitle" />
      </p>
      <p className={css.modalMessage}>
        When you cancel, your profile listing will be removed and you'll lose access to messaging
        families at the end of your billing cycle(s).
      </p>
      {updateSubscriptionError ? (
        <p className={css.modalError}>
          <FormattedMessage id="SubscriptionsPage.cancelSubscriptionError" />
        </p>
      ) : null}
      <div className={css.modalButtonContainer}>
        <SecondaryButton onClick={onClose} className={css.cancelModalButton}>
          Back
        </SecondaryButton>
        <SecondaryButton
          inProgress={updateSubscriptionInProgress}
          onClick={cancelFunction}
          className={css.cancelModalButton}
          style={{ backgroundColor: 'var(--failColor)', color: 'white' }}
        >
          Cancel
        </SecondaryButton>
      </div>
    </Modal>
  );
};

export default CancelSubscriptionModal;
