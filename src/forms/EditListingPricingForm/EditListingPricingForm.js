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

      const formValues = form.getState().values;

      const classes = classNames(css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;
      const { updateListingError, showListingsError } = fetchErrors || {};

      return (
        <Form onSubmit={handleSubmit} className={classes}>
          {showListingsError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingPricingForm.showListingFailed" />
            </p>
          ) : null}
          <div className={css.ratesContainer}>
            <h3 className={css.rateLabels}>${formValues.rates[0] || 15}/hr</h3>
            <h3 className={css.rateLabels}>${formValues.rates[1] || 25}/hr</h3>
          </div>
          <FieldRangeSlider
            id="rates"
            name="rates"
            className={css.priceRange}
            min={10}
            max={50}
            step={1}
            handles={[15, 25]}
            noHandleLabels
          />
          {updateListingError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingPricingForm.updateFailed" />
            </p>
          ) : null}
          <div className={css.submitContainer}>
            <Button
              rootClassName={css.submitRoot}
              className={css.submitButton}
              type="submit"
              inProgress={submitInProgress}
              disabled={submitDisabled}
              ready={submitReady}
            >
              {saveActionMsg}
            </Button>
          </div>
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
