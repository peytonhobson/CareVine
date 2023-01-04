import React, { useState, useEffect } from 'react';

import { bool, func, number, shape, string } from 'prop-types';
import classNames from 'classnames';

import { injectIntl, intlShape } from '../../util/reactIntl';
import {
  IconArrowHead,
  IconCard,
  IconClose,
  Button,
  InlineTextButton,
  Modal,
} from '../../components';
import css from './SavedCardDetails.module.css';

const DEFAULT_CARD = 'defaultCard';
const REPLACE_CARD = 'replaceCard';

const SavedCardDetails = props => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [active, setActive] = useState(false);

  const {
    card,
    className,
    deletePaymentMethodInProgress,
    deletePaymentMethodSuccess,
    intl,
    onDeleteCard,
    onFetchDefaultPayment,
    onManageDisableScrolling,
    onSelect,
    rootClassName,
    selected,
    stripeCustomer,
  } = props;

  const expirationYear = (card && card.expirationYear) || (card && card.exp_year);
  const expirationMonth = (card && card.expirationMonth) || (card && card.exp_month);
  const last4Digits = (card && card.last4Digits) || (card && card.last4);
  const brand = card && card.brand;

  useEffect(() => {
    if (deletePaymentMethodSuccess && !!stripeCustomer) {
      setIsModalOpen(false);
      onFetchDefaultPayment(stripeCustomer.attributes.stripeCustomerId);
    }
  }, [deletePaymentMethodSuccess]);

  const paymentMethodPlaceholderDesktop = intl.formatMessage(
    { id: 'SavedCardDetails.savedPaymentMethodPlaceholderDesktop' },
    { last4Digits }
  );

  const paymentMethodPlaceholderMobile = intl.formatMessage(
    { id: 'SavedCardDetails.savedPaymentMethodPlaceholderMobile' },
    { last4Digits }
  );

  const paymentMethodPlaceholder = (
    <>
      <span className={css.paymentMethodPlaceholderDesktop}>{paymentMethodPlaceholderDesktop}</span>
      <span className={css.paymentMethodPlaceholderMobile}>{paymentMethodPlaceholderMobile}</span>
    </>
  );

  const expiredCardText = intl.formatMessage(
    { id: 'SavedCardDetails.expiredCardText' },
    { last4Digits }
  );
  const expiredText = <div className={css.cardExpiredText}>{expiredCardText}</div>;

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

  const isCardExpired =
    expirationMonth && expirationYear && isExpired(expirationMonth, expirationYear);

  const defaultCard = (
    <div className={css.savedPaymentMethod}>
      <IconCard brand={brand} className={css.cardIcon} />
      {paymentMethodPlaceholder}
      <span className={isCardExpired ? css.expirationDateExpired : css.expirationDate}>
        {expirationMonth}/{expirationYear.toString().substring(2)}
      </span>
    </div>
  );

  const handleOpenDeleteModal = () => {
    setIsModalOpen(true);
  };

  const handleDeleteCard = () => {
    onDeleteCard('card');
  };

  const removeCardModalTitle = intl.formatMessage({ id: 'SavedCardDetails.removeCardModalTitle' });
  const removeCardModalContent = intl.formatMessage(
    { id: 'SavedCardDetails.removeCardModalContent' },
    { last4Digits }
  );
  const cancel = intl.formatMessage({ id: 'SavedCardDetails.cancel' });
  const removeCard = intl.formatMessage({ id: 'SavedCardDetails.removeCard' });
  const deletePaymentMethod = intl.formatMessage({ id: 'SavedCardDetails.deletePaymentMethod' });

  const showExpired = isCardExpired && active === DEFAULT_CARD;

  const classes = classNames(rootClassName || css.root, className);
  const menuLabelClasses = classNames(css.menuLabel, selected && css.menuLabelActive);

  return (
    <div className={classes} onClick={() => onSelect && onSelect('card')}>
      <div className={css.menu}>
        <div className={menuLabelClasses}>
          <div className={showExpired ? css.menuLabelWrapperExpired : css.menuLabelWrapper}>
            {defaultCard}
          </div>
        </div>
      </div>
      {showExpired && expiredText}

      {onDeleteCard ? (
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
              <Button onClick={handleDeleteCard} inProgress={deletePaymentMethodInProgress}>
                {removeCard}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
};

SavedCardDetails.defaultProps = {
  card: null,
  className: null,
  deletePaymentMethodInProgress: false,
  deletePaymentMethodSuccess: false,
  intl: null,
  onDeleteCard: null,
  onFetchDefaultPayment: null,
  onManageDisableScrolling: null,
  onSelect: null,
  rootClassName: null,
  selected: false,
  stripeCustomer: null,
};

SavedCardDetails.propTypes = {
  card: shape({
    brand: string.isRequired,
    exp_month: number.isRequired,
    exp_year: number.isRequired,
    last4: string.isRequired,
  }),
  className: string,
  deletePaymentMethodInProgress: bool,
  deletePaymentMethodSuccess: bool,
  intl: intlShape.isRequired,
  onDeleteCard: func,
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

export default injectIntl(SavedCardDetails);
