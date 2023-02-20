import React, { useState, useEffect } from 'react';
import { arrayOf, bool, func, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import { intlShape, injectIntl, FormattedMessage } from '../../util/reactIntl';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';
import { withRouter } from 'react-router-dom';

import { propTypes } from '../../util/types';
import { maxLength } from '../../util/validators';
import config from '../../config';
import { Form, Button, FieldCheckboxGroup, FieldTextInput } from '../../components';
import { findOptionsForSelectFilter } from '../../util/search';
import { requiredFieldArrayCheckbox } from '../../util/validators';

import css from './EditListingCareRecipientDetailsForm.module.css';

const RECIPIENT_DETAILS_MAX_LENGTH = 700;
const CREATE_PROFILE = 'create-profile';

// Add constants for create profile and determine options by that

const EditListingCareRecipientDetailsFormComponent = props => (
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
        history,
        careRecipients,
        values,
      } = formRenderProps;

      // Recipient Relationship
      const careNeedsName = intl.formatMessage({
        id: 'EditListingCareRecipientDetailsForm.careNeedsName',
      });
      const careNeedsOptions = findOptionsForSelectFilter(careNeedsName, filterConfig);
      const careNeedsLabel = intl.formatMessage({
        id: 'EditListingCareRecipientDetailsForm.careNeedsLabel',
      });

      if (history.location.pathname.includes(CREATE_PROFILE)) {
        careNeedsOptions.splice(16, careNeedsOptions.length);
      }

      // Recipient Details
      const recipientDetailsMessage = intl.formatMessage({
        id: 'EditListingCareRecipientDetailsForm.recipientDetailsLabel',
      });
      const recipientDetailsPlaceholderMessage = intl.formatMessage({
        id: 'EditListingCareRecipientDetailsForm.recipientDetailsPlaceholder',
      });
      const maxLengthMessage = intl.formatMessage(
        { id: 'EditListingCareRecipientDetailsForm.maxLengthMessage' },
        {
          maxLength: RECIPIENT_DETAILS_MAX_LENGTH,
        }
      );
      const maxLength700Message = maxLength(maxLengthMessage, RECIPIENT_DETAILS_MAX_LENGTH);

      const { updateListingError, showListingsError } = fetchErrors || {};
      const errorMessageUpdateListing = updateListingError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingCareRecipientDetailsForm.updateFailed" />
        </p>
      ) : null;

      const errorMessageShowListing = showListingsError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingCareRecipientDetailsForm.showListingFailed" />
        </p>
      ) : null;

      const classes = classNames(css.root, className);
      const submitInProgress = updateInProgress;
      const submitReady = (updated && pristine) || ready;
      const submitDisabled = invalid || disabled || submitInProgress || careRecipients?.length < 1;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          {errorMessageShowListing}

          <FieldCheckboxGroup
            className={css.features}
            id={careNeedsName}
            name={careNeedsName}
            options={careNeedsOptions}
            label={careNeedsLabel}
            twoColumns={true}
            validate={requiredFieldArrayCheckbox('Please select at least one option')}
            required
          />
          <FieldTextInput
            id="recipientDetails"
            name="recipientDetails"
            className={css.textarea}
            inputRootClass={css.textareaRoot}
            type="textarea"
            placeholder={recipientDetailsPlaceholderMessage}
            maxLength={RECIPIENT_DETAILS_MAX_LENGTH}
            validate={maxLength700Message}
            label={recipientDetailsMessage}
          />
          <span className={css.characterCount}>
            {values?.recipientDetails?.length}/{RECIPIENT_DETAILS_MAX_LENGTH} characters
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

EditListingCareRecipientDetailsFormComponent.defaultProps = {
  className: null,
  fetchErrors: null,
  filterConfig: config.custom.filters,
};

EditListingCareRecipientDetailsFormComponent.propTypes = {
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

export default compose(withRouter, injectIntl)(EditListingCareRecipientDetailsFormComponent);
