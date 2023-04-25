import React, { useState, useRef, useEffect } from 'react';

import { FormattedMessage } from 'react-intl';
import { Form as FinalForm } from 'react-final-form';
import { Form, Button, FieldCheckbox } from '../../components';
import { required } from '../../util/validators';

import css from './ConsentModalForm.module.css';

const ConsentModalForm = props => (
  <FinalForm
    {...props}
    render={formRenderProps => {
      const {
        handleSubmit,
        currentUser,
        authenticateSubmitConsentInProgress,
        authenticateSubmitConsentError,
        invalid,
        disabled,
      } = formRenderProps;

      const [scrollAtBottom, setScrollAtBottom] = useState(false);

      const userFullName = currentUser.attributes.profile.privateData.authenticateFullName ?? '';
      const textWrapper = useRef();
      const authenticateConsent = currentUser.attributes.profile.metadata.authenticateConsent;

      const handleScroll = e => {
        if (e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 30) {
          setScrollAtBottom(true);
          textWrapper.current.style.border = '3px solid var(--successColor)';
        } else if (scrollAtBottom) {
          setScrollAtBottom(false);
          textWrapper.current.style.border = '3px solid var(--matterColorDark)';
        }
      };

      useEffect(() => {
        if (textWrapper.current) {
          textWrapper.current.scrollTo({
            top: 0,
            behavior: 'smooth',
          });
        }
      }, [textWrapper]);

      const submitReady = !!authenticateConsent;
      const submitInProgress = !!authenticateSubmitConsentInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;

      return (
        <Form className={css.root} onSubmit={handleSubmit}>
          <p className={css.modalTitle}>
            <FormattedMessage id="ConsentModalForm.modalTitle" />
          </p>
          <div className={css.consentTextWrapper} onScroll={handleScroll} ref={textWrapper}>
            <p>
              <b>BACKGROUND CHECK</b>
            </p>
            <p>
              Pursuant to the federal Fair Credit Reporting Act (“FCRA”), I hereby authorize
              Authenticating.com LLC and its designated agents and representatives to conduct a
              comprehensive review of my background through a consumer report and/or an
              investigative consumer report that may be used as a factor in establishing my
              eligibility for credit, insurance or for any other purpose in the FCRA. I understand
              that the scope of the consumer report/investigative consumer report may include, but
              is not limited to, the following areas: verification of Social Security number;
              current and previous residences; employment history, including all personnel files;
              education; references; credit history and reports; criminal history, including records
              from any criminal justice agency in any or all federal, state or county jurisdictions;
              birth records; motor vehicle records, including traffic citations and registration;
              and any other public records.
            </p>
            <p>
              I, {userFullName} authorize the complete release of these records or data pertaining
              to me that an individual, company, firm, corporation or public agency may have. I
              hereby authorize and request any present or former employer, school, police
              department, financial institution or other persons having personal knowledge of me to
              furnish Authenticating.com LLC or its designated agents with any and all information
              in their possession regarding me in connection with the use of Crgvr LLC's product,
              service or experience I am signing up for. I am authorizing that a photocopy of this
              authorization be accepted with the same authority as the original. I understand that,
              pursuant to the federal Fair Credit Reporting Act, if any adverse action is to be
              taken based upon the consumer report, a copy of the report and a summary of the
              consumer’s rights will be provided to me. I further understand that by checking the
              box below I am agreeing to the above statements.
            </p>
          </div>

          <span
            onClick={() => {
              if (!scrollAtBottom)
                alert(
                  'Please scroll to the bottom of the text to agree to the terms and conditions.'
                );
            }}
            style={{ width: '100%' }}
          >
            <FieldCheckbox
              id="consent"
              name="consent"
              value="consent"
              label="I agree to statements above."
              className={css.consentCheckbox}
              textClassName={css.consentCheckboxText}
              required
              disabled={!scrollAtBottom}
              validate={required('Please agree to the statements above.')}
            />
          </span>

          {authenticateSubmitConsentError ? (
            <p className={css.error}>
              <FormattedMessage id="ConsentModalForm.error" />
            </p>
          ) : null}

          <Button
            className={css.submitButton}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
            ready={submitReady}
          >
            Submit
          </Button>
        </Form>
      );
    }}
  />
);

export default ConsentModalForm;
