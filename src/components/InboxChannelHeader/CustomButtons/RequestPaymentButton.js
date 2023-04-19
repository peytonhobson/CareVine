import React, { useState } from 'react';

import { Button } from '../../../components';
import classNames from 'classnames';
import { userDisplayNameAsString } from '../../../util/data';

import css from './index.module.css';
import { useEffect } from 'react';

const checkIfRequestInLastDay = (currentUser, otherUserId) => {
  const sentRequestsForPayment =
    currentUser.attributes.profile.privateData?.sentRequestsForPayment || [];

  const withinLastDay =
    sentRequestsForPayment.find(notification => notification.userId === otherUserId)?.createdAt >
    Date.now() - 24 * 60 * 60 * 1000;

  return withinLastDay;
};

const RequestPaymentButton = props => {
  const {
    className,
    currentUser,
    disabled,
    onSendRequestForPayment,
    otherUser,
    otherUserListing,
    rootClassName,
    sendRequestForPaymentError,
    sendRequestForPaymentInProgress,
    sendRequestForPaymentSuccess,
    conversationId,
  } = props;

  const [paymentRequestedForUser, setPaymentRequestedForUser] = useState(false);
  const [currentOtherUser, setCurrentOtherUser] = useState(otherUser);

  useEffect(() => {
    if (
      (otherUser && otherUser.id.uuid) !== (currentOtherUser && currentOtherUser.id.uuid) ||
      !sendRequestForPaymentSuccess
    ) {
      setPaymentRequestedForUser(false);
      setCurrentOtherUser(otherUser);
    } else if (sendRequestForPaymentSuccess) {
      setPaymentRequestedForUser(true);
    }
  }, [sendRequestForPaymentSuccess, otherUser]);

  const clickDisabled =
    !!disabled || !currentUser.stripeAccount?.id || !conversationId || sendRequestForPaymentSuccess;
  checkIfRequestInLastDay(currentUser, otherUser.id.uuid);

  const requestPayment = () => {
    if (!paymentRequestedForUser) {
      onSendRequestForPayment(currentUser, conversationId, otherUserListing, otherUser);
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
        ready={paymentRequestedForUser}
        rootClassName={buttonClass}
      >
        Request Payment
      </Button>
    </div>
  );
};

export default RequestPaymentButton;
