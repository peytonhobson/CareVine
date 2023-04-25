import React, { useEffect } from 'react';
import { arrayOf, bool, func, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import { intlShape, injectIntl, FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import { propTypes } from '../../util/types';
import { minLength, maxLength, required, composeValidators } from '../../util/validators';
import { Form, Button, FieldTextInput, FieldSelect, IconSpinner } from '../../components';

import css from './IdentityProofForm.module.css';

const MAX_QUIZ_ATTEMPTS = 3;

const IdentityProofFormComponent = props => (
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
        identityProofQuiz,
        fetchErrors,
        onVerify,
        inProgress,
        identityProofQuizAttempts,
        identityProofQuizVerification,
        authenticateUserAccessCode,
        currentUserId,
        onGetIdentityProofQuiz,
      } = formRenderProps;

      const [disabledOptions, setDisabledOptions] = React.useState(Array(5).fill(false));

      const {
        getIdentityProofQuizError,
        verifyIdentityProofQuizError,
        authenticate7YearHistoryError,
        authenticateGenerateCriminalBackgroundError,
        getAuthenticateTestResultError,
        verifyIdentityProofQuizFailure,
      } = fetchErrors || {};

      const questions = identityProofQuiz?.data.IDMKBAResponse.KBAQuestion;

      const classes = classNames(css.root, className);
      const submitInProgress = inProgress;
      const submitDisabled =
        invalid || disabled || submitInProgress || identityProofQuizAttempts >= MAX_QUIZ_ATTEMPTS;

      useEffect(() => {
        onGetIdentityProofQuiz(authenticateUserAccessCode, currentUserId);
      }, []);

      const onSubmit = e => {
        e.preventDefault();

        let questionArray = [];

        for (let i = 0; i < e.currentTarget.length - 1; i++) {
          questionArray.push(e.currentTarget[i]);
        }

        const answers = questionArray.map((target, index) => {
          return {
            QuestionId: index + 1,
            AnswerId: target.selectedIndex + 1,
          };
        });

        onVerify(answers);
      };

      return (
        <Form className={classes} onSubmit={onSubmit}>
          {questions ? (
            questions?.map((question, index) => {
              const options = question.Options.map(option => {
                return {
                  key: option.id,
                  label: option.option,
                };
              });
              return (
                <FieldSelect
                  className={css.question}
                  key={index}
                  id={`question${index}`}
                  name={`question${index}`}
                  label={question.Question.trim()}
                  options={options}
                  required
                  validate={composeValidators(required('Please select an option'))}
                  onChange={() =>
                    setDisabledOptions(prevOptions =>
                      prevOptions.map((option, i) => (i === index ? true : option))
                    )
                  }
                  selectClassName={css.select}
                >
                  <option value={null} disabled={disabledOptions[index]}>
                    Select an option
                  </option>
                  {options.map(option => {
                    return (
                      <option key={option.key} value={option.label}>
                        {option.label}
                      </option>
                    );
                  })}
                </FieldSelect>
              );
            })
          ) : (
            <div className={css.spinnerContainer}>
              <IconSpinner className={css.spinner} />
            </div>
          )}
          {verifyIdentityProofQuizError ? (
            <p className={css.error}>
              <FormattedMessage id="IdentityProofForm.verifyIdentityProofQuizFailed" />
            </p>
          ) : null}
          {authenticateGenerateCriminalBackgroundError ? (
            <p className={css.error}>
              <FormattedMessage id="IdentityProofForm.generateCriminalBackgroundFailed" />
            </p>
          ) : null}
          {getAuthenticateTestResultError ? (
            <p className={css.error}>
              <FormattedMessage id="IdentityProofForm.getTestResultFailed" />
            </p>
          ) : null}
          {authenticate7YearHistoryError ? (
            <p className={css.error}>
              <FormattedMessage id="IdentityProofForm.7YearHistoryFailed" />
            </p>
          ) : null}
          {verifyIdentityProofQuizFailure ? (
            <>
              <p className={css.error}>
                <FormattedMessage id="IdentityProofForm.quizFailureMessage" />
              </p>
              <p className={css.error}>
                <FormattedMessage
                  id="IdentityProofForm.attemptsRemainingMessage"
                  values={{
                    attemptsRemaining: !!identityProofQuizAttempts
                      ? 3 - identityProofQuizAttempts
                      : '',
                  }}
                />
              </p>
            </>
          ) : null}

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

IdentityProofFormComponent.defaultProps = { className: null, fetchErrors: null };

IdentityProofFormComponent.propTypes = {
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
};

export default compose(injectIntl)(IdentityProofFormComponent);
