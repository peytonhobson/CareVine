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
import { withRouter } from 'react-router-dom';
import arrayMutators from 'final-form-arrays';

import css from './EditListingExperienceForm.module.css';

const CREATE_PROFILE = 'create-profile';

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
        history,
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
      const experienceAreasOptions = findOptionsForSelectFilter('experienceAreas', filterConfig);
      if (history.location.pathname.includes(CREATE_PROFILE)) {
        experienceAreasOptions.splice(16, experienceAreasOptions.length);
      }

      const { updateListingError, showListingsError } = fetchErrors || {};
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
      const submitReady = updated || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          {errorMessageShowListing}

          <FieldRadioButtonGroup
            rootClassName={css.formMargins}
            id="experienceLevel"
            name="experienceLevel"
            label={experienceLevelFeaturesLabel}
            options={experienceLevelOptions}
            required
            validate={requiredFieldArrayRadio(experienceLevelErrorMessage)}
          />

          <FieldCheckboxGroup
            className={css.formMargins}
            id="experienceAreas"
            name="experienceAreas"
            label={experienceAreasFeaturesLabel}
            options={experienceAreasOptions}
            twoColumns
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

export default compose(withRouter, injectIntl)(EditListingExperienceFormComponent);
