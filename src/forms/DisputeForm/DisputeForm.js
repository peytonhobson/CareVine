import React from 'react';
import { string, bool } from 'prop-types';
import { compose } from 'redux';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';
import {
  Form,
  PrimaryButton,
  FieldTextInput,
  IconEnquiry,
  UserListingPreview,
  Avatar,
} from '../../components';
import * as validators from '../../util/validators';
import { propTypes } from '../../util/types';

import css from './DisputeForm.module.css';

const DisputeFormComponent = props => (
  <FinalForm
    {...props}
    render={fieldRenderProps => {
      const {
        rootClassName,
        className,
        formId,
        handleSubmit,
        inProgress,
        disputeBookingError,
        disputeBookingSuccess,
        invalid,
        pristine,
      } = fieldRenderProps;

      const classes = classNames(rootClassName || css.root, className);
      const submitInProgress = inProgress;
      const submitDisabled = invalid || pristine || submitInProgress || disputeBookingSuccess;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <FieldTextInput
            className={css.field}
            type="textarea"
            name="disputeReason"
            id={formId ? `${formId}.disputeReason` : 'disputeReason'}
            label="Detailed description of dispute"
            validate={validators.required('Please provide a detailed description of the dispute')}
          />
          <div className={css.submitButtonWrapper}>
            {disputeBookingError ? (
              <p className={css.error}>
                There was an error submitting your dispute. Please check that 48 hours haven't
                passed since the booking ended and try again.
              </p>
            ) : null}
            <PrimaryButton
              type="submit"
              inProgress={submitInProgress}
              disabled={submitDisabled}
              className={css.submitButton}
              ready={disputeBookingSuccess}
            >
              Submit Dispute
            </PrimaryButton>
          </div>
        </Form>
      );
    }}
  />
);

const DisputeForm = compose(injectIntl)(DisputeFormComponent);

export default DisputeForm;
