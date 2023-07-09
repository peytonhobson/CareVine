import React, { useState, useEffect } from 'react';

import { bool, func, shape, string } from 'prop-types';
import classNames from 'classnames';

import { injectIntl, intlShape } from '../../util/reactIntl';
import {
  IconBank,
  IconClose,
  Button,
  InlineTextButton,
  Modal,
  IconArrowHead,
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
} from '../../components';
import { propTypes } from '../../util/types';

import css from './SavedBankDetails.module.css';

const BankAccount = props => {
  const { bank } = props;

  const bankName = bank.us_bank_account.bank_name;
  const last4Digits = bank.us_bank_account.last4;

  return (
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
};

const SavedBankDetails = props => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const {
    bankAccounts,
    className,
    deletePaymentMethodError,
    deletePaymentMethodInProgress,
    deletePaymentMethodSuccess,
    intl,
    onDeleteAccount,
    onFetchDefaultPayment,
    onManageDisableScrolling,
    onSelect,
    rootClassName,
    selected,
    stripeCustomer,
  } = props;

  const [selectedBank, setSelectedBank] = useState(bankAccounts?.[0]);

  const bankName = selectedBank.us_bank_account.bank_name;
  const last4Digits = selectedBank.us_bank_account.last4;

  const defaultBank = (
    <div className={css.defaultPaymentMethod}>
      <div className={css.bankIconContainer}>
        <IconBank className={css.bankIcon} />
      </div>
      <div className={css.bankContent}>
        <span className={css.bankName}>{bankName}</span>
        <span className={css.accountNumber}>Account ending in {last4Digits}</span>
      </div>
      <div className={css.dropDownArrowContainer}>
        <IconArrowHead direction="down" class={css.dropDownArrow} />
      </div>
    </div>
  );

  useEffect(() => {
    if (deletePaymentMethodSuccess && !!stripeCustomer) {
      setIsModalOpen(false);
      onFetchDefaultPayment(stripeCustomer.attributes.stripeCustomerId);
      setError(null);
    }
  }, [deletePaymentMethodSuccess]);

  useEffect(() => {
    if (deletePaymentMethodError) {
      setError(deletePaymentMethodError);
    }
  }, [deletePaymentMethodError]);

  const handleOpenDeleteModal = () => {
    setIsModalOpen(true);
  };

  const handleDeleteAccount = () => {
    onDeleteAccount('bankAccount');
    setError(null);
  };

  const handleBankSelect = bank => {
    setIsMenuOpen(false);
    setSelectedBank(bank);
  };

  const removeCardModalTitle = intl.formatMessage({
    id: 'SavedBankDetails.removeBankAccountModalTitle',
  });
  const removeCardModalContent = intl.formatMessage(
    { id: 'SavedBankDetails.removeBankAccountModalContent' },
    { last4Digits }
  );
  const cancel = intl.formatMessage({ id: 'SavedBankDetails.cancel' });
  const removeBankAccount = intl.formatMessage({ id: 'SavedBankDetails.removeBankAccount' });

  const classes = classNames(rootClassName || css.root, className);
  const menuLabelClasses = classNames(css.menuLabel, selected && css.menuLabelActive);

  const deletePaymentMethodErrorMessage = intl.formatMessage({
    id: 'SavedBankDetails.deletePaymentMethodError',
  });

  return (
    <div className={classes} onClick={() => onSelect && onSelect('bankAccount')}>
      <div className={css.menu}>
        <div className={menuLabelClasses}>
          <div className={css.menuLabelWrapper}>
            <Menu
              className={css.menu}
              isOpen={isMenuOpen}
              onToggleActive={isOpen => setIsMenuOpen(isOpen)}
              useArrow={false}
            >
              <MenuLabel className={css.menuLabel}>{defaultBank}</MenuLabel>

              <MenuContent rootClassName={css.menuContent}>
                {bankAccounts
                  .filter(bank => bank.id !== selectedBank.id)
                  .map(bank => {
                    return (
                      <MenuItem
                        key={bank.id}
                        className={css.menuItem}
                        onClick={() => handleBankSelect(bank)}
                      >
                        <BankAccount bank={bank} />
                      </MenuItem>
                    );
                  })}

                {/* <MenuItem key="divider" className={css.menuDivider}>
                  {replaceCardTitle}
                </MenuItem>
                <MenuItem key="second item" className={css.menuItem}>
                  <IconCheckmark
                    className={
                      active === REPLACE_CARD ? css.iconCheckmark : css.iconCheckmarkHidden
                    }
                    size="small"
                  />
                  <InlineTextButton
                    className={css.menuTextReplaceCard}
                    onClick={handleClick(REPLACE_CARD)}
                  >
                    {replaceCard}
                  </InlineTextButton>
                </MenuItem> */}
              </MenuContent>
            </Menu>
          </div>
        </div>
      </div>

      {onDeleteAccount ? (
        <InlineTextButton
          onClick={handleOpenDeleteModal}
          className={css.savedPaymentMethodDelete}
          type="button"
        >
          <IconClose rootClassName={css.closeIcon} size="small" />
          {removeBankAccount}
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
            <div className={css.modalMessage}>
              <p>{removeCardModalContent}</p>
              <p className={css.errorMessage}>{error && deletePaymentMethodErrorMessage}</p>
            </div>
            <div className={css.modalButtonsWrapper}>
              <div
                onClick={() => {
                  setError(null);
                  setIsModalOpen(false);
                }}
                className={css.cancelAccountDelete}
                tabIndex="0"
                type="button"
              >
                {cancel}
              </div>
              <Button
                onClick={handleDeleteAccount}
                inProgress={deletePaymentMethodInProgress}
                type="button"
              >
                {removeBankAccount}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
};

SavedBankDetails.defaultProps = {
  bank: null,
  className: null,
  deletePaymentMethodError: null,
  deletePaymentMethodInProgress: false,
  deletePaymentMethodSuccess: false,
  intl: null,
  onDeleteAccount: null,
  onFetchDefaultPayment: null,
  onManageDisableScrolling: null,
  onSelect: null,
  rootClassName: null,
  selected: false,
  stripeCustomer: null,
};

SavedBankDetails.propTypes = {
  bank: shape({
    bank_name: string.isRequired,
    last4: string.isRequired,
  }),
  className: string,
  deletePaymentMethodError: propTypes.error,
  deletePaymentMethodInProgress: bool,
  deletePaymentMethodSuccess: bool,
  intl: intlShape.isRequired,
  onDeleteAccount: func,
  onFetchDefaultPayment: func,
  onManageDisableScrolling: func,
  onSelect: func,
  rootClassName: string,
  selected: bool,
  stripeCustomer: shape({
    attributes: shape({
      stripeCustomerId: string.isRequired,
    }),
  }),
};

export default injectIntl(SavedBankDetails);
