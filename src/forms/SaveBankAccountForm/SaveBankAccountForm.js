import React, { useEffect } from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import classNames from 'classnames';
import * as validators from '../../util/validators';
import { Form as FinalForm } from 'react-final-form';
import { FormattedMessage } from 'react-intl';

import css from './SaveBankAccountForm.module.css';
import { StripeBankAccountTokenInputField, Form, Button, IconSpinner } from '../../components';

const SaveBankAccountForm = props => {
  const {
    className,
    onSubmit,
    onCreateBankAccount,
    createBankAccountInProgress,
    createBankAccountError,
    createBankAccountSuccess,
    onFetchDefaultPayment,
    defaultPaymentFetched,
    fetchDefaultPaymentError,
    fetchDefaultPaymentInProgress,
    currentUser,
  } = props;

  const stripeCustomer = currentUser && currentUser.stripeCustomer;

  useEffect(() => {
    if (createBankAccountSuccess && stripeCustomer) {
      onFetchDefaultPayment(stripeCustomer.attributes.stripeCustomerId);
    }
  }, [createBankAccountSuccess, stripeCustomer]);

  const stripe = useStripe();

  // Need to make not null
  const classes = null;

  // Need to fix this
  const hasErrors = null;

  const submitInProgress = createBankAccountInProgress || fetchDefaultPaymentInProgress;
  const submitDisabled = !stripe || !currentUser;

  return (
    <div className={css.submitContainer}>
      {hasErrors && (
        <span className={css.errorMessage}>
          {hasErrors.message ? hasErrors.message : errorMessage}
        </span>
      )}
      <Button
        className={css.submitButton}
        type="submit"
        inProgress={submitInProgress}
        disabled={submitDisabled}
        onClick={() => onSubmit(stripe)}
      >
        <FormattedMessage id="SaveBankAccountForm.submitPaymentInfo" />
      </Button>
    </div>
  );
};

export default SaveBankAccountForm;
