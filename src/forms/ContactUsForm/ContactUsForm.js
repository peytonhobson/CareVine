import React, { useState, useRef, useEffect } from 'react';

import { FormattedMessage } from 'react-intl';
import { Form as FinalForm } from 'react-final-form';
import { Form, Button, FieldTextInput, GradientButton } from '../../components';
import {
  required,
  composeValidators,
  emailFormatValid,
  minLength,
  maxLength,
} from '../../util/validators';

import css from './ContactUsForm.module.css';

const MESSAGE_MIN_LENGTH = 50;
const MESSAGE_MAX_LENGTH = 1000;

const ContactUsForm = props => (
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
        <Form className={css.root} onSubmit={handleSubmit}>
          <FieldTextInput
            className={css.email}
            type="email"
            id="email"
            name="email"
            label="Your email"
            placeholder="John.Doe@example.com"
            validate={composeValidators(
              required('Email is required'),
              emailFormatValid('Please provide a valid email address')
            )}
          />
          <FieldTextInput
            className={css.description}
            id="message"
            name="message"
            type="textarea"
            label={messageLabel}
            minLength={MESSAGE_MIN_LENGTH}
            maxLength={MESSAGE_MAX_LENGTH}
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
            <GradientButton
              className={css.submitButton}
              type="submit"
              inProgress={submitInProgress}
              disabled={submitDisabled}
            >
              Submit
            </GradientButton>
          </div>
        </Form>
      );
    }}
  />
);

export default ContactUsForm;
