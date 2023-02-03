import React, { useState, useEffect } from 'react';
import { arrayOf, bool, func, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import { intlShape, injectIntl, FormattedMessage } from '../../util/reactIntl';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';
import { propTypes } from '../../util/types';
import {
  requiredFieldArrayCheckbox,
  requiredFieldArrayRadio,
  required,
  requiredOpenCheckbox,
} from '../../util/validators';
import config from '../../config';
import {
  Form,
  Button,
  FieldCheckboxGroup,
  FieldRadioButtonGroup,
  FieldTextInput,
  FieldOpenCheckboxGroup,
} from '../../components';
import { findOptionsForSelectFilter } from '../../util/search';

import css from './EditListingAdditionalDetailsForm.module.css';

const EditListingAdditionalDetailsFormComponent = props => (
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
        filterConfig,
        fetchErrors,
      } = formRenderProps;

      // Experience With
      const experienceWithName = intl.formatMessage({
        id: 'EditListingAdditionalDetailsForm.experienceWithName',
      });
      const experienceWithOptions = findOptionsForSelectFilter(experienceWithName, filterConfig);
      const experienceWithLabel = intl.formatMessage({
        id: 'EditListingAdditionalDetailsForm.experienceWithLabel',
      });

      // Certifications and Training
      const certificationsName = intl.formatMessage({
        id: 'EditListingAdditionalDetailsForm.certificationsName',
      });
      const certificationsOptions = findOptionsForSelectFilter(certificationsName, filterConfig);
      const certificationsLabel = intl.formatMessage({
        id: 'EditListingAdditionalDetailsForm.certificationsLabel',
      });

      // Additional Information
      const additionalInfoName = intl.formatMessage({
        id: 'EditListingAdditionalDetailsForm.additionalInfoName',
      });
      const additionalInfoOptions = findOptionsForSelectFilter(additionalInfoName, filterConfig);
      const additionalInfoLabel = intl.formatMessage({
        id: 'EditListingAdditionalDetailsForm.additionalInfoLabel',
      });

      // Covid Vaccination
      const covidVaccinationName = intl.formatMessage({
        id: 'EditListingAdditionalDetailsForm.covidVaccinationName',
      });
      const covidVaccinationOptions = findOptionsForSelectFilter(
        covidVaccinationName,
        filterConfig
      );
      const covidVaccinationLabel = intl.formatMessage({
        id: 'EditListingAdditionalDetailsForm.covidVaccinationLabel',
      });
      const errorVaccineNotSelected = intl.formatMessage({
        id: 'EditListingAdditionalDetailsForm.covidVaccinationNotSelected',
      });

      // Languages Spoken
      const languagesSpokenRadioName = intl.formatMessage({
        id: 'EditListingAdditionalDetailsForm.languagesSpokenRadioName',
      });
      const languagesSpokenRadioOptions = findOptionsForSelectFilter(
        languagesSpokenRadioName,
        filterConfig
      );
      const languagesSpokenRadioLabel = intl.formatMessage({
        id: 'EditListingAdditionalDetailsForm.languagesSpokenRadioLabel',
      });
      const errorLanguagesNotSelected = intl.formatMessage({
        id: 'EditListingAdditionalDetailsForm.languagesSpokenNotSelected',
      });
      const languagesSpokenTextName = intl.formatMessage({
        id: 'EditListingAdditionalDetailsForm.languagesSpokenRadioName',
      });
      const languagesSpokenTextPlaceholder = intl.formatMessage({
        id: 'EditListingAdditionalDetailsForm.languagesSpokenTextPlaceholder',
      });

      const { updateListingError, createListingDraftError, showListingsError } = fetchErrors || {};
      const errorMessageUpdateListing = updateListingError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingAdditionalDetailsForm.updateFailed" />
        </p>
      ) : null;

      const errorMessageShowListing = showListingsError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingAdditionalDetailsForm.showListingFailed" />
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
            className={css.features}
            id={certificationsName}
            name={certificationsName}
            options={certificationsOptions}
            label={certificationsLabel}
            twoColumns
          />
          <FieldCheckboxGroup
            className={css.features}
            id={additionalInfoName}
            name={additionalInfoName}
            options={additionalInfoOptions}
            label={additionalInfoLabel}
            twoColumns
          />
          <FieldRadioButtonGroup
            className={css.features}
            id={covidVaccinationName}
            name={covidVaccinationName}
            options={covidVaccinationOptions}
            label={covidVaccinationLabel}
            required={true}
            validate={requiredFieldArrayRadio(errorVaccineNotSelected)}
          />
          <FieldOpenCheckboxGroup
            id="languagesSpoken"
            name="languagesSpoken"
            rootClassName={css.checkboxGroup}
            options={languagesSpokenRadioOptions}
            label={languagesSpokenRadioLabel}
            placeholder="Languages..."
            buttonLabel="+ Add Language"
            required
            validate={requiredOpenCheckbox(errorLanguagesNotSelected)}
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

EditListingAdditionalDetailsFormComponent.defaultProps = {
  className: null,
  fetchErrors: null,
  filterConfig: config.custom.filters,
};

EditListingAdditionalDetailsFormComponent.propTypes = {
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

export default compose(injectIntl)(EditListingAdditionalDetailsFormComponent);
