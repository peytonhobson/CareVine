import React from 'react';
import { arrayOf, bool, func, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import { intlShape, injectIntl, FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import { propTypes } from '../../util/types';
import {
  minLength,
  maxLength,
  required,
  composeValidators,
  requiredFieldArrayRadio,
  requiredFieldArrayCheckbox,
} from '../../util/validators';
import { Form, Button, FieldRadioButtonGroup, FieldCheckboxGroup } from '../../components';
import { findOptionsForSelectFilter } from '../../util/search';
import config from '../../config';
import arrayMutators from 'final-form-arrays';

import css from './EditListingExperienceForm.module.css';

const EditListingExperienceFormComponent = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={formRenderProps => {
      const {
        className,
        disabled,
        ready,
        handleSubmit,
        intl,
        invalid,
        pristine,
        saveActionMsg,
        updated,
        updateInProgress,
        fetchErrors,
        filterConfig,
      } = formRenderProps;

      const experienceLevelFeaturesLabel = intl.formatMessage({
        id: 'EditListingExperienceForm.experienceLevelFormLabel',
      });
      const experienceLevelOptions = findOptionsForSelectFilter('experienceLevel', filterConfig);
      const experienceLevelErrorMessage = intl.formatMessage({
        id: 'EditListingExperienceForm.experienceLevelFormError',
      });

      const experienceAreasFeaturesLabel = intl.formatMessage({
        id: 'EditListingExperienceForm.experienceAreasFormLabel',
      });
      const experienceAreasOptions = findOptionsForSelectFilter('detailedCareNeeds', filterConfig);
      const experienceAreasErrorMessage = intl.formatMessage({
        id: 'EditListingExperienceForm.experienceAreasFormError',
      });

      const { updateListingError, createListingDraftError, showListingsError } = fetchErrors || {};
      const errorMessageUpdateListing = updateListingError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingExperienceForm.updateFailed" />
        </p>
      ) : null;

      const errorMessageShowListing = showListingsError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingExperienceForm.showListingFailed" />
        </p>
      ) : null;

      const classes = classNames(css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          {errorMessageShowListing}

          <FieldRadioButtonGroup
            className={css.group}
            id="experienceLevel"
            name="experienceLevel"
            label={experienceLevelFeaturesLabel}
            options={experienceLevelOptions}
            required
            validate={requiredFieldArrayRadio(experienceLevelErrorMessage)}
          />

          <FieldCheckboxGroup
            className={css.group}
            id="experienceAreas"
            name="experienceAreas"
            label={experienceAreasFeaturesLabel}
            options={experienceAreasOptions}
            required
            twoColumns
            validate={requiredFieldArrayCheckbox(experienceAreasErrorMessage)}
          />

          {errorMessageUpdateListing}

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

EditListingExperienceFormComponent.defaultProps = {
  className: null,
  fetchErrors: null,
  filterConfig: config.custom.filters,
};

EditListingExperienceFormComponent.propTypes = {
  className: string,
  intl: intlShape.isRequired,
  onSubmit: func.isRequired,
  saveActionMsg: string.isRequired,
  disabled: bool.isRequired,
  ready: bool.isRequired,
  updated: bool.isRequired,
  updateInProgress: bool.isRequired,
  fetchErrors: shape({
    createListingDraftError: propTypes.error,
    showListingsError: propTypes.error,
    updateListingError: propTypes.error,
  }),
  certificateOptions: arrayOf(
    shape({
      key: string.isRequired,
      label: string.isRequired,
    })
  ),
  filterConfig: propTypes.filterConfig,
};

export default compose(injectIntl)(EditListingExperienceFormComponent);
