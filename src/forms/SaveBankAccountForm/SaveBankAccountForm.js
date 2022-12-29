import React, { useEffect, useState, useRef } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import classNames from 'classnames';
import * as validators from '../../util/validators';
import { Form as FinalForm } from 'react-final-form';
import { FormattedMessage } from 'react-intl';

import css from './SaveBankAccountForm.module.css';
import { StripeBankAccountTokenInputField, Form, Button } from '../../components';

const SaveBankAccountForm = props => {
  //   return <div></div>;
  return (
    <FinalForm
      {...props}
      render={fieldRenderProps => {
        const { className, handleSubmit, invalid } = fieldRenderProps;

        const stripe = useStripe();

        const classes = null;

        const bankAccountRequired = validators.required(' ');

        const hasErrors = null;

        const submitInProgress = false;
        const submitDisabled = invalid;

        const onSubmit = e => {
          e.preventDefault();
          console.log('onSubmit');
        };

        return (
          <Form className={classes} onSubmit={onSubmit}>
            <StripeBankAccountTokenInputField
              className={css.bankDetailsStripeField}
              disabled={false}
              name={`id.bankAccountToken`}
              formName="SaveBankAccountForm"
              country="US"
              currency="USD"
              validate={bankAccountRequired}
            />
            <div className={css.submitContainer}>
              {hasErrors ? (
                <span className={css.errorMessage}>
                  {hasErrors.message ? hasErrors.message : errorMessage}
                </span>
              ) : null}
              <Button
                className={css.submitButton}
                type="submit"
                inProgress={submitInProgress}
                disabled={submitDisabled}
              >
                <FormattedMessage id="SaveBankAccountForm.submitPaymentInfo" />
              </Button>
            </div>
          </Form>
        );
      }}
    />
  );
};

export default SaveBankAccountForm;
