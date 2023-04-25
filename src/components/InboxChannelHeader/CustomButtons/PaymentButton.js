import React from 'react';
import { Button } from '../../../components';
import classNames from 'classnames';

import css from './index.module.css';

const PaymentButton = props => {
  const { className, disabled, onOpenPaymentModal, otherUser, rootClassName } = props;

  const openStripeModal = () => {
    const modalInitialValues = {
      provider: otherUser,
    };

    onOpenPaymentModal(modalInitialValues);
  };

  const clickDisabled = !!disabled;

  const rootClass = rootClassName || css.root;
  const buttonClass = className || css.payButtonRoot;

  return (
    <div className={rootClass}>
      <Button rootClassName={buttonClass} disabled={clickDisabled} onClick={openStripeModal}>
        Pay
      </Button>
    </div>
  );
};

export default PaymentButton;
