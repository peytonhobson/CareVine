import React, { useState } from 'react';
import { arrayOf, bool, func, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import { intlShape, injectIntl, FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import { propTypes } from '../../util/types';
import { minLength, maxLength, required, composeValidators } from '../../util/validators';
import {
  Form,
  Button,
  FieldTextInput,
  InlineTextButton,
  Modal,
  IconSpinner,
} from '../../components';

import css from './EditListingBioForm.module.css';

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
        onManageDisableScrolling,
        generateBioInProgress,
        generateBioError,
        generatedBio,
      } = formRenderProps;

      const [isExampleModalOpen, setIsExampleModalOpen] = useState(false);
      const [sameBioError, setSameBioError] = useState(false);

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
      const submitReady = updated || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress || generateBioInProgress;

      const onSubmit = e => {
        e.preventDefault();

        // If the user has not edited the bio, we don't want to update the listing
        if (generatedBio === formRenderProps.values.description) {
          setSameBioError(true);
          return;
        }

        handleSubmit(e);
      };

      return (
        <>
          <Form className={classes} onSubmit={onSubmit}>
            <FormSpy
              onChange={() => {
                if (sameBioError) {
                  setSameBioError(false);
                }
              }}
              subscription={{ values: true }}
            />
            {errorMessageShowListing}

            {generateBioInProgress ? (
              <div className={css.spinnerContainer}>
                <div style={{ textAlign: 'center' }}>
                  <IconSpinner className={css.spinner} />
                  <h3 className={css.generatingBioText}>Generating bio...</h3>
                  <p className={css.generatingBioText}>This may take up to a minute</p>
                </div>
              </div>
            ) : (
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
            )}

            {generateBioError ? (
              <p className={css.error}>
                <FormattedMessage id="EditListingBioForm.generateBioFailed" />
              </p>
            ) : null}
            {sameBioError ? (
              <p className={css.error}>
                <FormattedMessage id="EditListingBioForm.sameBioError" />
              </p>
            ) : null}
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
            <p className={css.modalTitle}>Bio Examples</p>
            <div>
              <h2>Example 1</h2>
              <p className={css.modalMessage}>
                I have worked in several different work environments with seniors with various care
                needs. I have worked in Assisted Living Facilities, Nursing homes, memory care, and
                in private settings. I have chosen this profession because I enjoy Seniors and want
                to provide good care to them when they no longer can do things on their own. I enjoy
                cooking and cleaning so I can also do this in the home setting if needed. I have a
                bubbly personality and a good sense of humor. I am organized and attentive to
                details.
              </p>
            </div>
            <div>
              <h2>Example 2</h2>
              <p className={css.modalMessage}>
                I am a male caregiver who have provided care to both males and females in various
                facilities and as a private caregiver in people&#39;s home. I became a certified
                nursing assistant 5 years ago. I have a wealth of various experience from providing
                care for individuals on at the end of life to being a companion to Seniors. I treat
                each of my clients as if they were my own parent.
              </p>
            </div>
            <div>
              <h2>Example 3</h2>
              <p className={css.modalMessage}>
                I have extensive experience caring for Seniors and the disabled with all types of
                care needs. I can provide several references if needed. I am a good communicator,
                detailed, thoughtful, and reliable. I enjoying making others feel good. I will
                ensure that I provide the care that I would for my own family member. I sincerely
                have a passion for what I do.
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
