import React, { useMemo, useState } from 'react';

import { Button, Form, PrimaryButton, BookingExceptions } from '../../..';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import css from '../BookingCardModals.module.css';
import { isEqual } from 'lodash';

const MODIFY_SCHEDULE_ACTIONS = 'modifyScheduleActions';

const ModifyScheduleRecurringForm = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={formRenderProps => {
      const [showNoChangeError, setShowNoChangeError] = useState(false);
      const {
        handleSubmit,
        onGoBack,
        values,
        booking,
        intl,
        onManageDisableScrolling,
        form,
      } = formRenderProps;

      const txId = booking.id.uuid;
      const { listing } = booking;
      const { exceptions: bookingExceptions = {} } = booking.attributes.metadata;
      const { bookedDates = [], bookedDays = [] } = listing.attributes.metadata;
      const timezone = listing.attributes.publicData.availabilityPlan?.timezone;

      const filteredBookedDays = useMemo(() => bookedDays.filter(d => d.txId !== txId), [
        bookedDays,
        txId,
      ]);

      const submitInProgress = null;
      const submitReady = null;
      const submitDisabled = submitInProgress || submitReady;

      const handleChange = () => {
        setShowNoChangeError(false);
      };

      const onSubmit = e => {
        e.preventDefault();

        if (isEqual(values.exceptions, bookingExceptions)) {
          setShowNoChangeError(true);
          return;
        }

        handleSubmit(e);
      };

      return (
        <Form onSubmit={onSubmit}>
          <FormSpy subscription={{ values: true }} onChange={handleChange} />
          <BookingExceptions
            bookedDates={bookedDates}
            bookedDays={filteredBookedDays}
            values={values}
            onManageDisableScrolling={onManageDisableScrolling}
            intl={intl}
            timezone={timezone}
            form={form}
            booking={booking}
          />
          {showNoChangeError ? (
            <p className="text-error">
              You have not made any changes to your exceptions. Please make changes before
              submitting.
            </p>
          ) : null}
          <div className={css.modalButtonContainer}>
            <Button
              onClick={() => onGoBack(MODIFY_SCHEDULE_ACTIONS)}
              className={css.modalButton}
              type="button"
            >
              Back
            </Button>
            <PrimaryButton
              className={css.modalButton}
              type="submit"
              inProgress={submitInProgress}
              disabled={submitDisabled}
              ready={submitReady}
            >
              Submit
            </PrimaryButton>
          </div>
        </Form>
      );
    }}
  />
);

export default ModifyScheduleRecurringForm;
