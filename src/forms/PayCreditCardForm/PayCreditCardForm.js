import React, { useEffect, useState } from 'react';

import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

import { Button, Form } from '../../components';
import { FormattedMessage } from '../../util/reactIntl';

import css from './PayCreditCardForm.module.css';

const STRIPE_INVALID_REQUEST_ERROR = 'StripeInvalidRequestError';
const STRIPE_CARD_ERROR = 'card_error';

const CREDIT_CARD_LABEL = 'Credit Card';

const PayCreditCardForm = props => {
  const {
    createPaymentError,
    createPaymentInProgress,
    confirmSetupIntentInProgress,
    confirmSetupIntentError,
    createSubscriptionInProgress,
    createSubscriptionError,
    intl,
    onSubmit,
  } = props;

  const stripe = useStripe();
  const elements = useElements();

  const [errorMessage, setErrorMessage] = useState(null);
  const [isElementsComplete, setIsElementsComplete] = useState(false);

  const handlePaymentChange = element => {
    if (element && element.complete) {
      setIsElementsComplete(true);
    }
  };

  const onHandleSubmit = e => {
    e.preventDefault();

    if (!stripe || !elements || createPaymentInProgress) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    onSubmit(stripe, elements);
  };

  const displayErrorMessage = createPaymentError => {
    // NOTE: Error messages from Stripes are not part of translations.
    // By default they are in English.
    let errorId = null;
    switch (createPaymentError.type) {
      case STRIPE_CARD_ERROR:
        errorId = 'PayCreditCardForm.stripeCardErrorMessage';
        break;
      case STRIPE_INVALID_REQUEST_ERROR:
        errorId = 'PayCreditCardForm.stripeInvalidRequestErrorMessage';
        break;
      default:
        errorId = 'PayCreditCardForm.stripeOtherErrorMessage';
        break;
    }

    const stripeErrorMessage = createPaymentError.message;
    setErrorMessage(
      <p className={css.error}>
        <FormattedMessage id={errorId} values={{ stripeErrorMessage }} />
      </p>
    );
  };

  useEffect(() => {
    if (createPaymentError) {
      displayErrorMessage(createPaymentError);
    }

    if (confirmSetupIntentError) {
      displayErrorMessage(confirmSetupIntentError);
    }

    if (createSubscriptionError) {
      displayErrorMessage(createSubscriptionError);
    }
  }, [createPaymentError, confirmSetupIntentError, createSubscriptionError]);

  const paymentElementOptions = {
    layout: 'tabs',
    paymentMethodOrder: ['card', 'google_pay', 'apple_pay'],
    fields: {
      billingDetails: {
        address: {
          country: 'never',
        },
      },
    },
  };

  const submitInProgress =
    createPaymentInProgress || confirmSetupIntentInProgress || createSubscriptionInProgress;
  const submitDisabled = submitInProgress || !isElementsComplete;

  const buttonMessage = intl.formatMessage({ id: 'PayCreditCardForm.paymentButtonMessage' });

  return (
    <Form onSubmit={onHandleSubmit} className={css.root}>
      <h2 className={css.paymentTitle}>
        <FormattedMessage
          id="PayCreditCardForm.newPaymentMethodTitle"
          values={{ paymentMethod: CREDIT_CARD_LABEL }}
        />
      </h2>
      <PaymentElement
        options={paymentElementOptions}
        id="payment-element"
        onChange={element => {
          handlePaymentChange(element);
        }}
        className={css.paymentElement}
      />
      {errorMessage}
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
    </Form>
  );
};

export default PayCreditCardForm;
