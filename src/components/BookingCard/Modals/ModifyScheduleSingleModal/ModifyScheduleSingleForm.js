import React from 'react';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';
import { Form, Button, PrimaryButton } from '../../..';
import { SectionOneTime } from '../../../../forms/EditBookingForm/sections';

import css from '../BookingCardModals.module.css';

const ModifyScheduleSingleForm = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={formRenderProps => {
      const {
        handleSubmit,
        values,
        form,
        booking,
        updateRequestedBookingInProgress,
        updateRequestedBookingError,
        updateRequestedBookingSuccess,
        onGoBack,
        onClose,
      } = formRenderProps;

      const { listing } = booking;

      const submitInProgress = updateRequestedBookingInProgress;
      const submitDisabled = submitInProgress || updateRequestedBookingSuccess;
      const submitReady = updateRequestedBookingSuccess;

      return (
        <Form onSubmit={handleSubmit}>
          <SectionOneTime
            values={values}
            listing={listing}
            form={form}
            className={css.sectionOneTime}
            booking={booking}
          />
          {updateRequestedBookingError ? (
            <p className="text-error">Failed to update booking. Please try again.</p>
          ) : null}
          <div className={css.modalButtonContainer}>
            {submitReady ? (
              <Button
                onClick={onClose}
                className={classNames(css.dropAnimation, css.modalButton)}
                type="button"
              >
                Close
              </Button>
            ) : (
              <Button onClick={onGoBack} className={css.modalButton} type="button">
                Back
              </Button>
            )}
            <PrimaryButton
              inProgress={submitInProgress}
              onClick={handleSubmit}
              className={css.modalButton}
              ready={submitReady}
              disabled={submitDisabled}
              type="submit"
            >
              Submit Changes
            </PrimaryButton>
          </div>
        </Form>
      );
    }}
  />
);

export default ModifyScheduleSingleForm;
