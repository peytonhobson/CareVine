import React from 'react';
import { Button } from '../../../components';
import classNames from 'classnames';
import { userDisplayNameAsString } from '../../../util/data';

import css from './index.module.css';

const RequestPaymentButton = props => {
  const {
    channelUrl,
    className,
    currentUser,
    disabled,
    onSendRequestForPayment,
    otherUser,
    otherUserListing,
    rootClassName,
    sendbirdContext,
    sendRequestForPaymentError,
    sendRequestForPaymentInProgress,
    sendRequestForPaymentSuccess,
  } = props;

  const clickDisabled = !!disabled || sendRequestForPaymentSuccess;

  const requestPayment = () => {
    if (!sendRequestForPaymentSuccess) {
      const currentUserId = currentUser && currentUser.id && currentUser.id.uuid;
      const customerName = userDisplayNameAsString(otherUser);
      onSendRequestForPayment(
        currentUserId,
        customerName,
        channelUrl,
        sendbirdContext,
        otherUserListing
      );
    }
  };

  const rootClass = rootClassName || css.root;
  const buttonClass = className || css.buttonRoot;

  return (
    <div className={rootClass}>
      <Button
        disabled={clickDisabled}
        inProgress={sendRequestForPaymentInProgress}
        onClick={requestPayment}
        ready={sendRequestForPaymentSuccess}
        rootClassName={buttonClass}
      >
        Request Payment
      </Button>
    </div>
  );
};

export default RequestPaymentButton;
