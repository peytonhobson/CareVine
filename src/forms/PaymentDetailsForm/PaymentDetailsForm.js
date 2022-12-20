import React, { useState } from 'react';

import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { injectIntl, FormattedMessage } from '../../util/reactIntl';
import {
  Form,
  Button,
  FieldCurrencyInput,
  SimpleAccordion,
  UserListingPreview,
} from '../../components';
import config from '../../config';
import { formatMoney } from '../../util/currency';
import { composeValidators, required, moneySubUnitAmountAtLeast } from '../../util/validators';
import { types as sdkTypes } from '../../util/sdkLoader';

import css from './PaymentDetailsForm.module.css';

const { Money } = sdkTypes;
const MINIMUM_AMOUNT = 1000;
const STRIPE_INVALID_REQUEST_ERROR = 'StripeInvalidRequestError';
const STRIPE_CARD_ERROR = 'StripeCardError';

const PaymentDetailsForm = props => (
  <FinalForm
    {...props}
    render={formRenderProps => {
      const {
        className,
        clientSecret,
        createPaymentIntentError,
        createPaymentIntentInProgress,
        createPaymentIntentSuccess,
        handleSubmit,
        intl,
        onEditPaymentDetails,
        provider,
        values,
      } = formRenderProps;

      const amountLabel = intl.formatMessage({ id: 'PaymentDetailsForm.amountLabel' });
      const amountPlaceholderMessage = intl.formatMessage({
        id: 'PaymentDetailsForm.amountPlaceholder',
      });
      const amountRequiredMessage = intl.formatMessage({
        id: 'PaymentDetailsForm.amountRequired',
      });
      const amountRequiredValidator = required(amountRequiredMessage);
      const amountTooLowMessage = intl.formatMessage(
        {
          id: 'PaymentDetailsForm.amountTooLow',
        },
        {
          minimumAmount: formatMoney(intl, new Money(MINIMUM_AMOUNT, 'USD')),
        }
      );
      const amountTooLowValidator = moneySubUnitAmountAtLeast(amountTooLowMessage, MINIMUM_AMOUNT);

      const classes = classNames(css.root, className);
      const submitInProgress = createPaymentIntentInProgress;
      const submitDisabled = submitInProgress || clientSecret;

      const totalAmountNumber = values.amount && values.amount.amount + values.amount.amount * 0.06;
      const totalAmountMoney = totalAmountNumber
        ? new Money(totalAmountNumber, 'USD')
        : new Money(0, 'USD');
      const totalAmount = formatMoney(intl, totalAmountMoney);

      const transactionFeeNumber = values.amount && values.amount.amount * 0.06;
      const transactionFeeMoney = transactionFeeNumber
        ? new Money(transactionFeeNumber, 'USD')
        : new Money(0, 'USD');
      const transactionFee = formatMoney(intl, transactionFeeMoney);

      const hideAccordionLabel = intl.formatMessage({
        id: 'PaymentDetailsForm.hideAccordionLabel',
      });
      const showAccordionLabel = intl.formatMessage({
        id: 'PaymentDetailsForm.showAccordionLabel',
      });

      const [accordionLabel, setAccordionLabel] = useState(showAccordionLabel);

      const onHandleExpandPaymentDetails = isExpanded => {
        if (isExpanded) {
          setAccordionLabel(hideAccordionLabel);
        } else {
          setAccordionLabel(showAccordionLabel);
        }
      };

      let createPaymentIntentErrorMessage = null;

      if (createPaymentIntentError) {
        let errorId = null;
        switch (createPaymentIntentError.type) {
          case STRIPE_CARD_ERROR:
            errorId = 'PaymentDetailsForm.stripeCardErrorMessage';
            break;
          case STRIPE_INVALID_REQUEST_ERROR:
            errorId = 'PaymentDetailsForm.stripeInvalidRequestErrorMessage';
            break;
          default:
            errorId = 'PaymentDetailsForm.stripeOtherErrorMessage';
            break;
        }

        const stripeErrorMessage = createPaymentIntentError.message;
        createPaymentIntentErrorMessage = (
          <p className={css.orderError}>
            <FormattedMessage id={errorId} values={{ stripeErrorMessage }} />
          </p>
        );
      }

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <div className={css.mainContainer}>
            {provider && <UserListingPreview otherUser={provider} intl={intl} />}
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
                disabled={!!clientSecret}
              />
            </div>
            <div className={css.amountDisplayContainer}>
              <div className={css.amountDisplay}>Total:</div>
              <div className={css.amountDisplay}>{totalAmount}</div>
            </div>
            <SimpleAccordion label={accordionLabel} onExpand={onHandleExpandPaymentDetails}>
              <div className={css.amountDisplayContainer}>
                <div className={css.amountDisplay}>Transaction Fee:</div>
                <div className={css.amountDisplay}>{transactionFee}</div>
              </div>
            </SimpleAccordion>
          </div>
          {createPaymentIntentErrorMessage}
          {!clientSecret && (
            <Button
              rootClassName={css.submitButtonRoot}
              className={css.submitButton}
              type="submit"
              inProgress={submitInProgress}
              disabled={submitDisabled}
            >
              <FormattedMessage id="PaymentDetailsForm.reviewButtonLabel" />
            </Button>
          )}
          {clientSecret && (
            <Button
              rootClassName={css.submitButtonRoot}
              className={css.submitButton}
              onClick={onEditPaymentDetails}
              type="button"
            >
              <FormattedMessage id="PaymentDetailsForm.editButtonLabel" />
            </Button>
          )}
        </Form>
      );
    }}
  />
);

export default compose(injectIntl)(PaymentDetailsForm);
