import React from 'react';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';
import { Form, Button, PrimaryButton } from '../../..';
import { SectionOneTime } from '../../../../forms/EditBookingForm/sections';
import moment from 'moment';
import ModifyScheduleSubmissionModal from './ModifyScheduleSubmissionModal';

import css from '../BookingCardModals.module.css';

const checkValidBookingTimes = (bookingTimes, bookingDates) => {
  if (!bookingTimes || !bookingDates || bookingDates.length === 0) return false;

  const sameLength = Object.keys(bookingTimes).length === bookingDates.length;
  const hasStartAndEndTimes = Object.keys(bookingTimes).every(
    bookingTime => bookingTimes[bookingTime].startTime && bookingTimes[bookingTime].endTime
  );

  return sameLength && hasStartAndEndTimes;
};

const checkChangedBooking = (booking, values) => {
  const lineItems = booking.attributes.metadata.lineItems;
  const { bookingDates, dateTimes } = values;

  const sameDates =
    bookingDates.every(bookingDate =>
      lineItems.some(lineItem => moment(lineItem.date).isSame(bookingDate, 'day'))
    ) && bookingDates.length === lineItems.length;
  const sameTimes = Object.keys(dateTimes).every(bookingDate =>
    lineItems.some(
      lineItem =>
        lineItem.shortDate === bookingDate &&
        lineItem.startTime === dateTimes[bookingDate].startTime &&
        lineItem.endTime === dateTimes[bookingDate].endTime
    )
  );

  return !sameDates || !sameTimes;
};

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
        onManageDisableScrolling,
      } = formRenderProps;

      const [isSubmissionModalOpen, setIsSubmissionModalOpen] = React.useState(false);
      const [continueError, setContinueError] = React.useState(null);

      const { listing } = booking;

      const submitInProgress = updateRequestedBookingInProgress;
      const submitDisabled = submitInProgress || updateRequestedBookingSuccess;
      const submitReady = updateRequestedBookingSuccess;

      const handleOpenSubmissionModal = () => {
        if (!checkChangedBooking(booking, values)) {
          setContinueError('Please select a new date or time.');
          return;
        }

        if (values.bookingDates.length === 0) {
          setContinueError('Please select at least one date.');
          return;
        }

        if (!checkValidBookingTimes(values.dateTimes, values.bookingDates)) {
          setContinueError('Please select start times and end times for each booking date.');
          return;
        }

        setIsSubmissionModalOpen(true);
      };

      return (
        <Form onSubmit={handleSubmit}>
          <FormSpy subscription={{ values: true }} onChange={() => setContinueError(null)} />
          <SectionOneTime
            values={values}
            listing={listing}
            form={form}
            className={css.sectionOneTime}
            booking={booking}
            hideNextButton
          />
          {continueError ? <p className="text-error">{continueError}</p> : null}
          <div className={css.modalButtonContainer}>
            <Button onClick={onGoBack} className={css.modalButton} type="button">
              Back
            </Button>
            <PrimaryButton
              onClick={handleOpenSubmissionModal}
              className={css.modalButton}
              type="button"
            >
              Continue
            </PrimaryButton>
          </div>
          {isSubmissionModalOpen ? (
            <ModifyScheduleSubmissionModal
              isOpen={isSubmissionModalOpen}
              onClose={() => setIsSubmissionModalOpen(false)}
              onManageDisableScrolling={onManageDisableScrolling}
              submitInProgress={submitInProgress}
              submitReady={submitReady}
              submitDisabled={submitDisabled}
              listing={listing}
              onSubmit={handleSubmit}
              error={updateRequestedBookingError}
              onCloseFully={onClose}
              booking={booking}
              values={values}
            />
          ) : null}
        </Form>
      );
    }}
  />
);

export default ModifyScheduleSingleForm;
