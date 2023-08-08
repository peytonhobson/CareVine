import React from 'react';

import {
  FieldTextInput,
  Button,
  PrimaryButton,
  Modal,
  SingleBookingSummaryCard,
  RecurringBookingSummaryCard,
} from '../../../components';
import { pick } from 'lodash';
import { WEEKDAYS, WEEKDAY_MAP } from '../../../util/constants';
import moment from 'moment';
import WeeklyBillingDetails from '../../../components/WeeklyBillingDetails/WeeklyBillingDetails';

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

const getEndOfFirstWeek = (startDate, weekdays) => {
  if (!startDate) return null;

  const start = moment(startDate);

  const lastDay = Object.keys(weekdays).reduce((acc, curr) => {
    const day = WEEKDAY_MAP[curr];

    const date = start.weekday(day);

    if (date.isAfter(acc)) {
      return date;
    }
    return acc;
  }, start);

  return lastDay;
};

const SectionRequest = props => {
  const {
    authorDisplayName,
    currentAuthor,
    currentListing,
    values,
    bookingRate,
    onManageDisableScrolling,
    selectedPaymentMethodType,
    initiateOrderErrorMessage,
    listingNotFoundErrorMessage,
    initiateOrderInProgress,
    transaction,
    form,
  } = props;

  const weekdays = pick(values, WEEKDAYS);
  const weekdayKeys = Object.keys(weekdays);

  const endOfFirstWeek = getEndOfFirstWeek(values.startDate?.date, weekdays);
  const { bookedDays, bookedDates } = currentListing.attributes.metadata;

  return (
    <div className={css.requestContentContainer}>
      <div
        className={css.submissionContainer}
        style={{ marginTop: values.scheduleType === 'recurring' && '1rem' }}
      >
        {values.scheduleType === 'recurring' ? (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>
              Booking Summary &nbsp;
              <span className={css.startEndDates}>
                ({moment(values.startDate?.date).format('dddd, MMM DD')} -{' '}
                {values.endDate?.date
                  ? `${moment(values.endDate?.date).format('dddd, MMM DD')}`
                  : 'No End Date'}
                )
              </span>
            </h2>
            {weekdayKeys.length > 0 && (
              <>
                <ul className={css.summaryDays}>
                  {weekdayKeys.map((key, i) => {
                    const day = FULL_WEEKDAY_MAP[key];
                    return (
                      <li key={key} className={css.tinyNoMargin}>
                        {day} ({weekdays[key][0].startTime} - {weekdays[key][0].endTime})
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
          selectedPaymentMethod={selectedPaymentMethodType}
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
          selectedPaymentMethod={selectedPaymentMethodType}
          subHeading="First Week Booking"
          weekdays={weekdays}
          startDate={values.startDate?.date}
          endDate={endOfFirstWeek}
          exceptions={values.exceptions}
          bookedDays={bookedDays}
          bookedDates={bookedDates}
        />
      )}
    </div>
  );
};

export default SectionRequest;
