import React from 'react';
import { Button } from '../../../components';
import classNames from 'classnames';
import { userDisplayNameAsString } from '../../../util/data';

import css from './index.module.css';

const RequestPaymentButton = props => {
  const {
    rootClassName,
    className,
    currentUser,
    otherUser,
    otherUserListing,
    channelUrl,
    sendbirdContext,
    disabled,
    onSendRequestForPayment,
    sendRequestForPaymentInProgress,
    sendRequestForPaymentError,
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
        rootClassName={buttonClass}
        inProgress={sendRequestForPaymentInProgress}
        ready={sendRequestForPaymentSuccess}
        onClick={requestPayment}
        disabled={clickDisabled}
      >
        Request Payment
      </Button>
    </div>
  );
};

export default RequestPaymentButton;
