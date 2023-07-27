import React from 'react';

import {
  BookingSummaryCard,
  RecurringBookingSummaryCard,
  FieldTextInput,
  Button,
} from '../../components';
import { pick } from 'lodash';
import { WEEKDAYS } from '../../util/constants';

import css from './EditBookingForm.module.css';

const formatDateTimeValues = dateTimes =>
  Object.keys(dateTimes).map(key => {
    const startTime = dateTimes[key].startTime;
    const endTime = dateTimes[key].endTime;

    return {
      startTime,
      endTime,
      date: key,
    };
  });

const SectionRequest = props => {
  const {
    authorDisplayName,
    currentAuthor,
    currentListing,
    values,
    bookingDates,
    bookingRate,
    onManageDisableScrolling,
    onSetState,
    selectedPaymentMethodType,
    initiateOrderErrorMessage,
    listingNotFoundErrorMessage,
    initiateOrderInProgress,
    transaction,
  } = props;

  return (
    <div className={css.requestContentContainer}>
      <div className={css.submissionContainer}>
        <div className={css.sendAMessage}>
          <h2>Send a Message (Optional)</h2>
          <FieldTextInput
            id="message"
            name="message"
            type="textarea"
            label="Message"
            placeholder={`Hello ${authorDisplayName}! I'm looking forward to…`}
            className={css.message}
          />
        </div>
        <div>
          {listingNotFoundErrorMessage}
          {initiateOrderErrorMessage}
          <p className={css.paymentInfo}>
            You will not be charged until the caregiver accepts the booking
          </p>
          <Button
            className={css.submitButton}
            inProgress={initiateOrderInProgress}
            ready={transaction}
            type="submit"
          >
            Request to Book
          </Button>
        </div>
      </div>
      {values.scheduleType === 'oneTime' ? (
        <BookingSummaryCard
          authorDisplayName={authorDisplayName}
          currentAuthor={currentAuthor}
          selectedBookingTimes={formatDateTimeValues(values.dateTimes)}
          bookingRate={bookingRate}
          bookingDates={bookingDates.map(bookingDate => new Date(bookingDate))}
          listing={currentListing}
          onManageDisableScrolling={onManageDisableScrolling}
          onSetState={onSetState}
          selectedPaymentMethod={selectedPaymentMethodType}
        />
      ) : (
        <RecurringBookingSummaryCard
          authorDisplayName={authorDisplayName}
          currentAuthor={currentAuthor}
          weekdays={pick(values, WEEKDAYS)}
          bookingRate={bookingRate}
          startDate={values.startDate?.date}
          listing={currentListing}
          onManageDisableScrolling={onManageDisableScrolling}
          onSetState={onSetState}
          selectedPaymentMethod={selectedPaymentMethodType}
          endDate={values.endDate?.date}
        />
      )}
    </div>
  );
};

export default SectionRequest;
