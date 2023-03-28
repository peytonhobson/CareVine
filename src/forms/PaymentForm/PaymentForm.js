import React, { useEffect, useState, useMemo, Fragment } from 'react';

import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

import { Button, Checkbox, SavedCardDetails, SavedBankDetails, Form } from '../../components';
import { FormattedMessage } from '../../util/reactIntl';
import { ensureStripeCustomer, ensurePaymentMethodCard } from '../../util/data';

import css from './PaymentForm.module.css';

const STRIPE_INVALID_REQUEST_ERROR = 'StripeInvalidRequestError';
const STRIPE_CARD_ERROR = 'card_error';

const BANK_ACCOUNT_LABEL = 'Bank Account';
const CREDIT_CARD_LABEL = 'Credit Card';

const PaymentForm = props => {
  const {
    confirmPaymentError,
    confirmPaymentInProgress,
    confirmPaymentSuccess,
    currentUser,
    defaultPaymentMethods,
    defaultPaymentFetched,
    fetchDefaultPaymentError,
    fetchDefaultPaymentInProgress,
    intl,
    onFetchDefaultPayment,
    onManageDisableScrolling,
    onPaymentSubmit,
    paymentIntent,
    selectedPaymentMethod,
    onElementReady,
  } = props;

  const stripe = useStripe();
  const elements = useElements();

  const [errorMessage, setErrorMessage] = useState(null);
  const [isElementsComplete, setIsElementsComplete] = useState(false);
  const [showDefaultPayment, setShowDefaultPayment] = useState(false);
  const [saveDefaultPayment, setSaveDefaultPayment] = useState(false);

  const stripeCustomer = currentUser?.stripeCustomer;

  useEffect(() => {
    if (stripeCustomer) {
      const stripeCustomerId = stripeCustomer?.attributes?.stripeCustomerId;
      onFetchDefaultPayment(stripeCustomerId);
    }
  }, [stripeCustomer]);

  useEffect(() => {
    if (
      !!defaultPaymentMethods &&
      ((selectedPaymentMethod === 'creditCard' && !!defaultPaymentMethods.card) ||
        (selectedPaymentMethod === 'bankAccount' && !!defaultPaymentMethods.bankAccount))
    ) {
      setShowDefaultPayment(true);
    }
  }, [defaultPaymentMethods]);

  const handlePaymentChange = element => {
    if (element && element.complete) {
      setIsElementsComplete(true);
    }
  };

  const handleDefaultCheckboxChange = event => {
    setSaveDefaultPayment(event.target.checked);
  };

  const onHandleSubmit = e => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    onPaymentSubmit(
      stripe,
      elements,
      saveDefaultPayment,
      showDefaultPayment,
      selectedPaymentMethod
    );
  };

  const displayErrorMessage = confirmPaymentError => {
    // NOTE: Error messages from Stripes are not part of translations.
    // By default they are in English.
    let errorId = null;
    switch (confirmPaymentError.type) {
      case STRIPE_CARD_ERROR:
        errorId = 'PaymentForm.stripePaymentMethodErrorMessage';
        break;
      case STRIPE_INVALID_REQUEST_ERROR:
        errorId = 'PaymentForm.stripeInvalidRequestErrorMessage';
        break;
      default:
        errorId = 'PaymentForm.stripeOtherErrorMessage';
        break;
    }

    const stripeErrorMessage = confirmPaymentError.message;
    setErrorMessage(
      <p className={css.orderError}>
        <FormattedMessage id={errorId} values={{ stripeErrorMessage }} />
      </p>
    );
  };

  useMemo(() => {
    if (confirmPaymentError) {
      displayErrorMessage(confirmPaymentError);
    }
  }, [confirmPaymentError]);

  const paymentElementOptions = {
    layout: 'tabs',
    fields: {
      billingDetails: {
        address: {
          country: 'never',
        },
      },
    },
  };

  const card =
    !!defaultPaymentMethods && !!defaultPaymentMethods.card && defaultPaymentMethods.card.card;
  const bankAccount =
    !!defaultPaymentMethods &&
    !!defaultPaymentMethods.bankAccount &&
    defaultPaymentMethods.bankAccount.us_bank_account;

  const submitInProgress = confirmPaymentInProgress;
  const submitDisabled = submitInProgress || (!isElementsComplete && !showDefaultPayment);

  const buttonMessage = intl.formatMessage({ id: 'PaymentForm.paymentButtonMessage' });
  const selectedPaymentMethodLabel =
    selectedPaymentMethod === 'creditCard' ? CREDIT_CARD_LABEL : BANK_ACCOUNT_LABEL;
  const saveDefaultPaymentCheckboxLabel = intl.formatMessage(
    {
      id: 'PaymentForm.saveDefaultPaymentCheckboxLabel',
    },
    {
      paymentMethod: selectedPaymentMethodLabel.toLocaleLowerCase(),
    }
  );

  return (
    <Form onSubmit={onHandleSubmit} className={css.root}>
      {defaultPaymentFetched && (
        <div className={css.paymentElementContainer}>
          {showDefaultPayment ? (
            <div className={css.defaultPaymentMethodsContainer}>
              <p className={css.defaultPaymentTitle}>
                <FormattedMessage
                  id="PaymentForm.useDefaultMethodTitle"
                  values={{
                    paymentMethod: selectedPaymentMethodLabel,
                  }}
                />
              </p>
              {card && selectedPaymentMethod === 'creditCard' && (
                <SavedCardDetails
                  rootClassName={css.defaultMethod}
                  card={ensurePaymentMethodCard(card)}
                  onManageDisableScrolling={onManageDisableScrolling}
                  hideContent={true}
                  selected={true}
                />
              )}
              {bankAccount && selectedPaymentMethod === 'bankAccount' && (
                <SavedBankDetails
                  rootClassName={css.defaultMethod}
                  bank={bankAccount}
                  onManageDisableScrolling={onManageDisableScrolling}
                  hideContent={true}
                  selected={true}
                />
              )}
              <p
                className={css.changeDefaultText}
                onClick={() => {
                  setShowDefaultPayment(false);
                  setSaveDefaultPayment(false);
                }}
              >
                <FormattedMessage
                  id="PaymentForm.useDifferentPaymentMethod"
                  values={{
                    paymentMethod: selectedPaymentMethodLabel.toLocaleLowerCase(),
                  }}
                />
              </p>
            </div>
          ) : (
            <Fragment>
              <p className={css.defaultPaymentTitle}>
                <FormattedMessage
                  id="PaymentForm.newPaymentMethodTitle"
                  values={{ paymentMethod: selectedPaymentMethodLabel }}
                />
              </p>
              <PaymentElement
                options={paymentElementOptions}
                id="payment-element"
                onChange={element => {
                  handlePaymentChange(element);
                }}
                className={css.paymentElement}
                onReady={onElementReady}
              />

              <Checkbox
                id="saveDefault"
                name="saveDefault"
                label={saveDefaultPaymentCheckboxLabel}
                onChange={handleDefaultCheckboxChange}
                value={saveDefaultPayment}
                className={css.checkbox}
              />

              {((defaultPaymentMethods?.card && selectedPaymentMethod === 'creditCard') ||
                (defaultPaymentMethods?.bankAccount &&
                  selectedPaymentMethod === 'bankAccount')) && (
                <p className={css.changeDefaultText} onClick={() => setShowDefaultPayment(true)}>
                  <FormattedMessage
                    id="PaymentForm.useDefaultPaymentMethod"
                    values={{ paymentMethod: selectedPaymentMethodLabel.toLocaleLowerCase() }}
                  />
                </p>
              )}
            </Fragment>
          )}
        </div>
      )}
      {errorMessage}
      {defaultPaymentFetched && (
        <div className={css.paymentButtonContainer}>
          <Button
            rootClassName={css.paymentButtonRoot}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
          >
            {buttonMessage}
          </Button>
        </div>
      )}
    </Form>
  );
};

export default PaymentForm;
