import React from 'react';

import {
  FieldTextInput,
  Button,
  SingleBookingSummaryCard,
  RecurringBookingSummaryCard,
} from '../../../components';
import moment from 'moment';
import { mapWeekdays, getFirstWeekEndDate } from '../../../util/bookings';

import css from '../EditBookingForm.module.css';

const FULL_WEEKDAY_MAP = {
  sun: 'Sunday',
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
};

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
    onManageDisableScrolling,
    selectedPaymentMethod,
    initiateOrderErrorMessage,
    listingNotFoundErrorMessage,
    initiateOrderInProgress,
    transaction,
    form,
  } = props;

  const weekdays = mapWeekdays(values);

  const endOfFirstWeek = getFirstWeekEndDate(values.startDate?.date, weekdays, values.exceptions);
  return (
    <div className={css.requestContentContainer}>
      <div
        className={css.submissionContainer}
        style={{ marginTop: values.scheduleType === 'recurring' && '1rem' }}
      >
        {values.scheduleType === 'recurring' ? (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>
              Booking Summary{' '}
              <span className={css.startEndDates}>
                ({moment(values.startDate?.date).format('dddd, MMM DD')} -{' '}
                {values.endDate?.date
                  ? `${moment(values.endDate?.date).format('dddd, MMM DD')}`
                  : 'No End Date'}
                )
              </span>
            </h2>
            {weekdays.length > 0 && (
              <>
                <ul className={css.summaryDays}>
                  {weekdays.map((w, i) => {
                    const day = FULL_WEEKDAY_MAP[w.dayOfWeek];
                    return (
                      <li key={w.dayOfWeek} className={css.tinyNoMargin}>
                        {day} ({w.startTime} - {w.endTime})
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        ) : null}
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
        <SingleBookingSummaryCard
          authorDisplayName={authorDisplayName}
          currentAuthor={currentAuthor}
          bookingTimes={values.dateTimes && formatDateTimeValues(values.dateTimes)}
          bookingRate={values?.bookingRate}
          formValues={values}
          form={form}
          listing={currentListing}
          onManageDisableScrolling={onManageDisableScrolling}
          selectedPaymentMethod={selectedPaymentMethod}
        />
      ) : (
        <RecurringBookingSummaryCard
          authorDisplayName={authorDisplayName}
          currentAuthor={currentAuthor}
          bookingRate={values?.bookingRate}
          formValues={values}
          form={form}
          listing={currentListing}
          onManageDisableScrolling={onManageDisableScrolling}
          selectedPaymentMethod={selectedPaymentMethod}
          subHeading="First Week Booking"
          weekdays={weekdays}
          startDate={values.startDate?.date}
          weekEndDate={endOfFirstWeek}
          bookingEndDate={values.endDate?.date}
          exceptions={values.exceptions}
        />
      )}
    </div>
  );
};

export default SectionRequest;
