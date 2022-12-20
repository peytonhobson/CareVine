import React from 'react';
import { Button } from '../../../components';
import classNames from 'classnames';

import css from './index.module.css';

const PaymentButton = props => {
  const {
    channelUrl,
    className,
    disabled,
    fetchUserFromChannelUrlInProgress,
    onOpenPaymentModal,
    otherUser,
    rootClassName,
    sendbirdContext,
  } = props;

  const openStripeModal = () => {
    const modalInitialValues = {
      channelUrl,
      provider: otherUser,
      sendbirdContext,
    };

    onOpenPaymentModal(modalInitialValues);
  };

  const clickDisabled = !!disabled || fetchUserFromChannelUrlInProgress;

  const rootClass = rootClassName || css.root;
  const buttonClass = className || css.buttonRoot;

  return (
    <div className={rootClass}>
      <Button rootClassName={buttonClass} disabled={clickDisabled} onClick={openStripeModal}>
        Pay
      </Button>
    </div>
  );
};

export default PaymentButton;
