import React, { useState, useEffect } from 'react';
import { arrayOf, bool, func, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import { intlShape, injectIntl, FormattedMessage } from '../../util/reactIntl';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';
import { propTypes } from '../../util/types';
import { required, maxLength, minLength, composeValidators } from '../../util/validators';
import config from '../../config';
import { Form, Button, FieldTextInput, InlineTextButton, Modal } from '../../components';

import css from './EditListingJobDescriptionForm.module.css';

const DESCRIPTION_MAX_LENGTH = 1000;
const DESCRIPTION_MIN_LENGTH = 100;

const TITLE_MAX_LENGTH = 100;

const EditListingJobDescriptionFormComponent = props => (
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
        onManageDisableScrolling,
        values,
        filterConfig,
      } = formRenderProps;

      const [isExampleModalOpen, setIsExampleModalOpen] = useState(false);

      const descriptionLabel = (
        <span>
          {intl.formatMessage({
            id: 'EditListingJobDescriptionForm.descriptionLabel',
          })}
        </span>
      );
      const descriptionPlaceholder = intl.formatMessage({
        id: 'EditListingJobDescriptionForm.descriptionPlaceholder',
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
      const minLengthMessage = intl.formatMessage(
        { id: 'EditListingJobDescriptionForm.minLengthMessage' },
        { minLength: DESCRIPTION_MIN_LENGTH }
      );
      const minLength100Message = minLength(minLengthMessage, DESCRIPTION_MIN_LENGTH);
      const maxLengthMessage = intl.formatMessage(
        { id: 'EditListingJobDescriptionForm.maxLengthMessage' },
        {
          maxLength: DESCRIPTION_MAX_LENGTH,
        }
      );
      const maxLength1000Message = maxLength(maxLengthMessage, DESCRIPTION_MAX_LENGTH);

      const titleLabel = intl.formatMessage({ id: 'EditListingJobDescriptionForm.titleLabel' });
      const titlePlaceholder = intl.formatMessage({
        id: 'EditListingJobDescriptionForm.titlePlaceholder',
      });
      const titleRequired = required(
        intl.formatMessage({ id: 'EditListingJobDescriptionForm.titleRequired' })
      );
      const maxLength100Message = maxLength(
        intl.formatMessage(
          { id: 'EditListingJobDescriptionForm.maxLengthMessage' },
          { maxLength: TITLE_MAX_LENGTH }
        ),
        TITLE_MAX_LENGTH
      );

      const { updateListingError, showListingsError } = fetchErrors || {};
      const errorMessageUpdateListing = updateListingError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingJobDescriptionForm.updateFailed" />
        </p>
      ) : null;

      const errorMessageShowListing = showListingsError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingJobDescriptionForm.showListingFailed" />
        </p>
      ) : null;

      const classes = classNames(css.root, className);
      const submitInProgress = updateInProgress;
      const submitReady = (updated && pristine) || ready;
      const submitDisabled = invalid || disabled || submitInProgress;

      return (
        <>
          <Form className={classes} onSubmit={handleSubmit}>
            {errorMessageShowListing}

            <FieldTextInput
              id="title"
              name="title"
              type="textinput"
              className={css.textInput}
              inputRootClass={css.textInputRoot}
              placeholder={titlePlaceholder}
              validate={composeValidators(titleRequired, maxLength100Message)}
              label={titleLabel}
              required
              maxLength={TITLE_MAX_LENGTH}
            />

            <FieldTextInput
              id="description"
              name="description"
              className={css.textarea}
              inputRootClass={css.textareaRoot}
              type="textarea"
              placeholder={descriptionPlaceholder}
              label={descriptionLabel}
              minLength={DESCRIPTION_MIN_LENGTH}
              maxLength={DESCRIPTION_MAX_LENGTH}
              required
              validate={composeValidators(maxLength1000Message, minLength100Message)}
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
            id="JobDescriptionExampleModal"
            isOpen={isExampleModalOpen}
            onClose={() => setIsExampleModalOpen(false)}
            onManageDisableScrolling={onManageDisableScrolling}
            usePortal
          >
            {/* TODO: replace these with actual examples */}
            <p className={css.modalTitle}>Job Description Examples</p>
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

EditListingJobDescriptionFormComponent.defaultProps = {
  className: null,
  fetchErrors: null,
  filterConfig: config.custom.filters,
};

EditListingJobDescriptionFormComponent.propTypes = {
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

export default compose(injectIntl)(EditListingJobDescriptionFormComponent);
