import React, { useEffect, useState } from 'react';
import { bool, func, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import { intlShape, injectIntl, FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import { propTypes } from '../../util/types';
import { required, composeValidators } from '../../util/validators';
import { Form, Button, FieldSelect, IconSpinner, Modal, QuizTimer } from '../../components';

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
        authenticateUserAccessCode,
        onGetIdentityProofQuiz,
        getIdentityProofQuizInProgress,
        form,
        onManageDisableScrolling,
        onAddQuizAttempt,
        currentUser,
      } = formRenderProps;

      const [disabledOptions, setDisabledOptions] = useState(Array(5).fill(false));
      const [isQuizNoticeModalOpen, setIsQuizNoticeModalOpen] = useState(false);

      const {
        getIdentityProofQuizError,
        verifyIdentityProofQuizError,
        authenticate7YearHistoryError,
        authenticateGenerateCriminalBackgroundError,
        getAuthenticateTestResultError,
        verifyIdentityProofQuizFailure,
      } = fetchErrors || {};

      const expiredSessionError = verifyIdentityProofQuizError?.status === 400;

      const questions = identityProofQuiz?.data.IDMKBAResponse.KBAQuestion;

      const classes = classNames(css.root, className);
      const submitInProgress = inProgress;
      const submitDisabled =
        invalid || disabled || submitInProgress || identityProofQuizAttempts >= MAX_QUIZ_ATTEMPTS;

      useEffect(() => {
        if (authenticateUserAccessCode && !identityProofQuiz) {
          onGetIdentityProofQuiz(authenticateUserAccessCode);
          setIsQuizNoticeModalOpen(true);
        }
      }, [authenticateUserAccessCode, identityProofQuiz]);

      const onSubmit = e => {
        e.preventDefault();

        let questionArray = [];

        for (let i = 0; i < e.currentTarget.length - 1; i++) {
          questionArray.push(e.currentTarget[i]);
        }

        const answers = questionArray.map((target, index) => {
          return {
            QuestionId: index + 1,
            AnswerId: target.selectedIndex,
          };
        });

        onVerify(answers, form);
      };

      return (
        <>
          <h1 className={css.quizTitle}>
            Verify Your <span className={css.identityText}>Identity</span>
            <QuizTimer
              identityProofQuiz={identityProofQuiz}
              className={css.quizTimer}
              onGetIdentityProofQuiz={onGetIdentityProofQuiz}
              authenticateUserAccessCode={authenticateUserAccessCode}
              identityProofQuizAttempts={identityProofQuizAttempts}
              onAddQuizAttempt={onAddQuizAttempt}
              currentUser={currentUser}
              form={form}
            />
          </h1>
          <div className={css.attemptsContainer}>
            <h3 className={css.attemptsHeader}>Maximum Attempts: {MAX_QUIZ_ATTEMPTS}</h3>
            <h3 className={css.attemptsHeader}>
              {' '}
              Attempts Remaining:{' '}
              {!!identityProofQuizAttempts ? MAX_QUIZ_ATTEMPTS - identityProofQuizAttempts : 3}
            </h3>
          </div>
          <Form className={classes} onSubmit={onSubmit}>
            {!getIdentityProofQuizInProgress ? (
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
            {getIdentityProofQuizError ? (
              <p className={css.error}>
                Failed to fetch quiz. Please try refreshing the page to try again.
              </p>
            ) : null}
            {expiredSessionError ? (
              <p className={css.error}>
                The last quiz has expired. Please try attempting the quiz again.
              </p>
            ) : null}
            {verifyIdentityProofQuizError && !expiredSessionError ? (
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
          <Modal
            id="QuizNotice"
            isOpen={isQuizNoticeModalOpen}
            onClose={() => setIsQuizNoticeModalOpen(false)}
            onManageDisableScrolling={onManageDisableScrolling}
            usePortal
          >
            <p className={css.modalTitle}>Please Note</p>
            <p className={css.modalMessage}>
              To verify your identity, you will be asked to complete a quiz. This quiz is generated
              by a third party and is sometimes inaccurate, so don't worry if it takes you a few
              tries.
            </p>
            <p className={css.modalMessage}>
              Each quiz session expires after 10 minutes. Please complete the quiz as soon as
              possible, or you will lose an attempt.
            </p>
            <p className={css.modalMessage}>
              If you fail the quiz three times, please contact us at{' '}
              <a href="mailto:support@carevine.us">support@carevine.us</a> and we will help you
              finish the process.
            </p>
          </Modal>
        </>
      );
    }}
  />
);

export default compose(injectIntl)(IdentityProofFormComponent);
