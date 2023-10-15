import React, { useMemo } from 'react';

import { Button, Form, PrimaryButton, DailyPlan } from '../../..';
import { Form as FinalForm } from 'react-final-form';
import { WEEKDAYS } from '../../../../util/constants';
import { getUnavailableDays } from '../../../../util/bookings';
import arrayMutators from 'final-form-arrays';

import css from '../BookingCardModals.module.css';

const MODIFY_SCHEDULE_ACTIONS = 'modifyScheduleActions';

const FULL_BOOKING_SCHEDULE = [
  {
    dayOfWeek: 'sun',
  },
  {
    dayOfWeek: 'mon',
  },
  {
    dayOfWeek: 'tue',
  },
  {
    dayOfWeek: 'wed',
  },
  {
    dayOfWeek: 'thu',
  },
  {
    dayOfWeek: 'fri',
  },
  {
    dayOfWeek: 'sat',
  },
];

const ModifyScheduleRecurringForm = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={formRenderProps => {
      const {
        handleSubmit,
        onGoBack,
        values,
        booking,
        updateBookingMetadataInProgress,
        updateBookingMetadataError,
        updateBookingMetadataSuccess,
        intl,
      } = formRenderProps;

      const txId = booking.id.uuid;
      const { startDate, endDate } = booking.attributes.metadata;
      const { listing } = booking;
      const { bookedDates = [], bookedDays = [] } = listing.attributes.metadata;

      const filteredBookedDays = bookedDays.filter(d => d.txId !== txId);

      // TODO: Change start date used to be for when this takes effect
      const unavailableDays = useMemo(
        () =>
          getUnavailableDays({
            bookedDays: filteredBookedDays,
            startDate,
            endDate,
            bookedDates,
            weekdays: FULL_BOOKING_SCHEDULE,
          }),
        [filteredBookedDays, startDate, endDate, bookedDates]
      );

      const submitInProgress = updateBookingMetadataInProgress;
      const submitDisabled = updateBookingMetadataInProgress || updateBookingMetadataSuccess;
      const submitReady = updateBookingMetadataSuccess;

      return (
        <Form onSubmit={handleSubmit}>
          {/* <FormSpy subscription={{ values: true }} onChange={handleChange} /> */}
          <div className={css.week}>
            {WEEKDAYS.map(w => {
              return (
                <DailyPlan
                  dayOfWeek={w}
                  key={w}
                  values={values}
                  intl={intl}
                  multipleTimesDisabled
                  disabled={unavailableDays?.includes(w)}
                  className={css.dailyPlan}
                />
              );
            })}
          </div>
          {updateBookingMetadataError ? (
            <p className={css.error}>Failed to update booking schedule. Please try again.</p>
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
              inProgress={submitInProgress}
              className="w-auto ml-4 px-6 min-w-[10rem]"
              ready={submitReady}
              disabled={submitDisabled}
              type="submit"
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
