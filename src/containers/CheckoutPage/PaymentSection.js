import React from 'react';

import SavePaymentMethodsContainer from '../SavePaymentMethodsContainer/SavePaymentMethodsContainer';

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
      <p className={css.tinyNoMargin}>
        *A 3% fee will be added to transactions that use payment cards.
      </p>
      {showPaymentForm ? (
        <SavePaymentMethodsContainer
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
