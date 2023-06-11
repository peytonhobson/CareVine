import React, { useState } from 'react';

import {
  ButtonTabNavHorizontal,
  NamedLink,
  SavedBankDetails,
  SavedCardDetails,
} from '../../components';
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

import css from './CheckoutPage.module.css';

const BANK_ACCOUNT = 'Bank Account';
const CREDIT_CARD = 'Payment Card';

const checkIsPaymentExpired = existingTransaction => {
  return txIsPaymentExpired(existingTransaction)
    ? true
    : txIsPaymentPending(existingTransaction)
    ? minutesBetween(existingTransaction.attributes.lastTransitionedAt, new Date()) >= 15
    : false;
};

const PaymentSection = props => {
  const [selectedTab, setSelectedTab] = useState(BANK_ACCOUNT);

  const {
    currentUser,
    initiateOrderError,
    hasRequiredData,
    retrievePaymentIntentError,
    existingTransaction,
    currentListing,
    listingTitle,
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

  const tabs = [
    {
      text: BANK_ACCOUNT,
      selected: selectedTab === BANK_ACCOUNT,
      onClick: e => setSelectedTab(e.target.textContent),
    },
    {
      text: CREDIT_CARD,
      selected: selectedTab === CREDIT_CARD,
      onClick: e => setSelectedTab(e.target.textContent),
    },
  ];

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

  let tabContentPanel = null;

  switch (selectedTab) {
    case BANK_ACCOUNT:
      tabContentPanel = (
        <>
          {!!bankAccount ? (
            <SavedBankDetails
              bank={bankAccount}
              deletePaymentMethodError={deletePaymentMethodError}
              deletePaymentMethodInProgress={deletePaymentMethodInProgress}
              deletePaymentMethodSuccess={deletePaymentMethodSuccess}
              onDeleteAccount={handleRemovePaymentMethod}
              onFetchDefaultPayment={onFetchDefaultPayment}
              onManageDisableScrolling={onManageDisableScrolling}
              stripeCustomer={stripeCustomer}
            />
          ) : !!fetchDefaultPaymentError ? (
            fetchDefaultPaymentErrorMessage
          ) : null}
          {showBankForm ? (
            <Elements stripe={stripePromise}>
              <SaveBankAccountForm
                createBankAccountError={createBankAccountError}
                createBankAccountInProgress={createBankAccountInProgress}
                createBankAccountSuccess={createBankAccountSuccess}
                currentUser={currentUser}
                fetchDefaultPaymentInProgress={fetchDefaultPaymentInProgress}
                onFetchDefaultPayment={onFetchDefaultPayment}
                onSubmit={handleBankAccountSubmit}
              />
            </Elements>
          ) : null}
        </>
      );
      break;
    case CREDIT_CARD:
      tabContentPanel = (
        <>
          {!!card ? (
            <SavedCardDetails
              card={ensurePaymentMethodCard(card)}
              deletePaymentMethodInProgress={deletePaymentMethodInProgress}
              deletePaymentMethodSuccess={deletePaymentMethodSuccess}
              onDeleteCard={handleRemovePaymentMethod}
              onFetchDefaultPayment={onFetchDefaultPayment}
              onManageDisableScrolling={onManageDisableScrolling}
              stripeCustomer={stripeCustomer}
            />
          ) : fetchDefaultPaymentError ? (
            fetchDefaultPaymentErrorMessage
          ) : null}
          {showCardForm ? (
            <SaveCreditCardForm
              className={css.paymentForm}
              createCreditCardError={createCreditCardError}
              createCreditCardInProgress={createCreditCardInProgress}
              createCreditCardSuccess={createCreditCardSuccess}
              createStripeCustomerError={createStripeCustomerError}
              deletePaymentMethodError={deletePaymentMethodError}
              formId="PaymentMethodsForm"
              handleCardSetupError={handleCardSetupError}
              handleRemovePaymentMethod={handleRemovePaymentMethod}
              initialValues={initalValuesForStripePayment}
              inProgress={isSubmitting}
              onSubmit={handleCardSubmit}
            />
          ) : null}
        </>
      );
      break;
    default:
      tabContentPanel = null;
      break;
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
      <ButtonTabNavHorizontal
        rootClassName={css.nav}
        tabClassName={css.tab}
        tabContentClass={css.tabContent}
        tabRootClassName={css.tabRoot}
        tabs={tabs}
      />
      {showPaymentForm ? { tabContentPanel } : null}
      {isPaymentExpired ? (
        <p className={css.orderError}>
          <FormattedMessage id="CheckoutPage.paymentExpiredMessage" values={{ listingLink }} />
        </p>
      ) : null}
    </section>
  );
};

export default PaymentSection;
