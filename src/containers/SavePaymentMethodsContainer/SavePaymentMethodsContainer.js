import React, { useState } from 'react';

import { compose } from 'redux';
import { connect } from 'react-redux';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { FormattedMessage, injectIntl } from '../../util/reactIntl';
import { ensureCurrentUser, ensureStripeCustomer, ensurePaymentMethodCard } from '../../util/data';
import classNames from 'classnames';
import {
  deletePaymentMethod,
  createBankAccount,
  createCreditCard,
  fetchDefaultPayment,
} from '../../ducks/paymentMethods.duck';
import { manageDisableScrolling, isScrollingDisabled } from '../../ducks/UI.duck';
import { SavedCardDetails, ButtonTabNavHorizontal, SavedBankDetails } from '../../components';
import { SaveBankAccountForm, SaveCreditCardForm } from '../../forms';
import config from '../../config';

import css from './SavePaymentMethodsContainer.module.css';

const BANK_ACCOUNT = 'Bank Account';
const CREDIT_CARD = 'Payment Card';
const stripePromise = loadStripe(config.stripe.publishableKey);

const SavePaymentMethodsContainerComponent = props => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTab, setSelectedTab] = useState(BANK_ACCOUNT);

  const {
    createBankAccountError,
    createBankAccountInProgress,
    createBankAccountSuccess,
    createCreditCardError,
    createCreditCardInProgress,
    createCreditCardSuccess,
    createStripeCustomerError,
    currentUser,
    defaultPaymentFetched,
    defaultPaymentMethods,
    deletePaymentMethodError,
    deletePaymentMethodInProgress,
    deletePaymentMethodSuccess,
    fetchDefaultPaymentError,
    fetchDefaultPaymentInProgress,
    handleCardSetupError,
    onCreateBankAccount,
    onCreateCreditCard,
    onDeletePaymentMethod,
    onFetchDefaultPayment,
    onManageDisableScrolling,
    onChangeSelectedTab,
    rootClassName,
    className,
  } = props;

  const ensuredCurrentUser = ensureCurrentUser(currentUser);

  const card = defaultPaymentMethods?.card?.card;
  const bankAccount = defaultPaymentMethods?.bankAccount?.us_bank_account;
  const stripeCustomer = ensureStripeCustomer(ensuredCurrentUser.stripeCustomer);
  const stripeCustomerId = stripeCustomer.attributes.stripeCustomerId;

  const getBillingDetails = (currentUser, formValues) => {
    const { name, addressLine1, addressLine2, postal, city } = formValues;
    const addressMaybe =
      addressLine1 && postal
        ? {
            address: {
              city: city,
              country: 'US',
              line1: addressLine1,
              line2: addressLine2,
              postal_code: postal,
            },
          }
        : {};
    const billingDetails = {
      name,
      email: ensureCurrentUser(currentUser).attributes.email,
      ...addressMaybe,
    };

    return billingDetails;
  };

  const handleBankAccountSubmit = stripe => {
    if (!createBankAccountInProgress && !fetchDefaultPaymentInProgress) {
      onCreateBankAccount(stripeCustomerId, stripe, currentUser);
    }
  };

  const handleCardSubmit = params => {
    setIsSubmitting(true);

    const { stripe, card, formValues } = params;

    const billingDetails = getBillingDetails(currentUser, formValues);

    onCreateCreditCard(stripeCustomerId, stripe, billingDetails, card)
      .then(() => {
        // Update default payment methods
        onFetchDefaultPayment(stripeCustomerId);
        setIsSubmitting(false);
      })
      .catch(error => {
        console.error(error);
        setIsSubmitting(false);
      });
  };

  const handleRemovePaymentMethod = methodType => {
    const paymentMethodId =
      methodType === 'card'
        ? !!defaultPaymentMethods && !!defaultPaymentMethods.card && defaultPaymentMethods.card.id
        : !!defaultPaymentMethods &&
          !!defaultPaymentMethods.bankAccount &&
          defaultPaymentMethods.bankAccount.id;

    onDeletePaymentMethod(paymentMethodId);
  };

  // Get first and last name of the current user and use it in the StripePaymentForm to autofill the name field
  const userName = `${ensuredCurrentUser.attributes.profile.firstName} ${ensuredCurrentUser.attributes.profile.lastName}`;

  const initalValuesForStripePayment = { name: userName };

  const handleSelectedTab = e => {
    if (onChangeSelectedTab) {
      onChangeSelectedTab(e.target.textContent);
    }

    setSelectedTab(e.target.textContent);
  };

  const tabs = [
    {
      text: BANK_ACCOUNT,
      selected: selectedTab === BANK_ACCOUNT,
      onClick: handleSelectedTab,
    },
    {
      text: CREDIT_CARD,
      selected: selectedTab === CREDIT_CARD,
      onClick: handleSelectedTab,
    },
  ];

  const showBankForm =
    (!bankAccount && defaultPaymentFetched && !fetchDefaultPaymentError) || !stripeCustomerId;
  const showCardForm =
    (!card && defaultPaymentFetched && !fetchDefaultPaymentError) || !stripeCustomerId;

  const fetchDefaultPaymentErrorMessage = (
    <p className={css.error}>
      <FormattedMessage id="PaymentMethodsPage.fetchDefaultPaymentErrorMessage" />
    </p>
  );

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

  const classes = classNames(rootClassName || css.root, className);

  return (
    <div className={css.root}>
      <ButtonTabNavHorizontal
        rootClassName={css.nav}
        tabClassName={css.tab}
        tabContentClass={css.tabContent}
        tabRootClassName={css.tabRoot}
        tabs={tabs}
      />
      <div className={css.tabContentPanel}>{tabContentPanel}</div>
    </div>
  );
};

const mapStateToProps = state => {
  const { currentUser, currentUserListing } = state.user;

  const {
    createBankAccountError,
    createBankAccountInProgress,
    createBankAccountSuccess,
    createCreditCardError,
    createCreditCardInProgress,
    createCreditCardSuccess,
    createStripeCustomerError,
    deletePaymentMethodError,
    deletePaymentMethodInProgress,
    deletePaymentMethodSuccess,
  } = state.paymentMethods;

  return {
    createBankAccountError,
    createBankAccountInProgress,
    createBankAccountSuccess,
    createCreditCardError,
    createCreditCardInProgress,
    createCreditCardSuccess,
    createStripeCustomerError,
    currentUser,
    deletePaymentMethodError,
    deletePaymentMethodInProgress,
    deletePaymentMethodSuccess,
    scrollingDisabled: isScrollingDisabled(state),
    currentUserListing,
  };
};

const mapDispatchToProps = dispatch => ({
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
  onDeletePaymentMethod: paymentMethodId => dispatch(deletePaymentMethod(paymentMethodId)),
  onFetchDefaultPayment: stripeCustomerId => dispatch(fetchDefaultPayment(stripeCustomerId)),
  onCreateBankAccount: (stripeCustomerId, stripe, currentUser) =>
    dispatch(createBankAccount(stripeCustomerId, stripe, currentUser)),
  onCreateCreditCard: (stripeCustomerId, stripe, billingDetails, card) =>
    dispatch(createCreditCard(stripeCustomerId, stripe, billingDetails, card)),
});

const SavePaymentMethodsContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(SavePaymentMethodsContainerComponent);

export default SavePaymentMethodsContainer;
