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
      const recipientRelationshipOptions = findOptionsForSelectFilter(
        'recipientRelationship',
        filterConfig
      );
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
      const genderOptions = findOptionsForSelectFilter('gender', filterConfig);
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
      const ageSelectOptions = findOptionsForSelectFilter('recipientAge', filterConfig);

      const classes = classNames(css.root, className);
      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;

      return (
        <Form
          className={classes}
          onSubmit={e => {
            handleSubmit(e);
            form.initialize({
              recipientRelationship: null,
              gender: null,
              age: 'early30s',
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
            className={css.formMargins}
            id={recipientRelationshipName}
            name={recipientRelationshipName}
            options={recipientRelationshipOptions}
            label={recipientRelationshipLabel}
            required
            validate={requiredFieldArrayRadio(recipientRelationshipErrorMessage)}
          />
          <FieldRadioButtonGroup
            rootClassName={css.radioRoot}
            className={css.formMargins}
            id={genderName}
            name={genderName}
            options={genderOptions}
            label={genderLabel}
            required
            validate={requiredFieldArrayRadio(genderErrorMessage)}
          />
          <FieldSelect
            selectClassName={css.select}
            id={formId ? `${formId}.age` : 'age'}
            name="age"
            firstValueSelected
            required
            label={ageSelectLabel}
          >
            {ageSelectOptions.map(item => {
              return (
                <option key={item.key} value={item.key}>
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
