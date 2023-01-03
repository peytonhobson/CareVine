import React, { useState, useEffect } from 'react';

import { bool, func, number, shape, string } from 'prop-types';
import classNames from 'classnames';

import { injectIntl, intlShape } from '../../util/reactIntl';
import {
  IconArrowHead,
  IconBank,
  IconClose,
  Button,
  InlineTextButton,
  Modal,
} from '../../components';
import css from './SavedBankDetails.module.css';

const SavedBankDetails = props => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [active, setActive] = useState(false);

  const {
    rootClassName,
    className,
    intl,
    bank,
    onChange,
    onDeleteAccount,
    onManageDisableScrolling,
    deletePaymentMethodInProgress,
    deletePaymentMethodSuccess,
    hideContent,
    onSelect,
    selected,
    onFetchDefaultPayment,
    stripeCustomer,
  } = props;

  const bankName = bank && bank.bank_name;
  const last4Digits = bank && bank.last4;

  const defaultBank = (
    <div className={css.savedPaymentMethod}>
      <div className={css.bankIconContainer}>
        <IconBank className={css.bankIcon} />
      </div>
      <div className={css.bankContent}>
        <span className={css.bankName}>{bankName}</span>
        <span className={css.accountNumber}>Account ending in {last4Digits}</span>
      </div>
    </div>
  );

  useEffect(() => {
    if (deletePaymentMethodSuccess && !!stripeCustomer) {
      setIsModalOpen(false);
      onFetchDefaultPayment(stripeCustomer.attributes.stripeCustomerId);
    }
  }, [deletePaymentMethodSuccess]);

  const handleOpenDeleteModal = () => {
    setIsModalOpen(true);
  };

  // TODO: Close modal on delete
  // Can probably be done through useEffect and onDeleteAccount success

  // TODO: Need to add error handling to delete account
  const handleDeleteAccount = () => {
    onDeleteAccount('bankAccount');
  };

  const removeCardModalTitle = intl.formatMessage({ id: 'SavedBankDetails.removeCardModalTitle' });
  const removeCardModalContent = intl.formatMessage(
    { id: 'SavedBankDetails.removeCardModalContent' },
    { last4Digits }
  );
  const cancel = intl.formatMessage({ id: 'SavedBankDetails.cancel' });
  const removeCard = intl.formatMessage({ id: 'SavedBankDetails.removeCard' });
  const deletePaymentMethod = intl.formatMessage({ id: 'SavedBankDetails.deletePaymentMethod' });

  const classes = classNames(rootClassName || css.root, className);
  const menuLabelClasses = classNames(css.menuLabel, selected && css.menuLabelActive);

  return (
    <div className={classes} onClick={() => onSelect && onSelect('bankAccount')}>
      <div className={css.menu}>
        <div className={menuLabelClasses}>
          <div className={css.menuLabelWrapper}>{defaultBank}</div>
        </div>
      </div>

      {onDeleteAccount ? (
        <InlineTextButton onClick={handleOpenDeleteModal} className={css.savedPaymentMethodDelete}>
          <IconClose rootClassName={css.closeIcon} size="small" />
          {deletePaymentMethod}
        </InlineTextButton>
      ) : null}

      {onManageDisableScrolling ? (
        <Modal
          id="VerifyDeletingPaymentMethod"
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
          }}
          usePortal
          contentClassName={css.modalContent}
          onManageDisableScrolling={onManageDisableScrolling}
        >
          <div>
            <div className={css.modalTitle}>{removeCardModalTitle}</div>
            <p className={css.modalMessage}>{removeCardModalContent}</p>
            <div className={css.modalButtonsWrapper}>
              <div
                onClick={() => setIsModalOpen(false)}
                className={css.cancelCardDelete}
                tabIndex="0"
              >
                {cancel}
              </div>
              <Button onClick={handleDeleteAccount} inProgress={deletePaymentMethodInProgress}>
                {removeCard}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
};

SavedBankDetails.defaultProps = {
  rootClassName: null,
  className: null,
  bankAccount: null,
  onChange: null,
  onDeleteAccount: null,
  deletePaymentMethodInProgress: false,
  onManageDisableScrolling: null,
};

SavedBankDetails.propTypes = {
  rootClassName: string,
  className: string,
  intl: intlShape.isRequired,
  // card: shape({
  //   brand: string.isRequired,
  //   expirationMonth: number.isRequired,
  //   expirationYear: number.isRequired,
  //   last4Digits: string.isRequired,
  // }),
  onChange: func,
  onDeleteAccount: func,
  onManageDisableScrolling: func,
  deletePaymentMethodInProgress: bool,
};

export default injectIntl(SavedBankDetails);
