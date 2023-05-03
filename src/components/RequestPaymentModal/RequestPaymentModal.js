import React from 'react';

import { UserListingPreview, Modal } from '../../components';
import { RequestPaymentForm } from '../../forms';

import css from './RequestPaymentModal.module.css';
import classNames from 'classnames';

const checkIfRequestInLastDay = (currentUser, otherUserId) => {
  const sentRequestsForPayment =
    currentUser.attributes.profile.privateData?.sentRequestsForPayment || [];

  const withinLastDay =
    sentRequestsForPayment.find(notification => notification.userId === otherUserId)?.createdAt >
    Date.now() - 24 * 60 * 60 * 1000;

  return withinLastDay;
};

const RequestPaymentModal = props => {
  const {
    currentUser,
    intl,
    onHandleClose,
    isOpen,
    otherUser,
    otherUserListing,
    onSendRequestForPayment,
    conversationId,
    sendRequestForPaymentError,
    sendRequestForPaymentInProgress,
    sendRequestForPaymentSuccess,
    onManageDisableScrolling,
  } = props;

  const requestPayment = values => {
    const { amount } = values;
    onSendRequestForPayment(
      currentUser,
      conversationId,
      otherUserListing,
      otherUser,
      amount.amount
    );
  };

  const requestedInLastDay = checkIfRequestInLastDay(currentUser, otherUser.id.uuid);

  const requestDisabled =
    !currentUser.stripeAccount?.id ||
    !conversationId ||
    !otherUser ||
    sendRequestForPaymentInProgress ||
    requestedInLastDay ||
    sendRequestForPaymentSuccess === otherUser?.id?.uuid;

  return (
    <Modal
      containerClassName={css.modalContainer}
      id="requestPaymentModal"
      isOpen={isOpen}
      onClose={onHandleClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
    >
      <div className={css.root}>
        <UserListingPreview
          intl={intl}
          otherUser={otherUser}
          otherUserListing={otherUserListing}
          rootClassName={css.userPreviewRoot}
        />
        <RequestPaymentForm
          className={css.requestPaymentForm}
          onSubmit={requestPayment}
          noStripeAcount={!currentUser?.stripeAccount?.id}
          sendRequestForPaymentError={sendRequestForPaymentError}
          sendRequestForPaymentInProgress={sendRequestForPaymentInProgress}
          sendRequestForPaymentSuccess={sendRequestForPaymentSuccess}
          requestedInLastDay={requestedInLastDay}
          requestDisabled={requestDisabled}
          otherUser={otherUser}
          key={otherUser?.id?.uuid}
        />
      </div>
    </Modal>
  );
};

export default RequestPaymentModal;
