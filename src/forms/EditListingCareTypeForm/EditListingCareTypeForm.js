import React from 'react';
import { arrayOf, bool, func, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import { intlShape, injectIntl, FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import { propTypes } from '../../util/types';
import { minLength, maxLength, required, composeValidators } from '../../util/validators';
import { Form, Button, FieldTextInput } from '../../components';

import css from './EditListingCareTypeForm.module.css';

const TITLE_MAX_LENGTH = 60;
const DESCRIPTION_MIN_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 700;

const EditListingCareTypeFormComponent = props => (
  <FinalForm
    {...props}
    render={formRenderProps => {
      const {
        certificateOptions,
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
      } = formRenderProps;

      const titleMessage = intl.formatMessage({ id: 'EditListingCareTypeForm.title' });
      const titlePlaceholderMessage = intl.formatMessage({
        id: 'EditListingCareTypeForm.titlePlaceholder',
      });
      const titleRequiredMessage = intl.formatMessage({
        id: 'EditListingCareTypeForm.titleRequired',
      });
      const maxLengthTitleMessage = intl.formatMessage(
        { id: 'EditListingCareTypeForm.maxLength' },
        {
          maxLength: TITLE_MAX_LENGTH,
        }
      );
      const maxLength60Message = maxLength(maxLengthTitleMessage, TITLE_MAX_LENGTH);

      const descriptionMessage = intl.formatMessage({
        id: 'EditListingCareTypeForm.description',
      });
      const descriptionPlaceholderMessage = intl.formatMessage({
        id: 'EditListingCareTypeForm.descriptionPlaceholder',
      });
      const descriptionRequiredMessage = intl.formatMessage({
        id: 'EditListingCareTypeForm.descriptionRequired',
      });
      const lengthDescriptionMessage = intl.formatMessage(
        { id: 'EditListingCareTypeForm.descriptionLength' },
        {
          maxLength: DESCRIPTION_MAX_LENGTH,
          minLength: DESCRIPTION_MIN_LENGTH,
        }
      );
      const maxLength700Message = maxLength(lengthDescriptionMessage, DESCRIPTION_MAX_LENGTH);
      const minLength100Message = minLength(lengthDescriptionMessage, DESCRIPTION_MIN_LENGTH);

      const { updateListingError, createListingDraftError, showListingsError } = fetchErrors || {};
      const errorMessageUpdateListing = updateListingError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingCareTypeForm.updateFailed" />
        </p>
      ) : null;

      // This error happens only on first tab (of EditListingWizard)
      const errorMessageCreateListingDraft = createListingDraftError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingCareTypeForm.createListingDraftError" />
        </p>
      ) : null;

      const errorMessageShowListing = showListingsError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingCareTypeForm.showListingFailed" />
        </p>
      ) : null;

      const classes = classNames(css.root, className);
      const submitReady = updated || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          {errorMessageCreateListingDraft}
          {errorMessageUpdateListing}
          {errorMessageShowListing}
          <FieldTextInput
            id="title"
            name="title"
            className={css.title}
            type="text"
            label={titleMessage}
            placeholder={titlePlaceholderMessage}
            maxLength={TITLE_MAX_LENGTH}
            validate={composeValidators(maxLength60Message)}
            autoFocus
          />

          <FieldTextInput
            id="description"
            name="description"
            className={css.description}
            type="textarea"
            label={descriptionMessage}
            placeholder={descriptionPlaceholderMessage}
            maxLength={DESCRIPTION_MAX_LENGTH}
            validate={composeValidators(
              required(descriptionRequiredMessage),
              maxLength700Message,
              minLength100Message
            )}
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

EditListingCareTypeFormComponent.defaultProps = { className: null, fetchErrors: null };

EditListingCareTypeFormComponent.propTypes = {
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
};

export default compose(injectIntl)(EditListingCareTypeFormComponent);
