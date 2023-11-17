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
import { calculateTimeBetween } from '../../../util/dates';
import { ISO_OFFSET_FORMAT } from '../../../util/constants';
import { useCheckMobileScreen } from '../../../util/hooks';

const FULL_WEEKDAY_MAP = {
  sun: 'Sunday',
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
};

const formatLineItems = (dateTimes, bookingDates, bookingRate) =>
  Object.keys(dateTimes).map(key => {
    const startTime = dateTimes[key].startTime;
    const endTime = dateTimes[key].endTime;

    const date = moment(bookingDates.find(date => moment(date).format('MM/DD') === key)).format(
      ISO_OFFSET_FORMAT
    );

    return {
      startTime,
      endTime,
      date,
      amount: calculateTimeBetween(startTime, endTime) * bookingRate,
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

  const isMobile = useCheckMobileScreen();

  const currentBooking = {
    attributes: {
      metadata: {
        paymentMethodType: selectedPaymentMethod,
        lineItems: values.dateTimes
          ? formatLineItems(values.dateTimes, values.bookingDates, values.bookingRate)
          : null,
        bookingRate: values.bookingRate,
        bookingSchedule: weekdays,
        startDate: values.startDate?.date,
        endDate: values.endDate?.date,
        exceptions: values.exceptions,
      },
    },
  };
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
            label={isMobile ? null : 'Message'}
            placeholder={`Hello ${authorDisplayName}! I'm looking forward to…`}
            className={css.message}
          />
        </div>
        <div>
          {listingNotFoundErrorMessage}
          {initiateOrderErrorMessage}
          <p className={css.paymentInfo}>
            You will not be charged immediately upon booking. Charges apply only after the caregiver
            has accepted your request and 48 hours before the booking date.
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
          formValues={values}
          form={form}
          listing={currentListing}
          onManageDisableScrolling={onManageDisableScrolling}
          booking={currentBooking}
        />
      ) : (
        <RecurringBookingSummaryCard
          authorDisplayName={authorDisplayName}
          currentAuthor={currentAuthor}
          formValues={values}
          form={form}
          listing={currentListing}
          onManageDisableScrolling={onManageDisableScrolling}
          selectedPaymentMethod={selectedPaymentMethod}
          subHeading="First Week Booking"
          startOfWeek={values.startDate?.date}
          booking={currentBooking}
        />
      )}
    </div>
  );
};

export default SectionRequest;
