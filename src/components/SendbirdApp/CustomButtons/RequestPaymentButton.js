import React, { useState } from 'react';

import { Button } from '../../../components';
import classNames from 'classnames';
import { userDisplayNameAsString } from '../../../util/data';

import css from './index.module.css';
import { useEffect } from 'react';

const checkIfRequestInLastDay = messages => {
  let withinADay = false;

  messages &&
    messages
      .filter(message => {
        return message.customType === 'REQUEST_FOR_PAYMENT';
      })
      .forEach(message => {
        if (new Date(message.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
          withinADay = true;
        }
      });
  return withinADay;
};

const RequestPaymentButton = props => {
  const {
    channelContext,
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
    !!disabled ||
    channelContext.allMessages.length === 0 ||
    checkIfRequestInLastDay(channelContext.allMessages);

  const requestPayment = () => {
    if (!paymentRequestedForUser) {
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
        ready={paymentRequestedForUser}
        rootClassName={buttonClass}
      >
        Request Payment
      </Button>
    </div>
  );
};

export default RequestPaymentButton;
