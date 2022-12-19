import React from 'react';
import { Button } from '../../../components';
import classNames from 'classnames';

import css from './index.module.css';

const PaymentButton = props => {
  const {
    rootClassName,
    className,
    onOpenPaymentModal,
    otherUser,
    channelUrl,
    sendbirdContext,
    disabled,
    fetchUserFromChannelUrlInProgress,
    // Need to add fetchOtherUserInProgress so the button can be disabled during that time
  } = props;

  const openStripeModal = () => {
    const modalInitialValues = {
      provider: otherUser,
      channelUrl,
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
