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
  maxLength,
  minLength,
  composeValidators,
} from '../../util/validators';
import config from '../../config';
import {
  Form,
  Button,
  FieldCheckboxGroup,
  FieldRadioButtonGroup,
  FieldTextInput,
  FieldSelect,
} from '../../components';
import { findOptionsForSelectFilter } from '../../util/search';

import css from './EditListingAddCareRecipientForm.module.css';

const EditListingAddCareRecipientFormComponent = props => (
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
        formId,
        fetchErrors,
        form,
        isFormVisible,
      } = formRenderProps;

      useEffect(() => {
        isFormVisible && form.reset();
      }, [isFormVisible]);

      // Recipient Relationship
      const recipientRelationshipName = intl.formatMessage({
        id: 'EditListingAddCareRecipientForm.recipientRelationshipName',
      });
      const recipientRelationshipOptions = [
        { key: 'parent', label: 'My parent' },
        { key: 'spouse', label: 'My spouse' },
        { key: 'grandparent', label: 'My grandparent' },
        { key: 'friend', label: 'My friend/extended relative' },
        { key: 'myself', label: 'Myself' },
      ];
      const recipientRelationshipLabel = intl.formatMessage({
        id: 'EditListingAddCareRecipientForm.recipientRelationshipLabel',
      });
      const recipientRelationshipErrorMessage = intl.formatMessage({
        id: 'EditListingAddCareRecipientForm.recipientRelationshipErrorMessage',
      });

      // Gender
      const genderName = intl.formatMessage({
        id: 'EditListingAddCareRecipientForm.genderName',
      });
      const genderOptions = [
        { key: 'male', label: 'Male' },
        { key: 'female', label: 'Female' },
      ];
      const genderLabel = intl.formatMessage({
        id: 'EditListingAddCareRecipientForm.genderLabel',
      });
      const genderErrorMessage = intl.formatMessage({
        id: 'EditListingAddCareRecipientForm.genderErrorMessage',
      });

      // Age
      const ageSelectLabel = intl.formatMessage({
        id: 'EditListingAddCareRecipientForm.ageSelectLabel',
      });
      const ageSelectOptions = [
        { value: '30s', label: "30's" },
        { value: '40s', label: "40's" },
        { value: '50s', label: "50's" },
        { value: '60s', label: "60's" },
        { value: '70s', label: "70's" },
        { value: '80s', label: "80's" },
        { value: '90s', label: "90's" },
        { value: '100s', label: "100's" },
      ];

      const classes = classNames(css.root, className);
      const submitInProgress = updateInProgress;
      const submitReady = (updated && pristine) || ready;
      const submitDisabled = invalid || disabled || submitInProgress;

      return (
        <Form
          className={classes}
          onSubmit={e => {
            handleSubmit(e);
            form.initialize({
              recipientRelationship: null,
              gender: null,
              age: '30s',
            });
            form.resetFieldState('recipientRelationship');
            form.resetFieldState('gender');
            form.resetFieldState('age');
          }}
        >
          <h1 className={css.modalTitle}>
            <FormattedMessage id="EditListingAddCareRecipientForm.title" />
          </h1>
          <FieldRadioButtonGroup
            rootClassName={css.radioRoot}
            className={css.features}
            id={recipientRelationshipName}
            name={recipientRelationshipName}
            options={recipientRelationshipOptions}
            label={recipientRelationshipLabel}
            required={true}
            validate={requiredFieldArrayRadio(recipientRelationshipErrorMessage)}
          />
          <FieldRadioButtonGroup
            rootClassName={css.radioRoot}
            className={css.features}
            id={genderName}
            name={genderName}
            options={genderOptions}
            label={genderLabel}
            required={true}
            validate={requiredFieldArrayRadio(genderErrorMessage)}
          />
          <FieldSelect
            selectClassName={css.select}
            id={formId ? `${formId}.age` : 'age'}
            name="age"
            firstValueSelected={true}
            required={true}
            label={ageSelectLabel}
          >
            {ageSelectOptions.map(item => {
              return (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              );
            })}
          </FieldSelect>

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

EditListingAddCareRecipientFormComponent.defaultProps = {
  className: null,
  fetchErrors: null,
  filterConfig: config.custom.filters,
};

EditListingAddCareRecipientFormComponent.propTypes = {
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

export default compose(injectIntl)(EditListingAddCareRecipientFormComponent);
