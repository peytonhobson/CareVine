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
  FieldRangeSlider,
  FieldSelect,
} from '../../components';
import { composeValidators, required, maxLength, emailFormatValid } from '../../util/validators';
import { compose } from 'redux';

import css from './FeedbackForm.module.css';

const isDev = process.env.NODE_ENV === 'development';

const DEVICE_TYPE = 'deviceType';
const USER_TYPE = 'userType';
const FIND_SITE = 'findSite';
// const POSITIVES = 'positives';
const IMPROVE_EXPERIENCE = 'improveExperience';
const SECURITY = 'security';
const AGE = 'age';
const ABILITY_RATING = 'abilityRating';
const APPEARANCE_RATING = 'appearanceRating';
const EASE_RATING = 'easeRating';
const RATINGS = 'ratings';
const EMAIL = 'email';
const SUCCESS = 'success';

const stages = [
  DEVICE_TYPE,
  USER_TYPE,
  FIND_SITE,
  // POSITIVES,
  IMPROVE_EXPERIENCE,
  SECURITY,
  AGE,
  ABILITY_RATING,
  APPEARANCE_RATING,
  EASE_RATING,
  EMAIL,
  SUCCESS,
];

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

const ageOptions = [
  { key: 'under30', label: 'Under 30' },
  { key: '30s', label: '30s' },
  { key: '40s', label: '40s' },
  { key: '50s', label: '50s' },
  { key: '60s', label: '60s' },
  { key: '70s', label: '70s' },
  { key: '80s', label: '80s' },
  { key: '90s', label: '90s' },
  { key: 'over100', label: 'Over 100' },
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

          {stage === FIND_SITE && (
            <div className={css.field}>
              <Button onClick={prevStage} rootClassName={css.goBackButton} type="button">
                <IconArrowHead rootClassName={css.arrowIcon} direction="left" size="small" />
                <span className={css.goBackText}>Go back</span>
              </Button>
              <FieldTextInput
                id="findSite"
                name="findSite"
                type="textarea"
                label="How did you find this site? If through a search engine like Google, please provide what you searched for."
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
                  inProgress={submitInProgress}
                  disabled={!isDev && !values?.findSite}
                  className={css.nextButton}
                  onClick={nextStage}
                >
                  NEXT
                </GradientButton>
              </div>
            </div>
          )}

          {stage === SECURITY && (
            <div className={css.field}>
              <Button onClick={prevStage} rootClassName={css.goBackButton} type="button">
                <IconArrowHead rootClassName={css.arrowIcon} direction="left" size="small" />
                <span className={css.goBackText}>Go back</span>
              </Button>
              <FieldButtonGroup
                className={css.buttonGroup}
                buttonRootClassName={css.buttonGroupRoot}
                name="security"
                options={yesNoOptions}
                selectedClassName={css.buttonGroupSelected}
                label="Would you feel secure entering your personal information into this website?"
                initialSelect={values?.security}
              />
              {values?.security === 'no' && (
                <FieldTextInput
                  id="securityReason"
                  name="securityReason"
                  type="textarea"
                  label="Why not?"
                  maxLength={DESCRIPTION_MAX_LENGTH}
                  validate={maxLength(
                    'Must be less than or equal to 700 characters',
                    DESCRIPTION_MAX_LENGTH
                  )}
                  inputRootClass={css.textAreaRoot}
                  className={css.securityTA}
                />
              )}
              <div className={css.submitButtonWrapper}>
                <GradientButton
                  type="button"
                  inProgress={submitInProgress}
                  disabled={!values?.security}
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
                label="Were there any aspects of the site that were unclear or difficult to use?"
                maxLength={DESCRIPTION_MAX_LENGTH}
                validate={maxLength(
                  'Must be less than or equal to 700 characters',
                  DESCRIPTION_MAX_LENGTH
                )}
                inputRootClass={css.textAreaRoot}
              />
              <div className={css.submitButtonWrapper}>
                <GradientButton type="button" className={css.nextButton} onClick={nextStage}>
                  NEXT
                </GradientButton>
              </div>
            </div>
          )}

          {stage === AGE && (
            <div className={css.field}>
              <Button onClick={prevStage} rootClassName={css.goBackButton} type="button">
                <IconArrowHead rootClassName={css.arrowIcon} direction="left" size="small" />
                <span className={css.goBackText}>Go back</span>
              </Button>
              <FieldButtonGroup
                buttonRootClassName={css.buttonGroupRootAge}
                className={classNames(css.buttonGroupAge, css.buttonGroup)}
                name="age"
                options={ageOptions}
                selectedClassName={classNames(css.buttonGroupSelected, css.buttonGroupSelectedAge)}
                label="What is your age range?"
              />
              <div className={css.submitButtonWrapper}>
                <GradientButton type="button" className={css.nextButton} onClick={nextStage}>
                  NEXT
                </GradientButton>
              </div>
            </div>
          )}

          {stage === ABILITY_RATING && (
            <div className={css.field}>
              <Button onClick={prevStage} rootClassName={css.goBackButton} type="button">
                <IconArrowHead rootClassName={css.arrowIcon} direction="left" size="small" />
                <span className={css.goBackText}>Go back</span>
              </Button>
              <label className={css.ratingQuestion}>
                How would you rate your ability to use the internet for tasks like entering personal
                info, setting up payment methods, etc.?
              </label>
              <FieldRangeSlider
                className={css.rangeSlider}
                min={1}
                max={10}
                step={1}
                name="abilityRating"
                handles={[5]}
                withMarks
                noHandleLabels
              />
              <div className={css.submitButtonWrapper}>
                <GradientButton type="button" className={css.nextButton} onClick={nextStage}>
                  NEXT
                </GradientButton>
              </div>
            </div>
          )}

          {stage === APPEARANCE_RATING && (
            <div className={css.field}>
              <Button onClick={prevStage} rootClassName={css.goBackButton} type="button">
                <IconArrowHead rootClassName={css.arrowIcon} direction="left" size="small" />
                <span className={css.goBackText}>Go back</span>
              </Button>
              <label className={css.ratingQuestion}>
                How would you rate the appearance of the website?
              </label>
              <FieldRangeSlider
                className={css.rangeSlider}
                min={1}
                max={10}
                step={1}
                name="appearanceRating"
                handles={[5]}
                withMarks
                noHandleLabels
              />
              <div className={css.submitButtonWrapper}>
                <GradientButton type="button" className={css.nextButton} onClick={nextStage}>
                  NEXT
                </GradientButton>
              </div>
            </div>
          )}

          {stage === EASE_RATING && (
            <div className={css.field}>
              <Button onClick={prevStage} rootClassName={css.goBackButton} type="button">
                <IconArrowHead rootClassName={css.arrowIcon} direction="left" size="small" />
                <span className={css.goBackText}>Go back</span>
              </Button>
              <label className={css.ratingQuestion}>
                How would you rate the ease-of-use of the website?
              </label>
              <FieldRangeSlider
                className={css.rangeSlider}
                min={1}
                max={10}
                step={1}
                name="easeRating"
                handles={[5]}
                withMarks
                noHandleLabels
              />
              <div className={css.submitButtonWrapper}>
                <GradientButton type="button" className={css.nextButton} onClick={nextStage}>
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
