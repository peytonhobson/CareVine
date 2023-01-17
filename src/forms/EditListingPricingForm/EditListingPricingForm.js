import React, { useState, useEffect } from 'react';
import { bool, func, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import arrayMutators, { update } from 'final-form-arrays';
import classNames from 'classnames';

import { intlShape, injectIntl, FormattedMessage } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { types as sdkTypes } from '../../util/sdkLoader';
import { Button, Form, FieldRangeSlider, FieldRadioButtonGroup } from '../../components';

import css from './EditListingPricingForm.module.css';

const { Money } = sdkTypes;

const HOURLY = 'hourly';
const DAILY = 'daily';

export const EditListingPricingFormComponent = props => (
  <FinalForm
    {...props}
    mutators={{
      ...arrayMutators,
    }}
    render={formRenderProps => {
      const {
        className,
        disabled,
        ready,
        handleSubmit,
        intl,
        formId,
        invalid,
        pristine,
        saveActionMsg,
        updated,
        updateInProgress,
        fetchErrors,
        form,
      } = formRenderProps;

      const formState = form.getState();
      const formValues = formState.values;
      const formInitialValues = formState.initialValues;

      useEffect(() => {
        const initialRates = formInitialValues.rates;
        if (formValues.priceTime === HOURLY) {
          initialRates && formInitialValues.priceTime === HOURLY
            ? form.change('rates', initialRates)
            : form.change('rates', [15, 25]);
        } else {
          initialRates && formInitialValues.priceTime === DAILY
            ? form.change('rates', initialRates)
            : form.change('rates', [150, 250]);
        }
      }, [formValues.priceTime]);

      const priceTimeOptions = [
        { key: HOURLY, label: 'Per hour' },
        { key: DAILY, label: 'Per day' },
      ];

      const classes = classNames(css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;
      const { updateListingError, showListingsError } = fetchErrors || {};

      return (
        <Form onSubmit={handleSubmit} className={classes}>
          {updateListingError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingPricingForm.updateFailed" />
            </p>
          ) : null}
          {showListingsError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingPricingForm.showListingFailed" />
            </p>
          ) : null}
          <FieldRangeSlider
            id="rates"
            name="rates"
            className={css.priceRange}
            min={formValues.priceTime === HOURLY ? 10 : 100}
            max={formValues.priceTime === HOURLY ? 50 : 500}
            step={formValues.priceTime === HOURLY ? 1 : 5}
            handles={formValues.rates}
          />
          <FieldRadioButtonGroup
            rootClassName={css.timeRadioGroup}
            className={css.timeRadio}
            id="priceTime"
            name="priceTime"
            options={priceTimeOptions}
            inline={true}
          />
          <Button
            className={css.submitButton}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
            ready={submitReady}
          >
            {saveActionMsg}
          </Button>
        </Form>
      );
    }}
  />
);

EditListingPricingFormComponent.defaultProps = { fetchErrors: null };

EditListingPricingFormComponent.propTypes = {
  intl: intlShape.isRequired,
  onSubmit: func.isRequired,
  saveActionMsg: string.isRequired,
  disabled: bool.isRequired,
  ready: bool.isRequired,
  updated: bool.isRequired,
  updateInProgress: bool.isRequired,
  fetchErrors: shape({
    showListingsError: propTypes.error,
    updateListingError: propTypes.error,
  }),
};

export default compose(injectIntl)(EditListingPricingFormComponent);
