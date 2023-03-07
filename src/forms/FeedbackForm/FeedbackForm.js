import React, { useState, useEffect } from 'react';

import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';
import {
  Form,
  GradientButton,
  FieldTextInput,
  ButtonGroup,
  FieldButtonGroup,
  Button,
  IconArrowHead,
} from '../../components';
import { composeValidators, required, maxLength, emailFormatValid } from '../../util/validators';
import { compose } from 'redux';

import css from './FeedbackForm.module.css';

const DEVICE_TYPE = 'deviceType';
const USER_TYPE = 'userType';
const IMPROVE_EXPERIENCE = 'improveExperience';
const ISSUES = 'issues';
const EMAIL = 'email';
const SUCCESS = 'success';

const stages = [DEVICE_TYPE, USER_TYPE, IMPROVE_EXPERIENCE, ISSUES, EMAIL, SUCCESS];

const DESCRIPTION_MAX_LENGTH = 700;

const deviceOptions = [
  { key: 'mobile', label: 'Mobile' },
  { key: 'desktop', label: 'Desktop' },
];

const userTypeOptions = [
  { key: 'caregiver', label: 'Find a job' },
  { key: 'employer', label: 'Looking for care' },
];

const yesNoOptions = [
  { key: 'yes', label: 'Yes' },
  { key: 'no', label: 'No' },
];

const FeedbackForm = props => (
  <FinalForm
    {...props}
    render={fieldRenderProps => {
      const {
        rootClassName,
        className,
        handleSubmit,
        values,
        sendFeedbackEmailInProgress,
        sendFeedbackEmailError,
        sendFeedbackEmailSuccess,
        invalid,
      } = fieldRenderProps;

      const [stage, setStage] = useState(DEVICE_TYPE);

      const classes = classNames(rootClassName || css.root, className);
      const submitInProgress = sendFeedbackEmailInProgress;
      const submitDisabled = submitInProgress || invalid;

      const nextStage = () => {
        setStage(prevStage => {
          const nextStageIndex = stages.indexOf(prevStage) + 1;
          return stages[nextStageIndex];
        });
      };

      const prevStage = () => {
        setStage(prevStage => {
          const nextStageIndex = stages.indexOf(prevStage) - 1;
          return stages[nextStageIndex];
        });
      };

      useEffect(() => {
        if (sendFeedbackEmailSuccess && stage === EMAIL) {
          nextStage();
          localStorage.setItem('carevineLastFeedback', Date.now());
        }
      }, [sendFeedbackEmailSuccess]);

      useEffect(() => {
        const lastFeedbackTime = localStorage.getItem('carevineLastFeedback');
        if (lastFeedbackTime) {
          const timeSinceLastFeedback = Date.now() - lastFeedbackTime;
          if (timeSinceLastFeedback < 1000 * 60 * 60 * 24) {
            setStage(SUCCESS);
          }
        }
      }, []);

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          {/* TODO: change submit disabled for each to be dependent on specific field */}
          {stage === DEVICE_TYPE && (
            <div className={classNames(css.field, css.deviceType)}>
              <FieldButtonGroup
                className={css.buttonGroup}
                buttonRootClassName={css.buttonGroupRoot}
                name="deviceType"
                options={deviceOptions}
                selectedClassName={css.buttonGroupSelected}
                label="What type of device are you using?"
                initialSelect={values?.deviceType}
              />
              <div className={css.submitButtonWrapper}>
                <GradientButton
                  type="button"
                  inProgress={submitInProgress}
                  disabled={!values?.deviceType}
                  className={css.nextButton}
                  onClick={nextStage}
                >
                  NEXT
                </GradientButton>
              </div>
            </div>
          )}

          {stage === USER_TYPE && (
            <div className={css.field}>
              <Button onClick={prevStage} rootClassName={css.goBackButton} type="button">
                <IconArrowHead rootClassName={css.arrowIcon} direction="left" size="small" />
                <span className={css.goBackText}>Go back</span>
              </Button>
              <FieldButtonGroup
                className={css.buttonGroup}
                buttonRootClassName={css.buttonGroupRoot}
                name="userType"
                options={userTypeOptions}
                selectedClassName={css.buttonGroupSelected}
                label="What are you using this site for?"
                initialSelect={values?.userType}
              />
              <div className={css.submitButtonWrapper}>
                <GradientButton
                  type="button"
                  inProgress={submitInProgress}
                  disabled={!values?.userType}
                  className={css.nextButton}
                  onClick={nextStage}
                >
                  NEXT
                </GradientButton>
              </div>
            </div>
          )}

          {stage === IMPROVE_EXPERIENCE && (
            <div className={css.field}>
              <Button onClick={prevStage} rootClassName={css.goBackButton} type="button">
                <IconArrowHead rootClassName={css.arrowIcon} direction="left" size="small" />
                <span className={css.goBackText}>Go back</span>
              </Button>
              <FieldTextInput
                id="suggestions"
                name="suggestions"
                type="textarea"
                label="Do you have any suggestions for how we could improve your experience?"
                maxLength={DESCRIPTION_MAX_LENGTH}
                validate={maxLength(
                  'Must be less than or equal to 700 characters',
                  DESCRIPTION_MAX_LENGTH
                )}
                inputRootClass={css.textAreaRoot}
              />
              <div className={css.submitButtonWrapper}>
                <GradientButton
                  type="button"
                  disabled={!values.suggestions || invalid}
                  className={css.nextButton}
                  onClick={nextStage}
                >
                  NEXT
                </GradientButton>
              </div>
            </div>
          )}

          {stage === ISSUES && (
            <div className={css.field}>
              <Button onClick={prevStage} rootClassName={css.goBackButton} type="button">
                <IconArrowHead rootClassName={css.arrowIcon} direction="left" size="small" />
                <span className={css.goBackText}>Go back</span>
              </Button>
              <FieldTextInput
                id="issues"
                name="issues"
                type="textarea"
                label="Did you encounter any bugs or issues while using the site?"
                maxLength={DESCRIPTION_MAX_LENGTH}
                validate={maxLength(
                  'Must be less than or equal to 700 characters',
                  DESCRIPTION_MAX_LENGTH
                )}
                inputRootClass={css.textAreaRoot}
              />
              <div className={css.submitButtonWrapper}>
                <GradientButton
                  type="button"
                  disabled={!values?.issues || invalid}
                  className={css.nextButton}
                  onClick={nextStage}
                >
                  NEXT
                </GradientButton>
              </div>
            </div>
          )}

          {stage === EMAIL && (
            <div className={css.field}>
              <Button onClick={prevStage} rootClassName={css.goBackButton} type="button">
                <IconArrowHead rootClassName={css.arrowIcon} direction="left" size="small" />
                <span className={css.goBackText}>Go back</span>
              </Button>
              <FieldTextInput
                id="email"
                name="email"
                label="Provide your email below to receive free credits for your feedback! (optional)"
                placeholder="john.doe@example.com"
                maxLength={DESCRIPTION_MAX_LENGTH}
                inputRootClass={css.textAreaRoot}
              />
              <FieldButtonGroup
                rootClassName={css.bgRoot}
                buttonRootClassName={css.buttonGroupRoot}
                className={css.buttonGroup}
                name="willingToContact"
                options={yesNoOptions}
                selectedClassName={css.buttonGroupSelected}
                label="Would you be interested in talking with our team about your experience? (optional)"
              />
              <div className={css.submitButtonWrapper}>
                {sendFeedbackEmailError ? (
                  <p className={css.error}>
                    <FormattedMessage id="FeedbackForm.sendFeedbackEmailError" />
                  </p>
                ) : null}
                <GradientButton
                  type="submit"
                  inProgress={submitInProgress}
                  ready={sendFeedbackEmailSuccess}
                  className={css.submitButton}
                  onClick={handleSubmit}
                  disabled={submitDisabled}
                >
                  Submit
                </GradientButton>
              </div>
            </div>
          )}

          {stage === SUCCESS && (
            <div className={css.field}>
              <h1 className={css.thankYou}>Thank you!</h1>
              <p className={css.successText}>
                <FormattedMessage id="FeedbackForm.successText" />
              </p>
            </div>
          )}
        </Form>
      );
    }}
  />
);

export default compose(injectIntl)(FeedbackForm);
