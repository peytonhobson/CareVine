import React, { useMemo, useState } from 'react';

import { Button, Form, PrimaryButton } from '../../..';
import moment from 'moment';
import RefundBookingSummaryCard from '../../../BookingSummaryCard/Refund/RefundBookingSummaryCard';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';
import {
  TRANSITION_REQUEST_BOOKING,
  TRANSITION_REQUEST_UPDATE_START,
} from '../../../../util/transaction';
import { ISO_OFFSET_FORMAT } from '../../../../util/constants';
import FieldChangeEndDate from '../FieldChangeEndDate/FieldChangeEndDate';
import UnapplicableExceptions from '../UnapplicableExceptions/UnapplicableExceptions';

import css from '../BookingCardModals.module.css';

const MODIFY_SCHEDULE_ACTIONS = 'modifyScheduleActions';

const TODAY = moment();

const ChangeEndDateForm = props => (
  <FinalForm
    {...props}
    render={formRenderProps => {
      const [showInvalidError, setShowInvalidError] = useState(false);
      const {
        handleSubmit,
        intl,
        booking,
        updateBookingEndDateInProgress,
        updateBookingEndDateError,
        updateBookingEndDateSuccess,
        onGoBack,
        values,
        form,
        onClose,
      } = formRenderProps;
      const selectedEndDate = values.endDate?.date;
      const formattedEndDate = moment(selectedEndDate).format('MMMM Do');

      const onSubmit = e => {
        e.preventDefault();
        if (!values.endDate?.date) {
          setShowInvalidError(true);
          return;
        }

        handleSubmit(e);
      };

      const {
        chargedLineItems = [],
        endDate: oldEndDate = moment()
          .add(10, 'years')
          .format(ISO_OFFSET_FORMAT),
        awaitingModification = {},
        bookingSchedule,
        exceptions,
      } = booking.attributes.metadata;
      const providerDisplayName = booking?.provider?.attributes?.profile?.displayName;

      const submitInProgress = updateBookingEndDateInProgress;
      const submitDisabled = updateBookingEndDateInProgress || updateBookingEndDateSuccess;
      const submitReady = updateBookingEndDateSuccess;

      const awaitingModificationTypes = Object.keys(awaitingModification);
      const requestedEndDate = awaitingModification?.endDate;

      const lastTransition = booking.attributes.lastTransition;
      const isRequest =
        lastTransition === TRANSITION_REQUEST_BOOKING ||
        lastTransition === TRANSITION_REQUEST_UPDATE_START;

      const hasRefund = useMemo(
        () =>
          selectedEndDate
            ? chargedLineItems.some(item =>
                item.lineItems?.some(i => moment(i.date).isAfter(moment(selectedEndDate)))
              )
            : false,
        [selectedEndDate, chargedLineItems]
      );

      // Used to determine if the user can select future end dates to change to
      const endDateCharged = useMemo(() =>
        oldEndDate
          ? chargedLineItems
              .map(item => item.lineItems?.map(i => i.date))
              .flat()
              .some(d => moment(d).isSame(oldEndDate, 'day'))
          : false[(chargedLineItems, oldEndDate)]
      );

      const startOfSelectedDay = moment(selectedEndDate).startOf('day');
      const threeDaysFromNow = moment().add(3, 'days');
      const expiration = moment(startOfSelectedDay).isAfter(threeDaysFromNow)
        ? threeDaysFromNow
        : startOfSelectedDay;
      const expirationDay = moment(expiration).format('dddd, MMMM Do');
      const expirationTime = moment(expiration).format('h:mm a');
      const futureDateSelected =
        selectedEndDate && moment(selectedEndDate).isAfter(oldEndDate, 'day');

      const hasPendingRequest = awaitingModificationTypes.length > 0;
      const hasPendingEndDatesRequest =
        !awaitingModificationTypes.includes('bookingSchedule') &&
        awaitingModificationTypes.includes('endDate');
      return (
        <Form onSubmit={onSubmit}>
          <h3 className="text-primary text-center md:text-left">
            Current End Date:{' '}
            {booking.attributes.metadata.endDate
              ? moment(oldEndDate).format('dddd, MMM Do')
              : 'No End Date'}
          </h3>
          <FieldChangeEndDate
            intl={intl}
            disabled={awaitingModificationTypes.length > 1 && !hasPendingEndDatesRequest}
            className={css.fieldDateInput}
            booking={booking}
            appliedDate={TODAY}
            values={values}
            lastAvailableDate={endDateCharged ? oldEndDate : null}
          />
          <UnapplicableExceptions
            weekdays={bookingSchedule}
            exceptions={exceptions}
            form={form}
            endDate={values.endDate?.date}
            appliedDate={TODAY}
          />
          {selectedEndDate ? (
            <>
              {hasRefund ? (
                <div className={css.dropAnimation}>
                  <p className={css.modalMessage}>
                    Once your booking is complete, you will be refunded according to the table
                    below:
                  </p>
                  <RefundBookingSummaryCard
                    booking={booking}
                    className="mt-6 rounded-[var(--borderRadius)] border-anti pt-8 border"
                    hideAvatar
                    subHeading="Refund Summary"
                    cancelDate={selectedEndDate}
                  />
                </div>
              ) : null}
              {futureDateSelected && !isRequest ? (
                <p className={classNames(css.dropAnimation, css.modalMessage, 'text-primary')}>
                  When you click 'Submit', a request to change your booking end date to{' '}
                  {formattedEndDate} will be sent to {providerDisplayName}. They have until{' '}
                  {expirationDay} at {expirationTime} to accept or decline. If they respond or the
                  request expires, you will be notified.
                </p>
              ) : (
                <p className={classNames(css.dropAnimation, css.modalMessage, 'text-primary')}>
                  By clicking 'Submit', the end date of your booking will be changed to{' '}
                  {formattedEndDate}. You will not be charged for any time after this date.
                </p>
              )}
            </>
          ) : null}
          {updateBookingEndDateError ? (
            <p className="text-error">Failed to update booking schedule. Please try again.</p>
          ) : null}
          {endDateCharged ? (
            <p className="text-error text-center text-xs">
              *Please Note: You cannot select a future date because your current end date has
              already been charged.
            </p>
          ) : null}
          {hasPendingEndDatesRequest && !selectedEndDate ? (
            <p className={classNames(css.dropAnimation, 'text-primary')}>
              You already have a pending request to change your booking end date to{' '}
              {moment(requestedEndDate).format('MMMM Do')}. By clicking 'Submit', you will cancel
              that request and create a new one.
            </p>
          ) : null}
          {hasPendingRequest ? (
            <p className="text-error text-center">
              You cannot change your end date because you have a pending request to modify your
              booking schedule. Please allow the caregiver to accept or decline that request before
              changing your end date.
            </p>
          ) : null}
          {showInvalidError ? (
            <p className="text-error text-center">Please select a date.</p>
          ) : null}
          <div className={css.modalButtonContainer}>
            {updateBookingEndDateSuccess ? (
              <Button
                onClick={onClose}
                className={classNames(css.dropAnimation, css.modalButton)}
                type="button"
              >
                Close
              </Button>
            ) : (
              <Button
                onClick={() => onGoBack(MODIFY_SCHEDULE_ACTIONS)}
                className={css.modalButton}
                type="button"
              >
                Back
              </Button>
            )}
            <PrimaryButton
              inProgress={submitInProgress}
              className={css.modalButton}
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

export default ChangeEndDateForm;
