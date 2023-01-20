import React from 'react';
import { arrayOf, bool, func, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import { intlShape, injectIntl, FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import { propTypes } from '../../util/types';
import { minLength, maxLength, required, composeValidators } from '../../util/validators';
import { Form, Button, FieldTextInput } from '../../components';

import css from './EditListingBioForm.module.css';

const TITLE_MAX_LENGTH = 60;
const DESCRIPTION_MIN_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 700;

const EditListingBioFormComponent = props => (
  <FinalForm
    {...props}
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
      } = formRenderProps;

      const descriptionMessage = intl.formatMessage({
        id: 'EditListingBioForm.description',
      });
      const descriptionPlaceholderMessage = intl.formatMessage({
        id: 'EditListingBioForm.descriptionPlaceholder',
      });
      const descriptionRequiredMessage = intl.formatMessage({
        id: 'EditListingBioForm.descriptionRequired',
      });
      const lengthDescriptionMessage = intl.formatMessage(
        { id: 'EditListingBioForm.descriptionLength' },
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
          <FormattedMessage id="EditListingBioForm.updateFailed" />
        </p>
      ) : null;

      const errorMessageShowListing = showListingsError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingBioForm.showListingFailed" />
        </p>
      ) : null;

      const classes = classNames(css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          {errorMessageShowListing}

          <FieldTextInput
            id="description"
            name="description"
            className={css.description}
            inputRootClass={css.descriptionInput}
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

EditListingBioFormComponent.defaultProps = { className: null, fetchErrors: null };

EditListingBioFormComponent.propTypes = {
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

export default compose(injectIntl)(EditListingBioFormComponent);
