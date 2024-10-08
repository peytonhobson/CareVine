import React, { useState } from 'react';

import { bool, func, shape, string } from 'prop-types';
import classNames from 'classnames';
import { Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';

import { FormattedMessage } from '../../util/reactIntl';
import { findOptionsForSelectFilter } from '../../util/search';
import { propTypes } from '../../util/types';
import config from '../../config';
import { intlShape } from '../../util/reactIntl';
import { Button, FieldCheckboxGroup, FieldRadioButtonGroup, Form } from '../../components';
import { requiredFieldArrayCheckbox, requiredFieldArrayRadio } from '../../util/validators';

import css from './EditListingFeaturesForm.module.css';

const EditListingFeaturesFormComponent = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={formRenderProps => {
      const {
        className,
        disabled,
        fetchErrors,
        filterConfig,
        handleSubmit,
        intl,
        invalid,
        label,
        name,
        pristine,
        ready,
        required,
        rootClassName,
        saveActionMsg,
        singleSelect,
        updated,
        updateInProgress,
      } = formRenderProps;

      const classes = classNames(rootClassName || css.root, className);
      const submitReady = updated || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;

      const { updateListingError, showListingsError, createListingDraftError } = fetchErrors || {};

      const errorMessageNotSelected = intl.formatMessage(
        singleSelect
          ? { id: 'EditListingFeaturesForm.notSelectedRadio' }
          : { id: 'EditListingFeaturesForm.notSelectedCheckbox' }
      );
      const errorMessage = updateListingError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingFeaturesForm.updateFailed" />
        </p>
      ) : null;
      const errorMessageShowListing = showListingsError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingFeaturesForm.showListingFailed" />
        </p>
      ) : null;
      const errorMessageCreateListingDraft = createListingDraftError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingFeaturesForm.createListingFailed" />
        </p>
      ) : null;

      const options = findOptionsForSelectFilter(name, filterConfig);
      return (
        <Form className={classes} onSubmit={handleSubmit}>
          {errorMessage}
          {errorMessageShowListing}
          {errorMessageCreateListingDraft}

          {!singleSelect && (
            <FieldCheckboxGroup
              className={css.features}
              id={name}
              name={name}
              options={options}
              label={label}
              validate={required && requiredFieldArrayCheckbox(errorMessageNotSelected)}
              required={required}
            />
          )}
          {singleSelect && (
            <FieldRadioButtonGroup
              className={css.features}
              id={name}
              name={name}
              options={options}
              label={label}
              validate={required && requiredFieldArrayRadio(errorMessageNotSelected)}
              required={required}
            />
          )}

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

EditListingFeaturesFormComponent.defaultProps = {
  rootClassName: null,
  className: null,
  fetchErrors: null,
  filterConfig: config.custom.filters,
  label: null,
  singleSelect: false,
};

EditListingFeaturesFormComponent.propTypes = {
  rootClassName: string,
  className: string,
  name: string.isRequired,
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
  filterConfig: propTypes.filterConfig,
  label: string,
  singleSelect: bool,
  intl: intlShape.isRequired,
};

const EditListingFeaturesForm = EditListingFeaturesFormComponent;

export default EditListingFeaturesForm;
