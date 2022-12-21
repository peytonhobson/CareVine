import React, { useEffect, useState, useMemo, Fragment } from 'react';

import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

import { Button, Checkbox, SavedCardDetails, Form } from '../../components';
import { FormattedMessage } from '../../util/reactIntl';
import { ensureStripeCustomer, ensurePaymentMethodCard } from '../../util/data';

import css from './PaymentForm.module.css';

const STRIPE_INVALID_REQUEST_ERROR = 'StripeInvalidRequestError';
const STRIPE_CARD_ERROR = 'card_error';

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
  } = props;

  const stripe = useStripe();
  const elements = useElements();

  const [errorMessage, setErrorMessage] = useState(null);
  const [isElementsComplete, setIsElementsComplete] = useState(false);
  const [showDefaultPayment, setShowDefaultPayment] = useState(false);
  const [saveDefaultPayment, setSaveDefaultPayment] = useState(false);
  const [showCardPayment, setShowCardPayment] = useState(false);

  useEffect(() => {
    onFetchDefaultPayment(
      ensureStripeCustomer(currentUser.stripeCustomer).attributes.stripeCustomerId
    );
  }, []);

  useEffect(() => {
    if (!!defaultPaymentMethods) {
      setShowDefaultPayment(true);
    }
  }, [defaultPaymentMethods]);

  const handlePaymentChange = element => {
    if (element && element.complete) {
      setIsElementsComplete(true);
    }

    if (element && element.value.type === 'us_bank_account') {
      setShowCardPayment(false);
    }

    if (element && element.value.type === 'card') {
      setShowCardPayment(true);
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

    const methodType = showCardPayment ? 'card' : 'bank_account';

    onPaymentSubmit(stripe, elements, saveDefaultPayment, showDefaultPayment, methodType);
  };

  const displayErrorMessage = confirmPaymentError => {
    // NOTE: Error messages from Stripes are not part of translations.
    // By default they are in English.
    let errorId = null;
    switch (confirmPaymentError.type) {
      case STRIPE_CARD_ERROR:
        errorId = 'PaymentForm.stripeCardErrorMessage';
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
    paymentMethodOrder: ['bank', 'card'],
    fields: {
      billingDetails: {
        address: {
          country: 'never',
        },
      },
    },
  };

  const submitInProgress = confirmPaymentInProgress;
  const submitDisabled = submitInProgress || (!isElementsComplete && !showDefaultPayment);

  const buttonMessage = intl.formatMessage({ id: 'PaymentForm.paymentButtonMessage' });

  return (
    <Form onSubmit={onHandleSubmit} className={css.root}>
      {defaultPaymentFetched && (
        <div className={css.paymentElementContainer}>
          {showDefaultPayment ? (
            <Fragment>
              <p className={css.defaultPaymentTitle}>
                <FormattedMessage id="PaymentForm.useDefaultMethod" />
              </p>
              <SavedCardDetails
                card={ensurePaymentMethodCard(
                  defaultPaymentMethods &&
                    defaultPaymentMethods.card &&
                    defaultPaymentMethods.card.card
                )}
                onManageDisableScrolling={onManageDisableScrolling}
                hideContent={true}
              />
              <p
                className={css.changeDefaultText}
                onClick={() => {
                  setShowDefaultPayment(false);
                  setSaveDefaultPayment(false);
                }}
              >
                <FormattedMessage id="PaymentForm.useDifferentCard" />
              </p>
            </Fragment>
          ) : (
            <Fragment>
              <PaymentElement
                options={paymentElementOptions}
                id="payment-element"
                onChange={element => {
                  handlePaymentChange(element);
                }}
                className={css.paymentElement}
              />

              <Checkbox
                id="saveDefault"
                name="saveDefault"
                label="Save this payment method"
                onChange={handleDefaultCheckboxChange}
                value={saveDefaultPayment}
                className={css.checkbox}
              />
              {/* Change this to match option for default bank account */}
              {defaultPaymentMethods &&
                (defaultPaymentMethods.card || defaultPaymentMethods.bankAccount) && (
                  <p className={css.changeDefaultText} onClick={() => setShowDefaultPayment(true)}>
                    <FormattedMessage id="PaymentForm.useDefaultCard" />
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
