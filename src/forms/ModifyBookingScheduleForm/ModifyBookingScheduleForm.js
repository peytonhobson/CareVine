import React, { useMemo } from 'react';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import { injectIntl } from '../../util/reactIntl';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';
import { Form, Button, PrimaryButton } from '../../components';
import { mapWeekdays, getUnavailableDays } from '../../util/bookings';
import { SectionOneTime, SectionRecurring } from '../EditBookingForm/sections';

import css from './ModifyBookingScheduleForm.module.css';

const checkValidBookingTimes = (bookingTimes, bookingDates) => {
  if (!bookingTimes || !bookingDates || bookingDates.length === 0) return false;

  const sameLength = Object.keys(bookingTimes).length === bookingDates.length;
  const hasStartAndEndTimes = Object.keys(bookingTimes).every(
    bookingTime => bookingTimes[bookingTime].startTime && bookingTimes[bookingTime].endTime
  );

  return sameLength && hasStartAndEndTimes;
};

const ModifyBookingScheduleForm = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={formRenderProps => {
      const {
        className,
        handleSubmit,
        intl,
        values,
        form,
        booking,
        onManageDisableScrolling,
        updateBookingMetadataInProgress,
        updateBookingMetadataError,
        updateBookingMetadataSuccess,
        onGoBack,
      } = formRenderProps;

      const { type: bookingType } = booking.attributes.metadata;

      const { listing } = booking;

      const onDeleteEndDate = () => {
        form.change('endDate', null);
      };

      const { bookedDates = [], bookedDays = [] } = listing.attributes.metadata;
      const filteredBookedDays = bookedDays.filter(b => b.txId !== booking.id.uuid);
      const weekdays = useMemo(() => mapWeekdays(values), [values]);
      const unavailableDays = useMemo(
        () =>
          getUnavailableDays({
            bookedDays: filteredBookedDays,
            startDate: values.startDate?.date,
            endDate: values.endDate?.date,
            bookedDates,
            weekdays,
          }),
        [filteredBookedDays, values.startDate?.date, values.endDate?.date, bookedDates, weekdays]
      );

      const submitInProgress = updateBookingMetadataInProgress;
      const submitDisabled = updateBookingMetadataInProgress || updateBookingMetadataSuccess;
      const submitReady = updateBookingMetadataSuccess;

      return (
        <Form onSubmit={handleSubmit}>
          {bookingType === 'recurring' ? (
            <SectionRecurring
              values={values}
              intl={intl}
              onManageDisableScrolling={onManageDisableScrolling}
              listing={listing}
              onDeleteEndDate={onDeleteEndDate}
              form={form}
              unavailableDates={unavailableDays}
              booking={booking}
            />
          ) : (
            <SectionOneTime
              values={values}
              listing={listing}
              form={form}
              className={css.sectionOneTime}
              booking={booking}
              hideLegend
            />
          )}
          {updateBookingMetadataError ? (
            <p className="text-error">Failed to update booking schedule. Please try again.</p>
          ) : null}
          <div className={css.modalButtonContainer}>
            <Button onClick={onGoBack} className={css.modalButton} type="button">
              Back
            </Button>
            <PrimaryButton
              inProgress={submitInProgress}
              onClick={() => onCancelBooking(booking)}
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

export default compose(injectIntl)(ModifyBookingScheduleForm);
