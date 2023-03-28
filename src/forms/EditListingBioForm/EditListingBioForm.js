import React, { useState } from 'react';
import { arrayOf, bool, func, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import { intlShape, injectIntl, FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import { propTypes } from '../../util/types';
import { minLength, maxLength, required, composeValidators } from '../../util/validators';
import { Form, Button, FieldTextInput, InlineTextButton, Modal } from '../../components';

import css from './EditListingBioForm.module.css';

const TITLE_MAX_LENGTH = 60;
const DESCRIPTION_MIN_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 1000;

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
        values,
        onManageDisableScrolling,
      } = formRenderProps;

      const [isExampleModalOpen, setIsExampleModalOpen] = useState(false);

      const descriptionMessage = intl.formatMessage({
        id: 'EditListingBioForm.description',
      });
      const descriptionPlaceholderMessage = intl.formatMessage({
        id: 'EditListingBioForm.descriptionPlaceholder',
      });
      const exampleLink = (
        <InlineTextButton
          onClick={() => setIsExampleModalOpen(true)}
          className={css.exampleLink}
          type="button"
        >
          Stuck? Check out some examples
        </InlineTextButton>
      );
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
      const maxLength1000Message = maxLength(lengthDescriptionMessage, DESCRIPTION_MAX_LENGTH);
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
        <>
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
                maxLength1000Message,
                minLength100Message
              )}
              required
              exampleLink={exampleLink}
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
          <Modal
            id="BioExampleModal"
            isOpen={isExampleModalOpen}
            onClose={() => setIsExampleModalOpen(false)}
            onManageDisableScrolling={onManageDisableScrolling}
            usePortal
          >
            {/* TODO: replace these with actual examples */}
            <p className={css.modalTitle}>Bio Examples</p>
            <div>
              <h2>Example 1</h2>
              <p className={css.modalMessage}>
                It was cloudy outside but not really raining. There was a light sprinkle at most and
                there certainly wasn't a need for an umbrella. This hadn't stopped Sarah from
                pulling her umbrella out and opening it. It had nothing to do with the weather or
                the potential rain later that day. Sarah used the umbrella to hide.
              </p>
            </div>
            <div>
              <h2>Example 2</h2>
              <p className={css.modalMessage}>
                It was cloudy outside but not really raining. There was a light sprinkle at most and
                there certainly wasn't a need for an umbrella. This hadn't stopped Sarah from
                pulling her umbrella out and opening it. It had nothing to do with the weather or
                the potential rain later that day. Sarah used the umbrella to hide.
              </p>
            </div>
            <div>
              <h2>Example 3</h2>
              <p className={css.modalMessage}>
                It was cloudy outside but not really raining. There was a light sprinkle at most and
                there certainly wasn't a need for an umbrella. This hadn't stopped Sarah from
                pulling her umbrella out and opening it. It had nothing to do with the weather or
                the potential rain later that day. Sarah used the umbrella to hide.
              </p>
            </div>
          </Modal>
        </>
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
