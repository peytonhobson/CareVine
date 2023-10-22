import React, { useMemo, useState } from 'react';

import { Button, Form, PrimaryButton, BookingExceptions } from '../../..';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import { isEqual } from 'lodash';
import moment from 'moment';
import { addTimeToStartOfDay } from '../../../../util/dates';

import css from '../BookingCardModals.module.css';

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
        updateBookingExceptionsInProgress,
        updateBookingExceptionsError,
        updateBookingExceptionsSuccess,
        bookingExceptions,
        lastChargedDate,
      } = formRenderProps;

      const txId = booking.id.uuid;
      const { listing, provider } = booking;
      const { bookedDates = [], bookedDays = [] } = listing.attributes.metadata;
      const timezone = listing.attributes.publicData.availabilityPlan?.timezone;

      const providerDisplayName = provider.attributes.profile.displayName;

      const filteredBookedDays = useMemo(() => bookedDays.filter(d => d.txId !== txId), [
        bookedDays,
        txId,
      ]);

      const allNewExceptions = Object.values(values.exceptions).flat();
      const allOldExceptions = Object.values(bookingExceptions).flat();

      const addedExceptions = allNewExceptions.filter(
        e => !allOldExceptions.some(o => isEqual(e, o))
      );
      const removedExceptions = allOldExceptions.filter(
        o => !allNewExceptions.some(e => isEqual(e, o))
      );

      const firstException = [...addedExceptions, ...removedExceptions].sort((a, b) =>
        moment(a.date).diff(b.date)
      )?.[0];
      const firstExceptionDateTime = addTimeToStartOfDay(
        firstException?.date,
        firstException?.startTime
      );
      const threeDaysFromNow = moment().add(3, 'days');
      const expiration = moment(firstExceptionDateTime).isAfter(threeDaysFromNow)
        ? threeDaysFromNow.format('MMMM Do')
        : moment(firstExceptionDateTime).format('MMMM Do');
      const expirationTime = moment(firstExceptionDateTime).isAfter(threeDaysFromNow)
        ? moment(expiration).format('h:mm a')
        : moment(firstExceptionDateTime).format('h:mm a');

      const submitInProgress = updateBookingExceptionsInProgress;
      const submitReady = updateBookingExceptionsSuccess;
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
            firstAvailableDate={moment(lastChargedDate)
              .add('1', 'weeks')
              .startOf('week')}
          />
          {showNoChangeError ? (
            <p className="text-error">
              You have not made any changes to your exceptions. Please make changes before
              submitting.
            </p>
          ) : null}
          {updateBookingExceptionsError ? (
            <p className="text-error">Failed to update booking exceptions. Please try again.</p>
          ) : null}
          {!isEqual(bookingExceptions, values.exceptions) ? (
            <p className="text-primary">
              When you click 'Submit', a request to change your booking exceptions will be sent to{' '}
              {providerDisplayName}. They have until {expiration} at {expirationTime} to accept or
              decline. If they respond or the request expires, you will be notified.
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
