import React from 'react';

import { Form as FinalForm, FormSpy } from 'react-final-form';
import {
  FieldCheckbox,
  Form,
  FieldCurrencyInput,
  FieldTextInput,
  Button,
  FieldSelect,
} from '../../components';
import { moneySubUnitAmountAtLeast, required } from '../../util/validators';
import { formatMoney } from '../../util/currency';
import { types as sdkTypes } from '../../util/sdkLoader';
import { composeValidators } from '../../util/validators';
import { injectIntl, FormattedMessage } from '../../util/reactIntl';
import config from '../../config';

const { Money } = sdkTypes;

import css from './BookingPriceForm.module.css';

const calculateOvertimeHours = plan => {
  const { type, timezone, startDate, endDate, ...rest } = plan;
  const oneWeekFromStart = startDate + 7 * 24 * 60 * 60 * 1000;

  let hours = 0;

  // This will not be a subscription and will be paid after last session is completed
  if (type === AVAILABILITY_PLAN_ONE_TIME) {
    // TODO: Determine how this will be calculated. Will overtime be calculated for total time or weekly?
    return 0;
  } else if (type === AVAILABILITY_PLAN_REPEAT) {
    const { entries } = rest;

    entries.forEach(day => {
      const { startTime, endTime } = day;

      const endTimeValue = endTime === '12:00am' ? 24 : timeOrderMap.get(endTime);
      const startTimeValue = timeOrderMap.get(startTime);

      hours += endTimeValue - startTimeValue;
    });
  } else if (type === AVAILABILITY_PLAN_24_HOUR) {
    const { startDate, endDate, hoursPerDay, availableDays } = rest;

    hours.push((availableDays * hoursPerDay) / (60 * 60 * 1000));
  }

  return hours - 40;
};

const BookingPriceForm = props => (
  <FinalForm
    {...props}
    render={fieldRenderProps => {
      const {
        handleSubmit,
        onChange,
        children,
        minimumAmount,
        intl,
        invalid,
        disabled,
        updateInProgress,
        updated,
        ready,
        availabilityPlan,
      } = fieldRenderProps;

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
          id: 'BookingModalForm.amountTooLow',
        },
        {
          minimumAmount: formatMoney(intl, new Money(minimumAmount, 'USD')),
        }
      );
      const amountTooLowValidator = moneySubUnitAmountAtLeast(amountTooLowMessage, minimumAmount);

      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;
      const submitReady = updated || ready;

      const totalHours = availabilityPlan.attributes.availabilityPlan.entries.reduce(
        (acc, entry) => {
          return acc + entry.hours;
        },
        0
      );

      return (
        <Form onSubmit={handleSubmit}>
          <h1 className={css.title}>
            <FormattedMessage id="BookingPriceForm.title" />
          </h1>
          <FormSpy onChange={onChange} />
          {children}
          <div className={css.currencyContainer}>
            <FieldCurrencyInput
              id="amount"
              name="amount"
              rootClassName={css.currencyRoot}
              placeholder="$0.00"
              validate={composeValidators(amountRequiredValidator, amountTooLowValidator)}
              currencyConfig={config.currencyConfig}
              inputClassName={css.currencyInput}
              label="Hourly Pay Rate"
            />
          </div>
          <div className={css.currencyContainer}>
            <label className={css.overtimeLabel}>Overtime Hours Per Week</label>
            <label className={css.overtimeLabel}>(Recommended: )</label>
            <FieldTextInput
              id="overtime"
              name="overtime"
              rootClassName={css.currencyRoot}
              placeholder="0"
              validate={amountRequiredValidator}
              inputRootClass={css.currencyInput}
            />
            <span className={css.overtimeTextContainer}>
              <p className={css.overtimeTextContainer}>
                Overtime pay for caregivers can vary state to state. Please check your state's
                overtime guidelines using the following link below to determine the appropriate
                amount. (
                <a
                  href="https://www.dol.gov/sites/dolgov/files/WHD/legacy/files/Homecare_Guide.pdf"
                  target="_blank"
                >
                  Overtime
                </a>
                )
              </p>
            </span>
          </div>
          <Button
            className={css.checkoutButton}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
            ready={submitReady}
          >
            <FormattedMessage id="BookingContainer.checkout" />
          </Button>
        </Form>
      );
    }}
  />
);

export default injectIntl(BookingPriceForm);
