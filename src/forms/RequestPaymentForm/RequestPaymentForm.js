import React, { useState } from 'react';

import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { injectIntl, FormattedMessage } from '../../util/reactIntl';
import { Form, Button, FieldCurrencyInput, NamedLink } from '../../components';
import config from '../../config';
import { formatMoney } from '../../util/currency';
import { composeValidators, required, moneySubUnitAmountAtLeast } from '../../util/validators';
import { types as sdkTypes } from '../../util/sdkLoader';

import css from './RequestPaymentForm.module.css';

const { Money } = sdkTypes;
const MINIMUM_AMOUNT = 1000;

const RequestPaymentForm = props => (
  <FinalForm
    {...props}
    render={formRenderProps => {
      const {
        className,
        handleSubmit,
        intl,
        noStripeAcount,
        sendRequestForPaymentError,
        sendRequestForPaymentInProgress,
        sendRequestForPaymentSuccess,
        requestedInLastDay,
        requestDisabled,
        otherUser,
        invalid,
      } = formRenderProps;

      const amountLabel = intl.formatMessage({ id: 'RequestPaymentForm.amountLabel' });
      const amountPlaceholderMessage = intl.formatMessage({
        id: 'RequestPaymentForm.amountPlaceholder',
      });
      const amountRequiredMessage = intl.formatMessage({
        id: 'RequestPaymentForm.amountRequired',
      });
      const amountRequiredValidator = required(amountRequiredMessage);
      const amountTooLowMessage = intl.formatMessage(
        {
          id: 'RequestPaymentForm.amountTooLow',
        },
        {
          minimumAmount: formatMoney(intl, new Money(MINIMUM_AMOUNT, 'USD')),
        }
      );
      const amountTooLowValidator = moneySubUnitAmountAtLeast(amountTooLowMessage, MINIMUM_AMOUNT);

      const classes = classNames(css.root, className);
      const submitInProgress = sendRequestForPaymentInProgress;
      const submitDisabled = submitInProgress || requestDisabled || invalid;
      const submitReady = sendRequestForPaymentSuccess === otherUser?.id?.uuid;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <div className={css.amountContainer}>
            <label className={css.amountLabel}>{amountLabel}</label>
            <FieldCurrencyInput
              id="amount"
              name="amount"
              rootClassName={css.currencyRoot}
              placeholder={amountPlaceholderMessage}
              validate={composeValidators(amountRequiredValidator, amountTooLowValidator)}
              currencyConfig={config.currencyConfig}
              inputClassName={css.currencyInput}
              disabled={requestDisabled}
            />
          </div>
          {requestedInLastDay && (
            <p className={css.notifyDisabledMessage}>
              <FormattedMessage id="RequestPaymentForm.requestDisabledMessage" />
            </p>
          )}
          {noStripeAcount && (
            <p className={css.notifyDisabledMessage}>
              <FormattedMessage
                id="RequestPaymentForm.noStripeAccount"
                values={{
                  payoutLink: (
                    <NamedLink name="StripePayoutPage" className={css.payoutLink}>
                      here
                    </NamedLink>
                  ),
                }}
              />
            </p>
          )}
          {sendRequestForPaymentError && (
            <p className={css.error}>
              <FormattedMessage id="RequestPaymentForm.sendRequestError" />
            </p>
          )}
          <Button
            rootClassName={css.submitButtonRoot}
            className={css.submitButton}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
            ready={submitReady}
          >
            <FormattedMessage id="RequestPaymentForm.requestPayment" />
          </Button>
        </Form>
      );
    }}
  />
);

export default compose(injectIntl)(RequestPaymentForm);
