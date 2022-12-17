import React, { useEffect, useState, useMemo, Fragment } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from '@stripe/react-stripe-js';
import { Button, Checkbox, IconSpinner, SavedCardDetails, Form } from '../../components';
import { FormattedMessage } from '../../util/reactIntl';
import { ensureCurrentUser, ensureStripeCustomer, ensurePaymentMethodCard } from '../../util/data';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import css from './PaymentForm.module.css';

export const setIframeMaxHeight = height => {
  const frame = document.querySelector('iframe');
  frame.style.maxHeight = height;
  // .find('.p-BankView--picker')
  // .remove();
};

const STRIPE_INVALID_REQUEST_ERROR = 'StripeInvalidRequestError';
const STRIPE_CARD_ERROR = 'card_error';

const PaymentForm = props => {
  const {
    paymentIntent,
    onPaymentSubmit,
    intl,
    confirmPaymentInProgress,
    confirmPaymentError,
    confirmPaymentSuccess,
    currentUser,
    onManageDisableScrolling,
    onFetchDefaultPayment,
    defaultPayment,
    fetchDefaultPaymentInProgress,
    fetchDefaultPaymentError,
    defaultPaymentFetched,
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
    if (!!defaultPayment) {
      setShowDefaultPayment(true);
    }
  }, [defaultPayment]);

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

    onPaymentSubmit(stripe, elements, saveDefaultPayment, showDefaultPayment);
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
                card={ensurePaymentMethodCard(defaultPayment.card)}
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
              {/* <div className={paymentClasses} id="payment-element" ref={paymentContainer} /> */}
              <PaymentElement
                options={paymentElementOptions}
                id="payment-element"
                onChange={element => {
                  handlePaymentChange(element);
                }}
                className={css.paymentElement}
              />
              {showCardPayment && (
                <Checkbox
                  id="saveDefault"
                  name="saveDefault"
                  label="Save as default payment card"
                  onChange={handleDefaultCheckboxChange}
                  value={saveDefaultPayment}
                  className={css.checkbox}
                />
                )}
              {/* Change this to match option for default bank account */}
              {defaultPayment && (
                <p className={css.changeDefaultText} onClick={() => setShowDefaultPayment(true)}>
                  <FormattedMessage id="PaymentForm.useDefaultCard" />
                </p>
              )}
            </Fragment>
          )}
        </div>
      )}
      {errorMessage}
      {/* {payment} */}
      {defaultPaymentFetched && (
        <div className={css.paymentButtonContainer}>
          <Button
            rootClassName={css.paymentButtonRoot}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
          >
            {confirmPaymentInProgress ? <IconSpinner /> : buttonMessage}
          </Button>
        </div>
      )}
    </Form>
  );
};

export default PaymentForm;
