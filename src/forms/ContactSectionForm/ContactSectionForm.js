import React from 'react';

import { FormattedMessage } from 'react-intl';
import { Form as FinalForm } from 'react-final-form';
import { Form, Button, FieldTextInput, PrimaryButton } from '../../components';
import {
  required,
  composeValidators,
  emailFormatValid,
  minLength,
  maxLength,
} from '../../util/validators';
import classNames from 'classnames';

import css from './ContactSectionForm.module.css';

const MESSAGE_MIN_LENGTH = 100;
const MESSAGE_MAX_LENGTH = 1000;

const ContactSectionForm = props => (
  <FinalForm
    {...props}
    render={formRenderProps => {
      const {
        handleSubmit,
        invalid,
        pristine,
        ready,
        sendContactEmailInProgress,
        sendContactEmailError,
        className,
      } = formRenderProps;

      const messageLabel = (
        <span>
          What do you want to tell us?{' '}
          <span className={css.characterLabel}>(100-1000 characters)</span>
        </span>
      );

      const submitInProgress = sendContactEmailInProgress;
      const submitDisabled = invalid || pristine || submitInProgress;

      const maxLength1000Message = maxLength(
        'Message cannot be greater than 1000 characters',
        MESSAGE_MAX_LENGTH
      );
      const minLength50Message = minLength(
        'Message must be at least 50 characters',
        MESSAGE_MIN_LENGTH
      );

      return (
        <Form className={classNames(css.root, className)} onSubmit={handleSubmit}>
          <div className={css.row}>
            <FieldTextInput
              inputRootClass={css.textInput}
              type="text"
              id="name"
              name="name"
              placeholder="Name"
              validate={required('Name is required')}
            />
            <FieldTextInput
              inputRootClass={css.textInput}
              type="email"
              id="email"
              name="email"
              placeholder="Email"
              validate={composeValidators(
                required('Email is required'),
                emailFormatValid('Please provide a valid email address')
              )}
            />
          </div>
          <FieldTextInput
            inputRootClass={css.textInput}
            id="message"
            name="message"
            type="textarea"
            minLength={MESSAGE_MIN_LENGTH}
            maxLength={MESSAGE_MAX_LENGTH}
            placeholder="Hi. I'd like to learn more about..."
            validate={composeValidators(
              required('Message is required'),
              maxLength1000Message,
              minLength50Message
            )}
            characterCount
          />
          {sendContactEmailError ? (
            <p className={css.error}>
              <FormattedMessage id="ContactUsPage.sendContactEmailError" />
            </p>
          ) : null}
          <div className={css.buttonContainer}>
            <PrimaryButton className={css.submitButton} type="submit" inProgress={submitInProgress}>
              Send
            </PrimaryButton>
          </div>
        </Form>
      );
    }}
  />
);

export default ContactSectionForm;
