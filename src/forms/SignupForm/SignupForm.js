import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';
import * as validators from '../../util/validators';
import {
  Form,
  PrimaryButton,
  FieldTextInput,
  FieldSelect,
  Modal,
  InlineTextButton,
} from '../../components';
import { useHistory } from 'react-router-dom';

import css from './SignupForm.module.css';

const KEY_CODE_ENTER = 13;
const newListingId = '00000000-0000-0000-0000-000000000000';

const SignupFormComponent = props => (
  <FinalForm
    {...props}
    render={fieldRenderProps => {
      const {
        rootClassName,
        className,
        formId,
        handleSubmit,
        inProgress,
        invalid,
        intl,
        onOpenTermsOfService,
        form,
        onManageDisableScrolling,
      } = fieldRenderProps;

      const [isPasswordRequirementsModalOpen, setIsPasswordRequirementsModalOpen] = useState(false);

      // email
      const emailLabel = intl.formatMessage({
        id: 'SignupForm.emailLabel',
      });
      const emailPlaceholder = intl.formatMessage({
        id: 'SignupForm.emailPlaceholder',
      });
      const emailRequiredMessage = intl.formatMessage({
        id: 'SignupForm.emailRequired',
      });
      const emailRequired = validators.required(emailRequiredMessage);
      const emailInvalidMessage = intl.formatMessage({
        id: 'SignupForm.emailInvalid',
      });
      const emailValid = validators.emailFormatValid(emailInvalidMessage);

      // password
      const passwordLabel = intl.formatMessage({
        id: 'SignupForm.passwordLabel',
      });
      const passwordPlaceholder = intl.formatMessage({
        id: 'SignupForm.passwordPlaceholder',
      });
      const passwordRequiredMessage = intl.formatMessage({
        id: 'SignupForm.passwordRequired',
      });
      const passwordValidMessage = intl.formatMessage({
        id: 'SignupForm.passwordInvalid',
      });
      const passwordMinLengthMessage = intl.formatMessage(
        {
          id: 'SignupForm.passwordTooShort',
        },
        {
          minLength: validators.PASSWORD_MIN_LENGTH,
        }
      );
      const passwordMaxLengthMessage = intl.formatMessage(
        {
          id: 'SignupForm.passwordTooLong',
        },
        {
          maxLength: validators.PASSWORD_MAX_LENGTH,
        }
      );
      const passwordMinLength = validators.minLength(
        passwordMinLengthMessage,
        validators.PASSWORD_MIN_LENGTH
      );
      const passwordMaxLength = validators.maxLength(
        passwordMaxLengthMessage,
        validators.PASSWORD_MAX_LENGTH
      );
      const passwordRequired = validators.requiredStringNoTrim(passwordRequiredMessage);
      const passwordValid = validators.validPasswordFormat(passwordValidMessage);
      const passwordValidators = validators.composeValidators(
        passwordRequired,
        passwordValid,
        passwordMinLength,
        passwordMaxLength
      );

      // firstName
      const firstNameLabel = intl.formatMessage({
        id: 'SignupForm.firstNameLabel',
      });
      const firstNamePlaceholder = intl.formatMessage({
        id: 'SignupForm.firstNamePlaceholder',
      });
      const firstNameRequiredMessage = intl.formatMessage({
        id: 'SignupForm.firstNameRequired',
      });
      const firstNameRequired = validators.required(firstNameRequiredMessage);

      // lastName
      const lastNameLabel = intl.formatMessage({
        id: 'SignupForm.lastNameLabel',
      });
      const lastNamePlaceholder = intl.formatMessage({
        id: 'SignupForm.lastNamePlaceholder',
      });
      const lastNameRequiredMessage = intl.formatMessage({
        id: 'SignupForm.lastNameRequired',
      });
      const lastNameRequired = validators.required(lastNameRequiredMessage);

      const classes = classNames(rootClassName || css.root, className);
      const submitInProgress = inProgress;
      const submitDisabled = invalid || submitInProgress;

      const handleTermsKeyUp = e => {
        // Allow click action with keyboard like with normal links
        if (e.keyCode === KEY_CODE_ENTER) {
          onOpenTermsOfService();
        }
      };
      const termsLink = (
        <span
          className={css.termsLink}
          onClick={onOpenTermsOfService}
          role="button"
          tabIndex="0"
          onKeyUp={handleTermsKeyUp}
        >
          <FormattedMessage id="SignupForm.termsAndConditionsLinkText" />
        </span>
      );

      const history = useHistory();

      const onSubmit = values => {
        values.preventDefault();

        handleSubmit(values);

        history.push(`/select-user-type`);
      };

      return (
        <>
          <Form className={classes} onSubmit={onSubmit}>
            <div>
              <FieldTextInput
                type="email"
                id={formId ? `${formId}.email` : 'email'}
                name="email"
                autoComplete="email"
                label={emailLabel}
                placeholder={emailPlaceholder}
                validate={validators.composeValidators(emailRequired, emailValid)}
              />
              <div className={css.name}>
                <FieldTextInput
                  className={css.firstNameRoot}
                  type="text"
                  id={formId ? `${formId}.fname` : 'fname'}
                  name="fname"
                  autoComplete="given-name"
                  label={firstNameLabel}
                  placeholder={firstNamePlaceholder}
                  validate={firstNameRequired}
                />
                <FieldTextInput
                  className={css.lastNameRoot}
                  type="text"
                  id={formId ? `${formId}.lname` : 'lname'}
                  name="lname"
                  autoComplete="family-name"
                  label={lastNameLabel}
                  placeholder={lastNamePlaceholder}
                  validate={lastNameRequired}
                />
              </div>
              <FieldTextInput
                className={css.password}
                type="password"
                id={formId ? `${formId}.password` : 'password'}
                name="password"
                autoComplete="new-password"
                label={passwordLabel}
                placeholder={passwordPlaceholder}
                validate={passwordValidators}
              />
              <InlineTextButton
                onClick={() => setIsPasswordRequirementsModalOpen(true)}
                className={css.passwordRequirementsButton}
                type="button"
              >
                <FormattedMessage id="SignupForm.passwordRequirements" />
              </InlineTextButton>
            </div>

            <div className={css.bottomWrapper}>
              <p className={css.bottomWrapperText}>
                <span className={css.termsText}>
                  <FormattedMessage
                    id="SignupForm.termsAndConditionsAcceptText"
                    values={{ termsLink }}
                  />
                </span>
              </p>
              <PrimaryButton type="submit" inProgress={submitInProgress} disabled={submitDisabled}>
                <FormattedMessage id="SignupForm.signUp" />
              </PrimaryButton>
            </div>
          </Form>
          <Modal
            id="PasswordRequirements"
            isOpen={isPasswordRequirementsModalOpen}
            onClose={() => setIsPasswordRequirementsModalOpen(false)}
            containerClassName={css.passwordReqs}
            usePortal
            onManageDisableScrolling={onManageDisableScrolling}
          >
            <div className={css.passwordRequirementsModal}>
              <h2 className={css.modalTitle}>
                <FormattedMessage id="SignupForm.passwordRequirements" />
              </h2>
              <ul className={css.passwordRequirementsModalList}>
                <li className={css.passwordRequirementsModalListItem}>
                  <FormattedMessage id="SignupForm.passwordRequirementsListItem1" />
                </li>
                <li className={css.passwordRequirementsModalListItem}>
                  <FormattedMessage id="SignupForm.passwordRequirementsListItem2" />
                </li>
                <li className={css.passwordRequirementsModalListItem}>
                  <FormattedMessage id="SignupForm.passwordRequirementsListItem3" />
                </li>
                <li className={css.passwordRequirementsModalListItem}>
                  <FormattedMessage id="SignupForm.passwordRequirementsListItem4" />
                </li>
                <li className={css.passwordRequirementsModalListItem}>
                  <FormattedMessage id="SignupForm.passwordRequirementsListItem5" />
                </li>
              </ul>
            </div>
          </Modal>
        </>
      );
    }}
  />
);

SignupFormComponent.defaultProps = { inProgress: false };

const { bool, func } = PropTypes;

SignupFormComponent.propTypes = {
  inProgress: bool,

  onOpenTermsOfService: func.isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const SignupForm = compose(injectIntl)(SignupFormComponent);
SignupForm.displayName = 'SignupForm';

export default SignupForm;
