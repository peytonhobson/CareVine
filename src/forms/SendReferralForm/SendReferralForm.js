import React from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';
import { Form, PrimaryButton, FieldTextInput, NamedLink } from '../../components';
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
      } = fieldRenderProps;

      const [showSameEmailError, setShowSameEmailError] = React.useState(false);

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
        const email = values.email;
        setShowSameEmailError(false);

        const hasReferral = referrals?.find(referral => referral.email === email);

        if (hasReferral) {
          setShowSameEmailError(true);
          return;
        }

        handleSubmit(e);
      };

      return (
        <Form className={classes} onSubmit={onSubmit}>
          <div>
            <FieldTextInput
              className={css.email}
              inputRootClass={css.emailRoot}
              type="email"
              id={formId ? `${formId}.email` : 'email'}
              name="email"
              label={emailLabel}
              placeholder={emailPlaceholder}
              validate={validators.composeValidators(emailRequired, emailValid)}
            />
          </div>
          {sendReferralError ? (
            <p className={css.error}>
              <FormattedMessage id="SendReferralForm.sendReferralCodeError" />
            </p>
          ) : null}
          {showSameEmailError ? (
            <p className={css.error}>
              <FormattedMessage id="SendReferralForm.sameEmailError" />
            </p>
          ) : null}
          <PrimaryButton
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
            className={css.submitButton}
            ready={referralSent}
          >
            <FormattedMessage id="SendReferralForm.sendNow" />
          </PrimaryButton>
        </Form>
      );
    }}
  />
);

export default sendReferralForm;
