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
  IconCard,
} from '..';

import css from './SavedPaymentDetails.module.css';

const isExpired = (expirationMonth, expirationYear) => {
  const currentTime = new Date();
  const currentYear = currentTime.getFullYear();
  const currentMonth = currentTime.getMonth() + 1; //getMonth() method returns the month (from 0 to 11)

  if (expirationYear < currentYear) {
    return true;
  } else if (expirationYear === currentYear && expirationMonth < currentMonth) {
    return true;
  }

  return false;
};

const BankAccount = props => {
  const { method: bank, removeDisabled, onOpenDeleteModal } = props;

  const bankName = bank.us_bank_account.bank_name;
  const last4Digits = bank.us_bank_account.last4;
  const bankId = bank.id;

  return (
    <div className={css.savedPaymentMethod}>
      <div className={css.bankIconContainer}>
        <IconBank className={css.bankIcon} />
      </div>
      <div className={css.bankContent}>
        <span className={css.bankName}>{bankName}</span>
        <span className={css.accountNumber}>Account ending in {last4Digits}</span>
      </div>
      {!removeDisabled && (
        <div className={css.closeIconContainer}>
          <IconClose
            className={css.closeIcon}
            onClick={() => onOpenDeleteModal({ id: bankId, last4: last4Digits })}
          />
        </div>
      )}
    </div>
  );
};

const Card = props => {
  const { method: card, intl, removeDisabled, onOpenDeleteModal } = props;

  const expirationYear = card.card.expirationYear || card.card.exp_year;
  const expirationMonth = card.card.expirationMonth || card.card.exp_month;
  const last4Digits = card.card.last4Digits || card.card.last4;
  const brand = card.card.brand;
  const cardId = card.id;

  const isCardExpired =
    expirationMonth && expirationYear && isExpired(expirationMonth, expirationYear);
  const paymentMethodPlaceholderDesktop = intl.formatMessage(
    { id: 'SavedPaymentDetails.savedPaymentMethodPlaceholderDesktop' },
    { last4Digits }
  );
  const paymentMethodPlaceholderMobile = intl.formatMessage(
    { id: 'SavedPaymentDetails.savedPaymentMethodPlaceholderMobile' },
    { last4Digits }
  );
  const paymentMethodPlaceholder = (
    <>
      <span className={css.paymentMethodPlaceholderDesktop}>{paymentMethodPlaceholderDesktop}</span>
      <span className={css.paymentMethodPlaceholderMobile}>{paymentMethodPlaceholderMobile}</span>
    </>
  );

  return (
    <div className={classNames(css.savedPaymentMethod, css.savedPaymentMethodCard)}>
      <IconCard brand={brand} className={css.cardIcon} />
      {paymentMethodPlaceholder}
      <span className={isCardExpired ? css.expirationDateExpired : css.expirationDate}>
        {expirationMonth}/{expirationYear?.toString().substring(2)}
      </span>
      {!removeDisabled && (
        <div className={css.closeIconContainer}>
          <IconClose
            className={css.closeIcon}
            onClick={() => onOpenDeleteModal({ id: cardId, last4: last4Digits })}
          />
        </div>
      )}
    </div>
  );
};

const SavedPaymentDetails = props => {
  const [modalVals, setIsModalOpen] = useState({});
  const [error, setError] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const {
    methods,
    className,
    deletePaymentMethodError,
    deletePaymentMethodInProgress,
    deletedPaymentMethod,
    intl,
    onDeleteMethod,
    onFetchDefaultPayment,
    onManageDisableScrolling,
    rootClassName,
    selected,
    stripeCustomer,
    onChange,
    type,
    removeDisabled,
    methodType,
  } = props;

  const [selectedMethod, setSelectedMethod] = useState(methods?.[0]);

  const bankName = selectedMethod?.us_bank_account?.bank_name;
  const expirationYear =
    type === 'card' ? selectedMethod?.card?.expirationYear || selectedMethod?.card?.exp_year : null;
  const expirationMonth =
    type === 'card'
      ? selectedMethod?.card?.expirationMonth || selectedMethod?.card?.exp_month
      : null;
  const last4Digits =
    type === 'card'
      ? selectedMethod?.card?.last4Digits || selectedMethod?.card?.last4
      : selectedMethod?.us_bank_account?.last4;
  const brand = selectedMethod?.card?.brand;

  const expiredCardText = intl.formatMessage(
    { id: 'SavedPaymentDetails.expiredCardText' },
    { last4Digits }
  );
  const expiredText = <div className={css.cardExpiredText}>{expiredCardText}</div>;

  const isCardExpired =
    expirationMonth && expirationYear && isExpired(expirationMonth, expirationYear);
  const paymentMethodPlaceholderDesktop = intl.formatMessage(
    { id: 'SavedPaymentDetails.savedPaymentMethodPlaceholderDesktop' },
    { last4Digits }
  );
  const paymentMethodPlaceholderMobile = intl.formatMessage(
    { id: 'SavedPaymentDetails.savedPaymentMethodPlaceholderMobile' },
    { last4Digits }
  );
  const paymentMethodPlaceholder = (
    <>
      <span className={css.paymentMethodPlaceholderDesktop}>{paymentMethodPlaceholderDesktop}</span>
      <span className={css.paymentMethodPlaceholderMobile}>{paymentMethodPlaceholderMobile}</span>
    </>
  );

  const defaultMethod =
    type !== 'card' ? (
      <div className={css.defaultPaymentMethod}>
        <div className={css.bankIconContainer}>
          <IconBank className={css.bankIcon} />
        </div>
        <div className={css.bankContent}>
          <span className={css.bankName}>{bankName}</span>
          <span className={css.accountNumber}>Account ending in {last4Digits}</span>
        </div>
        {methods?.length > 1 && (
          <div className={css.dropDownArrowContainer}>
            <IconArrowHead direction="down" class={css.dropDownArrow} />
          </div>
        )}
      </div>
    ) : (
      <div className={css.defaultPaymentMethodCard}>
        <IconCard brand={brand} className={css.cardIcon} />
        {paymentMethodPlaceholder}
        <span className={isCardExpired ? css.expirationDateExpired : css.expirationDate}>
          {expirationMonth}/{expirationYear?.toString().substring(2)}
        </span>
        {methods?.length > 1 && (
          <div className={css.dropDownArrowContainer}>
            <IconArrowHead direction="down" class={css.dropDownArrow} />
          </div>
        )}
      </div>
    );

  useEffect(() => {
    onChange(selectedMethod);
  }, [selectedMethod?.id]);

  useEffect(() => {
    setSelectedMethod(methods?.[0]);
  }, [methods?.length]);

  useEffect(() => {
    if (deletedPaymentMethod && stripeCustomer) {
      onFetchDefaultPayment(stripeCustomer.attributes.stripeCustomerId);
      setError(null);
    }
  }, [deletedPaymentMethod]);

  useEffect(() => {
    if (deletePaymentMethodError) {
      setError(deletePaymentMethodError);
    }
  }, [deletePaymentMethodError]);

  const handleOpenDeleteModal = vals => {
    setIsModalOpen(vals);
  };

  const handleDeleteAccount = () => {
    onDeleteMethod(selectedMethod);
    setError(null);
  };

  const handleMethodSelect = bank => {
    setIsMenuOpen(false);
    setSelectedMethod(bank);
  };

  const removeCardModalTitle = intl.formatMessage(
    {
      id: 'SavedPaymentDetails.removeBankAccountModalTitle',
    },
    { methodType }
  );
  const removeCardModalContent = intl.formatMessage(
    { id: 'SavedPaymentDetails.removeBankAccountModalContent' },
    { last4Digits: modalVals.last4, methodType }
  );
  const cancel = intl.formatMessage({ id: 'SavedPaymentDetails.cancel' });

  const classes = classNames(rootClassName || css.root, className);

  const deletePaymentMethodErrorMessage = intl.formatMessage({
    id: 'SavedPaymentDetails.deletePaymentMethodError',
  });

  const ItemType = type === 'card' ? Card : BankAccount;

  const deletedPaymentMethodId = deletedPaymentMethod?.id;

  return (
    <div className={classes}>
      <div className={css.menu}>
        <div className={css.menuLabelWrapper}>
          <Menu
            className={css.menu}
            isOpen={isMenuOpen}
            onToggleActive={isOpen => methods?.length > 1 && setIsMenuOpen(isOpen)}
            useArrow={false}
          >
            <MenuLabel className={css.menuLabel}>{defaultMethod}</MenuLabel>

            <MenuContent rootClassName={css.menuContent}>
              {methods
                .filter(m => m.id !== selectedMethod.id)
                .map(m => {
                  return (
                    <MenuItem
                      key={m.id}
                      className={css.menuItem}
                      onClick={() => handleMethodSelect(m)}
                    >
                      <ItemType
                        method={m}
                        intl={intl}
                        removeDisabled={removeDisabled}
                        onOpenDeleteModal={handleOpenDeleteModal}
                      />
                    </MenuItem>
                  );
                })}
            </MenuContent>
          </Menu>
        </div>
      </div>
      {isCardExpired && expiredText}

      {onManageDisableScrolling ? (
        <Modal
          id="VerifyDeletingPaymentMethod"
          isOpen={modalVals.id}
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
                ready={deletedPaymentMethodId && deletedPaymentMethodId === modalVals.id}
                disabled={
                  deletePaymentMethodInProgress ||
                  (deletedPaymentMethodId && deletedPaymentMethodId === modalVals.id)
                }
              >
                Remove {methodType}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
};

export default injectIntl(SavedPaymentDetails);
