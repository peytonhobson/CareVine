import React from 'react';

import { Form as FinalForm, FormSpy } from 'react-final-form';
import { FieldCheckbox, Form, FieldCurrencyInput, Button, FieldSelect } from '../../components';
import { moneySubUnitAmountAtLeast, required } from '../../util/validators';
import { formatMoney } from '../../util/currency';
import { types as sdkTypes } from '../../util/sdkLoader';
import { composeValidators } from '../../util/validators';
import { injectIntl, FormattedMessage } from '../../util/reactIntl';
import config from '../../config';

const { Money } = sdkTypes;

import css from './BookingScheduleForm.module.css';

const BookingScheduleForm = props => (
  <FinalForm
    {...props}
    render={fieldRenderProps => {
      const {
        handleSubmit,
        onChange,
        values,
        children,
        minimumAmount,
        intl,
        invalid,
        disabled,
        updateInProgress,
        updated,
        ready,
        scheduleTypeOptions,
      } = fieldRenderProps;

      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;
      const submitReady = updated || ready;

      return (
        <Form onSubmit={handleSubmit}>
          <h1 className={css.title}>
            <FormattedMessage id="BookingScheduleForm.title" />
          </h1>
          <FormSpy onChange={onChange} />
          <div className={css.scheduleSelectContainer}>
            <FieldSelect name="planType" id="planType" label="Schedule Type">
              {scheduleTypeOptions.map(option => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </FieldSelect>
          </div>
          {children}
          <Button
            className={css.nextButton}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
            ready={submitReady}
          >
            <FormattedMessage id="BookingScheduleForm.nextButton" />
          </Button>
        </Form>
      );
    }}
  />
);

export default injectIntl(BookingScheduleForm);
