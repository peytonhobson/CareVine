import React, { useState, useEffect } from 'react';
import { arrayOf, bool, func, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import { intlShape, injectIntl, FormattedMessage } from '../../util/reactIntl';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';
import { propTypes } from '../../util/types';
import {
  maxLength,
  required,
  requiredFieldArrayCheckbox,
  requiredOpenCheckbox,
} from '../../util/validators';
import config from '../../config';
import {
  Form,
  Button,
  FieldTextInput,
  FieldCheckboxGroup,
  FieldRadioButtonGroup,
  FieldOpenCheckboxGroup,
} from '../../components';
import { findOptionsForSelectFilter } from '../../util/search';

import css from './EditListingCaregiverDetailsForm.module.css';

const CAREGIVER_DETAILS_MAX_LENGTH = 700;

const EditListingCaregiverDetailsFormComponent = props => (
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
        form,
        values,
      } = formRenderProps;

      const certificationsAndTrainingLabel = intl.formatMessage({
        id: 'EditListingCaregiverDetailsForm.certificationsAndTrainingLabel',
      });
      const certificationsAndTrainingOptions = findOptionsForSelectFilter(
        'certificationsAndTraining',
        filterConfig
      );

      const additionalInfoLabel = intl.formatMessage({
        id: 'EditListingCaregiverDetailsForm.additionalInfoLabel',
      });
      const additionalInfoOptions = findOptionsForSelectFilter('additionalInfo', filterConfig);

      const filteredAdditionalInfoOptions = additionalInfoOptions.map(option => ({
        key: option.key,
        label: option.label.replace('Have', 'Has'),
      }));

      const covidVaccinationLabel = intl.formatMessage({
        id: 'EditListingCaregiverDetailsForm.covidVaccinationLabel',
      });
      const covidVaccinationOptions = findOptionsForSelectFilter('covidVaccination', filterConfig);

      const languagesSpokenRadioOptions = findOptionsForSelectFilter(
        'languagesSpoken',
        filterConfig
      );
      const languagesSpokenRadioLabel = intl.formatMessage({
        id: 'EditListingCaregiverDetailsForm.languagesSpokenRadioLabel',
      });
      const languagesSpokenTextPlaceholder = intl.formatMessage({
        id: 'EditListingCaregiverDetailsForm.languagesSpokenTextPlaceholder',
      });

      const caregiverDetailsLabel = intl.formatMessage({
        id: 'EditListingCaregiverDetailsForm.caregiverDetailsLabel',
      });
      const caregiverDetailsPlaceholder = intl.formatMessage({
        id: 'EditListingCaregiverDetailsForm.caregiverDetailsPlaceholder',
      });

      const maxLengthMessage = intl.formatMessage(
        { id: 'EditListingCaregiverDetailsForm.maxLengthMessage' },
        {
          maxLength: CAREGIVER_DETAILS_MAX_LENGTH,
        }
      );
      const maxLength700Message = maxLength(maxLengthMessage, CAREGIVER_DETAILS_MAX_LENGTH);

      const { updateListingError, showListingsError } = fetchErrors || {};
      const errorMessageUpdateListing = updateListingError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingCaregiverDetailsForm.updateFailed" />
        </p>
      ) : null;

      const errorMessageShowListing = showListingsError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingCaregiverDetailsForm.showListingFailed" />
        </p>
      ) : null;

      const classes = classNames(css.root, className);
      const submitInProgress = updateInProgress;
      const submitReady = (updated && pristine) || ready;
      const submitDisabled = invalid || disabled || submitInProgress;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          {errorMessageShowListing}

          <FieldCheckboxGroup
            id="certificationsAndTraining"
            name="certificationsAndTraining"
            className={css.checkboxGroup}
            options={certificationsAndTrainingOptions}
            label={certificationsAndTrainingLabel}
            twoColumns
          />
          <FieldCheckboxGroup
            id="additionalInfo"
            name="additionalInfo"
            className={css.checkboxGroup}
            options={filteredAdditionalInfoOptions}
            label={additionalInfoLabel}
            twoColumns
          />
          <FieldRadioButtonGroup
            id="covidVaccination"
            name="covidVaccination"
            rootClassName={css.checkboxGroup}
            options={covidVaccinationOptions}
            label={covidVaccinationLabel}
            required
            validate={requiredFieldArrayCheckbox('You must select at least one option')}
          />

          <FieldOpenCheckboxGroup
            id="languagesSpoken"
            name="languagesSpoken"
            rootClassName={css.checkboxGroup}
            options={languagesSpokenRadioOptions}
            label={languagesSpokenRadioLabel}
            placeholder={languagesSpokenTextPlaceholder}
            buttonLabel="+ Add Language"
            required
            validate={requiredOpenCheckbox('You must select at least one option')}
          />

          <FieldTextInput
            id="idealCaregiverDetails"
            name="idealCaregiverDetails"
            className={css.textarea}
            inputRootClass={css.textareaRoot}
            type="textarea"
            placeholder={caregiverDetailsPlaceholder}
            maxLength={CAREGIVER_DETAILS_MAX_LENGTH}
            validate={maxLength700Message}
            label={caregiverDetailsLabel}
          />
          <span className={css.characterCount}>
            {values?.idealCaregiverDetails?.length}/{CAREGIVER_DETAILS_MAX_LENGTH} characters
          </span>

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

EditListingCaregiverDetailsFormComponent.defaultProps = {
  className: null,
  fetchErrors: null,
  filterConfig: config.custom.filters,
};

EditListingCaregiverDetailsFormComponent.propTypes = {
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

export default compose(injectIntl)(EditListingCaregiverDetailsFormComponent);
