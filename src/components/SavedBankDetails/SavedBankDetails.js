import React, { useState } from 'react';

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
    onDeleteCard,
    onManageDisableScrolling,
    deletePaymentMethodInProgress,
    hideContent,
    onSelect,
    selected,
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

  const handleDeleteCard = () => {
    setIsModalOpen(true);
  };

  const iconArrowClassName = css.IconArrowAnimation;

  const removeCardModalTitle = intl.formatMessage({ id: 'SavedCardDetails.removeCardModalTitle' });
  const removeCardModalContent = intl.formatMessage(
    { id: 'SavedCardDetails.removeCardModalContent' },
    { last4Digits }
  );
  const cancel = intl.formatMessage({ id: 'SavedCardDetails.cancel' });
  const removeCard = intl.formatMessage({ id: 'SavedCardDetails.removeCard' });
  const deletePaymentMethod = intl.formatMessage({ id: 'SavedCardDetails.deletePaymentMethod' });

  const classes = classNames(rootClassName || css.root, className);
  const menuLabelClasses = classNames(css.menuLabel, selected && css.menuLabelActive);

  return (
    <div className={classes} onClick={() => onSelect('bankAccount')}>
      <div className={css.menu}>
        <div className={menuLabelClasses}>
          <div className={css.menuLabelWrapper}>
            {defaultBank}
            {!hideContent && (
              <span>
                <IconArrowHead
                  direction="down"
                  size="small"
                  rootClassName={css.iconArrow}
                  className={iconArrowClassName}
                />
              </span>
            )}
          </div>
        </div>
      </div>

      {onDeleteCard ? (
        <InlineTextButton onClick={handleDeleteCard} className={css.savedPaymentMethodDelete}>
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
              <Button onClick={onDeleteCard} inProgress={deletePaymentMethodInProgress}>
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
  onDeleteCard: null,
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
  onDeleteCard: func,
  onManageDisableScrolling: func,
  deletePaymentMethodInProgress: bool,
};

export default injectIntl(SavedBankDetails);
