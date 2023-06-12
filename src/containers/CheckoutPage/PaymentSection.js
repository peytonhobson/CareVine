import React, { useState } from 'react';

import { ButtonTabNavHorizontal, NamedLink } from '../../components';
import { FormattedMessage } from 'react-intl';
import {
  isTransactionInitiateAmountTooLowError,
  isTransactionInitiateListingNotFoundError,
  isTransactionInitiateMissingStripeAccountError,
  isTransactionInitiateBookingTimeNotAvailableError,
  isTransactionChargeDisabledError,
  isTransactionZeroPaymentError,
  transactionInitiateOrderStripeErrors,
} from '../../util/errors';
import { createSlug } from '../../util/urlHelpers';
import { TRANSITION_ENQUIRE, txIsPaymentPending, txIsPaymentExpired } from '../../util/transaction';
import { minutesBetween } from '../../util/dates';
import SavePaymentMethodsContainer from '../SavePaymentMethodsContainer/SavePaymentMethodsContainer';

import css from './CheckoutPage.module.css';

const checkIsPaymentExpired = existingTransaction => {
  return txIsPaymentExpired(existingTransaction)
    ? true
    : txIsPaymentPending(existingTransaction)
    ? minutesBetween(existingTransaction.attributes.lastTransitionedAt, new Date()) >= 15
    : false;
};

const PaymentSection = props => {
  const {
    currentUser,
    initiateOrderError,
    hasRequiredData,
    retrievePaymentIntentError,
    existingTransaction,
    currentListing,
    listingTitle,
    defaultPaymentFetched,
    defaultPaymentMethods,
    fetchDefaultPaymentError,
    fetchDefaultPaymentInProgress,
    stripeCustomerFetched,
  } = props;

  // Since the listing data is already given from the ListingPage
  // and stored to handle refreshes, it might not have the possible
  // deleted or closed information in it. If the transaction
  // initiate or the speculative initiate fail due to the listing
  // being deleted or closec, we should dig the information from the
  // errors and not the listing data.
  const listingNotFound = isTransactionInitiateListingNotFoundError(initiateOrderError);
  const isPaymentExpired = checkIsPaymentExpired(existingTransaction);
  const isAmountTooLowError = isTransactionInitiateAmountTooLowError(initiateOrderError);
  const isChargeDisabledError = isTransactionChargeDisabledError(initiateOrderError);
  const isBookingTimeNotAvailableError = isTransactionInitiateBookingTimeNotAvailableError(
    initiateOrderError
  );
  const stripeErrors = transactionInitiateOrderStripeErrors(initiateOrderError);

  const listingLink = (
    <NamedLink
      name="ListingPage"
      params={{ id: currentListing.id.uuid, slug: createSlug(listingTitle) }}
    >
      <FormattedMessage id="CheckoutPage.errorlistingLinkText" />
    </NamedLink>
  );

  // Allow showing page when currentUser is still being downloaded,
  // but show payment form only when user info is loaded.
  const showPaymentForm = !!(
    currentUser &&
    hasRequiredData &&
    !listingNotFound &&
    !initiateOrderError &&
    !retrievePaymentIntentError &&
    !isPaymentExpired
  );

  let initiateOrderErrorMessage = null;
  let listingNotFoundErrorMessage = null;

  if (listingNotFound) {
    listingNotFoundErrorMessage = (
      <p className={css.notFoundError}>
        <FormattedMessage id="CheckoutPage.listingNotFoundError" />
      </p>
    );
  } else if (isAmountTooLowError) {
    initiateOrderErrorMessage = (
      <p className={css.orderError}>
        <FormattedMessage id="CheckoutPage.initiateOrderAmountTooLow" />
      </p>
    );
  } else if (isBookingTimeNotAvailableError) {
    initiateOrderErrorMessage = (
      <p className={css.orderError}>
        <FormattedMessage id="CheckoutPage.bookingTimeNotAvailableMessage" />
      </p>
    );
  } else if (isChargeDisabledError) {
    initiateOrderErrorMessage = (
      <p className={css.orderError}>
        <FormattedMessage id="CheckoutPage.chargeDisabledMessage" />
      </p>
    );
  } else if (stripeErrors && stripeErrors.length > 0) {
    // NOTE: Error messages from Stripes are not part of translations.
    // By default they are in English.
    const stripeErrorsAsString = stripeErrors.join(', ');
    initiateOrderErrorMessage = (
      <p className={css.orderError}>
        <FormattedMessage
          id="CheckoutPage.initiateOrderStripeError"
          values={{ stripeErrors: stripeErrorsAsString }}
        />
      </p>
    );
  } else if (initiateOrderError) {
    // Generic initiate order error
    initiateOrderErrorMessage = (
      <p className={css.orderError}>
        <FormattedMessage id="CheckoutPage.initiateOrderError" values={{ listingLink }} />
      </p>
    );
  }

  return (
    <section className={css.paymentContainer}>
      <h2>Payment</h2>
      {initiateOrderErrorMessage}
      {listingNotFoundErrorMessage}
      {retrievePaymentIntentError ? (
        <p className={css.orderError}>
          <FormattedMessage
            id="CheckoutPage.retrievingStripePaymentIntentFailed"
            values={{ listingLink }}
          />
        </p>
      ) : null}
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
        />
      ) : null}
      {isPaymentExpired ? (
        <p className={css.orderError}>
          <FormattedMessage id="CheckoutPage.paymentExpiredMessage" values={{ listingLink }} />
        </p>
      ) : null}
    </section>
  );
};

export default PaymentSection;
