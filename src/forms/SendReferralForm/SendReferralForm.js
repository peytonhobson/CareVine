import React, { useState, useEffect } from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import classNames from 'classnames';
import { Form, PrimaryButton, FieldTextInput, InlineTextButton, IconClose } from '../../components';
import * as validators from '../../util/validators';

import css from './SendReferralForm.module.css';

const MILLISECONDS_THREE_DAYS = 259200000;

const sendReferralForm = props => (
  <FinalForm
    {...props}
    render={fieldRenderProps => {
      const {
        rootClassName,
        className,
        formId,
        handleSubmit,
        inProgress,
        intl,
        invalid,
        sendReferralInProgress,
        sendReferralError,
        referralSent,
        referrals,
        values,
        isSendReferralModalOpen,
        form,
      } = fieldRenderProps;

      const [referralError, setReferralError] = useState(null);
      const [duplicateEmailError, setDuplicateEmailError] = useState(false);
      const [submitReady, setSubmitReady] = useState(false);
      const [numberOfEmails, setNumberOfEmails] = useState(1);

      useEffect(() => {
        if (referralSent) {
          setSubmitReady(true);
        }
      }, [referralSent]);

      useEffect(() => {
        if (!isSendReferralModalOpen) {
          setSubmitReady(false);
          setDuplicateEmailError(false);
          setReferralError(null);
          setNumberOfEmails(1);
          form.restart();
        }
      }, [isSendReferralModalOpen]);

      const handleRemoveEmail = index => {
        const emails = [...Array(numberOfEmails)].map((_, i) => values[`email${i}`]);

        emails.splice(index, 1);

        setNumberOfEmails(emails.length);

        for (let i = 0; i < emails.length; i++) {
          form.change(`email${i}`, emails[i]);
        }

        for (let i = emails.length; i < numberOfEmails; i++) {
          form.change(`email${i}`, null);
        }
      };

      // email
      const emailLabel = intl.formatMessage({
        id: 'SendReferralForm.emailLabel',
      });
      const emailPlaceholder = intl.formatMessage({
        id: 'SendReferralForm.emailPlaceholder',
      });
      const emailRequiredMessage = intl.formatMessage({
        id: 'SendReferralForm.emailRequired',
      });
      const emailRequired = validators.required(emailRequiredMessage);
      const emailInvalidMessage = intl.formatMessage({
        id: 'SendReferralForm.emailInvalid',
      });
      const emailValid = validators.emailFormatValid(emailInvalidMessage);

      const classes = classNames(rootClassName || css.root, className);
      const submitInProgress = inProgress || sendReferralInProgress;
      const submitDisabled = invalid || submitInProgress;

      const onSubmit = e => {
        e.preventDefault();

        let referralIndex = -1;
        let duplicateEmailIndex = -1;
        let emails = [];

        for (let i = 0; i < numberOfEmails; i++) {
          if (referralIndex > -1 || duplicateEmailIndex > -1) {
            break;
          }

          const email = values[`email${i}`];

          if (emails.includes(email)) {
            duplicateEmailIndex = i;
            break;
          }

          emails.push(email);

          if (referrals?.find(referral => referral.email === email)) {
            referralIndex = i;
          }
        }

        if (referralIndex > -1) {
          setReferralError(referralIndex);
          return;
        }

        if (duplicateEmailIndex > -1) {
          setDuplicateEmailError(duplicateEmailIndex);
          return;
        }

        handleSubmit(e);
      };

      return (
        <Form className={classes} onSubmit={onSubmit}>
          <FormSpy
            onChange={() => {
              setReferralError(false);
              setDuplicateEmailError(false);
            }}
          />
          <div>
            {[...Array(numberOfEmails)].map((_, index) => {
              return (
                <div className={css.inputContainer} key={`email${index}`}>
                  <FieldTextInput
                    className={css.email}
                    inputRootClass={css.emailRoot}
                    type={`email${index}`}
                    id={`email${index}`}
                    name={`email${index}`}
                    label={emailLabel}
                    placeholder={emailPlaceholder}
                    validate={validators.composeValidators(emailRequired, emailValid)}
                  />
                  {index !== 0 && (
                    <IconClose onClick={() => handleRemoveEmail(index)} className={css.iconClose} />
                  )}
                  {referralError === index && (
                    <p className={css.error}>
                      <FormattedMessage id="SendReferralForm.sameEmailError" />
                    </p>
                  )}
                  {duplicateEmailError === index && (
                    <p className={css.error}>
                      <FormattedMessage id="SendReferralForm.duplicateEmailError" />
                    </p>
                  )}
                </div>
              );
            })}
            <InlineTextButton
              type="button"
              className={css.addEmailButton}
              onClick={() => setNumberOfEmails(num => num + 1)}
            >
              + Add another email
            </InlineTextButton>
          </div>
          {sendReferralError ? (
            <p className={css.error}>
              <FormattedMessage id="SendReferralForm.sendReferralCodeError" />
            </p>
          ) : null}
          <PrimaryButton
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
            className={css.submitButton}
            ready={submitReady}
          >
            <FormattedMessage id="SendReferralForm.sendNow" />
          </PrimaryButton>
        </Form>
      );
    }}
  />
);

export default sendReferralForm;
