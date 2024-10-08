import React, { useState } from 'react';

import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { injectIntl, FormattedMessage } from '../../util/reactIntl';
import {
  Form,
  Button,
  ButtonGroup,
  FieldCurrencyInput,
  SimpleAccordion,
  UserListingPreview,
  InfoTooltip,
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
const CARD_FEE_PERCENTAGE = 0.06;
const BANK_FEE_PERCENTAGE = 0.03;

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
        form,
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

      const totalAmountNumber =
        values.amount &&
        values.amount.amount +
          values.amount.amount *
            (form.getState().values.paymentMethod === 'creditCard'
              ? CARD_FEE_PERCENTAGE
              : BANK_FEE_PERCENTAGE);
      const totalAmountMoney = totalAmountNumber
        ? new Money(totalAmountNumber, 'USD')
        : new Money(0, 'USD');
      const totalAmount = formatMoney(intl, totalAmountMoney);

      const transactionFeeNumber =
        values.amount &&
        values.amount.amount *
          (form.getState().values.paymentMethod === 'creditCard'
            ? CARD_FEE_PERCENTAGE
            : BANK_FEE_PERCENTAGE);
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

      const handlePaymentMethodChange = key => {
        form.change('paymentMethod', key);
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

      const buttonGroupOptions = [
        { key: 'bankAccount', label: 'Bank Account' },
        { key: 'creditCard', label: 'Credit Card' },
      ];

      const infoToolTipTitle = (
        <div>
          <p>Transaction fees are charged by the payment processor and are not refundable.</p>
          <ul style={{ textAlign: 'center' }}>
            <li>Bank Account: 3%</li>
            <li>Credit Card: 6%</li>
          </ul>
        </div>
      );

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <div className={css.mainContainer}>
            {provider && <UserListingPreview otherUser={provider} intl={intl} />}
            <ButtonGroup
              className={css.buttonGroup}
              disabled={submitDisabled}
              initialSelect="bankAccount"
              onChange={handlePaymentMethodChange}
              options={buttonGroupOptions}
              rootClassName={css.buttonGroupRoot}
              selectedClassName={css.buttonGroupSelected}
            />
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
            <SimpleAccordion
              className={css.accordion}
              label={accordionLabel}
              onExpand={onHandleExpandPaymentDetails}
            >
              <div className={css.feeDisplayContainer}>
                <div className={css.feeTooltipContainer}>
                  <InfoTooltip title={infoToolTipTitle} />
                  <div className={css.amountDisplay}>Transaction Fee:</div>
                </div>
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
