import React, { useEffect, useState } from 'react';

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
import {
  SavedCardDetails,
  ButtonTabNavHorizontal,
  SavedPaymentDetails,
  InlineTextButton,
  IconSpinner,
} from '..';
import { SaveBankAccountForm, SaveCreditCardForm, StripePaymentForm } from '../../forms';
import config from '../../config';

import css from './PaymentMethods.module.css';

const BANK_ACCOUNT = 'Bank Account';
const CREDIT_CARD = 'Payment Card';
const stripePromise = loadStripe(config.stripe.publishableKey);

const BookingPaymentComponent = props => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTab, setSelectedTab] = useState(BANK_ACCOUNT);
  const [useDifferentMethod, setUseDifferentMethod] = useState(false);

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
    deletedPaymentMethod,
    fetchDefaultPaymentError,
    fetchDefaultPaymentInProgress,
    handleCardSetupError,
    onCreateBankAccount,
    onCreateCreditCard,
    onDeletePaymentMethod,
    onFetchDefaultPayment,
    onManageDisableScrolling,
    onChangePaymentMethod,
    rootClassName,
    className,
    removeDisabled,
  } = props;

  const ensuredCurrentUser = ensureCurrentUser(currentUser);

  const cards = defaultPaymentMethods?.cards;
  const bankAccounts = defaultPaymentMethods?.bankAccounts;
  const stripeCustomer = ensureStripeCustomer(ensuredCurrentUser.stripeCustomer);
  const stripeCustomerId = stripeCustomer.attributes.stripeCustomerId;

  useEffect(() => {
    setUseDifferentMethod(false);
  }, [bankAccounts?.length, cards?.length]);

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

  const handleRemovePaymentMethod = paymentMethod => {
    if (!deletePaymentMethodInProgress || removeDisabled) {
      onDeletePaymentMethod(paymentMethod.id);
    }
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

  // Get first and last name of the current user and use it in the StripePaymentForm to autofill the name field
  const userName = `${ensuredCurrentUser.attributes.profile.firstName} ${ensuredCurrentUser.attributes.profile.lastName}`;

  const initalValuesForStripePayment = { name: userName };

  const handleChangePaymentMethod = paymentMethod => {
    if (onChangePaymentMethod) {
      onChangePaymentMethod(paymentMethod);
    }

    setUseDifferentMethod(false);
  };

  const handleUseDifferentMethod = () => {
    setUseDifferentMethod(true);

    if (onChangePaymentMethod) {
      onChangePaymentMethod();
    }
  };

  const handleSelectedTab = e => {
    setSelectedTab(e.target.textContent);
    setUseDifferentMethod(false);
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
          {bankAccounts && defaultPaymentFetched && !useDifferentMethod ? (
            <>
              <SavedPaymentDetails
                rootClassName={css.defaultMethod}
                methods={bankAccounts}
                onManageDisableScrolling={onManageDisableScrolling}
                onChange={handleChangePaymentMethod}
                deletePaymentMethodError={deletePaymentMethodError}
                deletePaymentMethodInProgress={deletePaymentMethodInProgress}
                deletedPaymentMethod={deletedPaymentMethod}
                removeDisabled={removeDisabled}
                onDeleteMethod={handleRemovePaymentMethod}
                methodType={BANK_ACCOUNT}
                stripeCustomer={stripeCustomer}
                onFetchDefaultPayment={onFetchDefaultPayment}
              />
              <InlineTextButton
                onClick={handleUseDifferentMethod}
                className={css.paymentSwitch}
                type="button"
              >
                Add a new Bank Account
              </InlineTextButton>
            </>
          ) : !!fetchDefaultPaymentError ? (
            fetchDefaultPaymentErrorMessage
          ) : (
            <>
              <Elements stripe={stripePromise}>
                <SaveBankAccountForm
                  createBankAccountError={createBankAccountError}
                  createBankAccountInProgress={createBankAccountInProgress}
                  createBankAccountSuccess={createBankAccountSuccess}
                  currentUser={currentUser}
                  fetchDefaultPaymentInProgress={fetchDefaultPaymentInProgress}
                  onFetchDefaultPayment={onFetchDefaultPayment}
                  onSubmit={handleBankAccountSubmit}
                  className={css.saveBankAccountForm}
                />
              </Elements>
              {bankAccounts?.length > 0 ? (
                <InlineTextButton
                  onClick={() => setUseDifferentMethod(false)}
                  className={css.paymentSwitch}
                  type="button"
                >
                  Use saved Bank Account
                </InlineTextButton>
              ) : null}
            </>
          )}
        </>
      );
      break;
    case CREDIT_CARD:
      tabContentPanel = (
        <>
          {cards?.length > 0 && defaultPaymentFetched && !useDifferentMethod ? (
            <div className={css.defaultMethodContainer}>
              <SavedPaymentDetails
                rootClassName={css.defaultMethod}
                methods={cards}
                onManageDisableScrolling={onManageDisableScrolling}
                type="card"
                onChange={handleChangePaymentMethod}
                deletePaymentMethodError={deletePaymentMethodError}
                deletePaymentMethodInProgress={deletePaymentMethodInProgress}
                deletedPaymentMethod={deletedPaymentMethod}
                removeDisabled={removeDisabled}
                onDeleteMethod={handleRemovePaymentMethod}
                methodType={CREDIT_CARD}
                stripeCustomer={stripeCustomer}
                onFetchDefaultPayment={onFetchDefaultPayment}
              />
              <InlineTextButton
                onClick={handleUseDifferentMethod}
                className={css.paymentSwitch}
                type="button"
              >
                Add a new Payment Card
              </InlineTextButton>
            </div>
          ) : fetchDefaultPaymentError ? (
            fetchDefaultPaymentErrorMessage
          ) : fetchDefaultPaymentInProgress ? (
            <IconSpinner />
          ) : (
            <>
              {cards?.length > 0 ? (
                <InlineTextButton
                  onClick={() => setUseDifferentMethod(false)}
                  className={css.paymentSwitch}
                  type="button"
                >
                  Use saved Payment Card
                </InlineTextButton>
              ) : null}
              <SaveCreditCardForm
                className={css.paymentForm}
                createCreditCardError={createCreditCardError}
                createCreditCardInProgress={createCreditCardInProgress}
                createCreditCardSuccess={createCreditCardSuccess}
                createStripeCustomerError={createStripeCustomerError}
                deletePaymentMethodError={deletePaymentMethodError}
                formId="PaymentMethodsForm"
                handleCardSetupError={handleCardSetupError}
                initialValues={initalValuesForStripePayment}
                inProgress={isSubmitting}
                onSubmit={handleCardSubmit}
              />
            </>
          )}
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
    deletedPaymentMethod,
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
    deletedPaymentMethod,
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

const PaymentMethods = compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(BookingPaymentComponent);

export default PaymentMethods;
