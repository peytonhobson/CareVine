import React from 'react';

import { BookingPayment } from '../../components';

import css from './CheckoutPage.module.css';

const PaymentSection = props => {
  const {
    currentUser,
    hasRequiredData,
    currentListing,
    defaultPaymentFetched,
    defaultPaymentMethods,
    fetchDefaultPaymentError,
    fetchDefaultPaymentInProgress,
    stripeCustomerFetched,
    onChangePaymentMethod,
  } = props;

  // Allow showing page when currentUser is still being downloaded,
  // but show payment form only when user info is loaded.
  const showPaymentForm = !!(currentUser && hasRequiredData && currentListing);

  return (
    <section className={css.paymentContainer}>
      <h2>Payment</h2>
      <p className={css.tinyNoMargin}>*Processing Fees</p>
      <ul className={css.processingFeesList}>
        <li className={css.tinyNoMargin}>Bank Accounts: 0.8%</li>
        <li className={css.tinyNoMargin}>Payment Cards: 2.9% + $0.30</li>
      </ul>
      {showPaymentForm ? (
        <BookingPayment
          defaultPaymentFetched={defaultPaymentFetched}
          defaultPaymentMethods={defaultPaymentMethods}
          fetchDefaultPaymentError={fetchDefaultPaymentError}
          fetchDefaultPaymentInProgress={fetchDefaultPaymentInProgress}
          stripeCustomerFetched={stripeCustomerFetched}
          onChangeSelectedTab={onChangePaymentMethod}
          className={css.paymentMethods}
        />
      ) : null}
    </section>
  );
};

export default PaymentSection;
