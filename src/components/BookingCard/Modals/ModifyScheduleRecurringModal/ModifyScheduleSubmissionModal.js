import React from 'react';

import { Button, PrimaryButton, Modal, WeeklyBillingDetails } from '../../..';
import { FULL_WEEKDAY_MAP } from '../../../../util/constants';
import moment from 'moment';
import css from '../BookingCardModals.module.css';
import classNames from 'classnames';
import {
  TRANSITION_REQUEST_BOOKING,
  TRANSITION_REQUEST_UPDATE_START,
} from '../../../../util/transaction';

const ModifyScheduleSubmissionModal = props => {
  const {
    isOpen,
    onClose,
    onManageDisableScrolling,
    weekdays,
    values,
    submitInProgress,
    submitReady,
    submitDisabled,
    provider,
    listing,
    newBooking,
    appliedDate,
    lastChargedDate,
    onSubmit,
    error,
    onCloseFully,
  } = props;

  const threeDaysFromNow = moment().add(3, 'days');
  const expiration = moment(appliedDate).isAfter(threeDaysFromNow) ? threeDaysFromNow : appliedDate;
  const expirationDay = moment(expiration).format('dddd, MMMM Do');
  const expirationTime = moment(expiration).format('h:mm a');

  const lastTransition = newBooking.attributes.lastTransition;
  const isRequest =
    lastTransition === TRANSITION_REQUEST_BOOKING ||
    lastTransition === TRANSITION_REQUEST_UPDATE_START;

  return (
    <Modal
      title="Submit Booking Schedule Change"
      id="SubmitBookingScheduleChangeModal"
      isOpen={isOpen}
      onClose={submitReady ? onCloseFully : onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
      key={isOpen}
    >
      <p className={classNames(css.modalTitle, 'mt-16 md:mt-0')}>Booking Change Summary</p>
      <h2 className="text-center mt-10">Weekly Schedule</h2>
      <div className="flex flex-col gap-4">
        {weekdays?.map(day => {
          const { dayOfWeek, startTime, endTime } = day;

          return (
            <div className="flex mx-auto" key={dayOfWeek}>
              <span className="px-4 py-2 bg-primary rounded-l-button text-light text-center w-36">
                {FULL_WEEKDAY_MAP[dayOfWeek]}
              </span>
              <span className="px-4 py-2 bg-secondary rounded-r-button text-light text-center w-48">
                {startTime} - {endTime}
              </span>
            </div>
          );
        })}
      </div>
      {values.endDate?.date ? (
        <div className="mt-8 flex flex-col items-center">
          <h2 className="text-center">End Date</h2>
          <span className="px-4 py-2 bg-primary text-light text-center w-auto rounded-button max-w-xs">
            {moment(values.endDate.date).format('dddd, MMMM Do')}
          </span>
        </div>
      ) : null}
      <h2 className="text-center mt-14">New Weekly Billing Details</h2>
      <WeeklyBillingDetails
        className="mt-6"
        booking={newBooking}
        currentAuthor={provider}
        listing={listing}
        onManageDisableScrolling={onManageDisableScrolling}
      />
      <div className="mt-10">
        {appliedDate && lastChargedDate ? (
          <p className={classNames(css.modalMessage, 'text-attention')}>
            You have already been charged for the week of{' '}
            {moment(lastChargedDate)
              .startOf('week')
              .format('MMMM Do')}{' '}
            to{' '}
            {moment(lastChargedDate)
              .endOf('week')
              .format('MMMM Do')}
            . The changes to your schedule will be applied starting on{' '}
            {moment(appliedDate).format('dddd, MMMM Do')}.
          </p>
        ) : null}
        {isRequest ? (
          <p className={classNames(css.modalMessage, 'text-primary')}>
            By clicking 'Submit', you are changing your weekly schedule to what's listed above. You
            are also agreeing to the new weekly billing details.
          </p>
        ) : (
          <p className={classNames(css.modalMessage, 'text-primary')}>
            By clicking 'Submit', you are sending a request to your caregiver to change your weekly
            schedule. Your caregiver will need to approve this request before it is applied to your
            booking. This request will expire on {expirationDay} at {expirationTime}. If this
            request expires, your booking will continue with the original schedule.
          </p>
        )}
      </div>
      {error ? (
        <p className="text-error text-center">
          Failed to update booking schedule. Please try again.
        </p>
      ) : null}
      <div className={css.modalButtonContainer}>
        {submitReady ? (
          <Button
            onClick={onCloseFully}
            className={classNames(css.dropAnimation, css.modalButton)}
            type="button"
          >
            Close
          </Button>
        ) : (
          <Button onClick={onClose} className={css.modalButton} type="button">
            Back
          </Button>
        )}
        <PrimaryButton
          inProgress={submitInProgress}
          className="w-auto ml-4 px-6 min-w-[10rem]"
          ready={submitReady}
          disabled={submitDisabled}
          onClick={onSubmit}
        >
          Submit
        </PrimaryButton>
      </div>
    </Modal>
  );
};

export default ModifyScheduleSubmissionModal;
