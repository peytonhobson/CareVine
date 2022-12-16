import React from 'react';
import { storeData } from '../../containers/StripePaymentModal/StripePaymentModalSessionHelpers';
import { setInitialValues } from '../../containers/StripePaymentModal/StripePaymentModal.duck';
import { Button } from '../../components';
import { EMPLOYER } from '../../util/constants';
import classNames from 'classnames';

import css from './PaymentButton.module.css';
import { userDisplayNameAsString } from '../../util/data';

const PaymentButton = props => {
  const {
    rootClassName,
    className,
    onOpenPaymentModal,
    currentUser,
    otherUser,
    channelUrl,
    channelContext,
    onSendRequestForPayment,
    sendRequestForPaymentInProgress,
    sendRequestForPaymentError,
    sendRequestForPaymentSuccess,
  } = props;

  const openStripeModal = () => {
    const modalInitialValues = {
      provider: otherUser,
      channelUrl,
      channelContext,
    };

    storeData(otherUser, channelUrl, 'StripePaymentModal');

    onOpenPaymentModal(modalInitialValues);
  };

  const requestPayment = () => {
    if (!sendRequestForPaymentSuccess) {
      const currenUserId = currentUser && currentUser.id && currentUser.id.uuid;
      const customerName = userDisplayNameAsString(otherUser);
      onSendRequestForPayment(currenUserId, customerName, channelUrl, channelContext);
    }
  };

  const currentUserType =
    currentUser &&
    currentUser.attributes &&
    currentUser.attributes.profile &&
    currentUser.attributes.profile.metadata &&
    currentUser.attributes.profile.metadata.userType;

  const rootClass = rootClassName || css.root;
  const buttonClass = className || css.buttonRoot;

  return (
    <div className={rootClass}>
      {currentUserType === EMPLOYER ? (
        <Button rootClassName={buttonClass} onClick={openStripeModal}>
          Pay
        </Button>
      ) : (
        <Button
          rootClassName={buttonClass}
          inProgress={sendRequestForPaymentInProgress}
          ready={sendRequestForPaymentSuccess}
          onClick={requestPayment}
        >
          Request Payment
        </Button>
      )}
    </div>
  );
};

export default PaymentButton;
