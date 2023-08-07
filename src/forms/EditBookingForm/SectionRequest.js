import React from 'react';

import { BookingSummaryCard, FieldTextInput, Button, PrimaryButton, Modal } from '../../components';
import { pick } from 'lodash';
import { WEEKDAYS, WEEKDAY_MAP } from '../../util/constants';
import moment from 'moment';
import WeeklyBillingDetails from '../../components/WeeklyBillingDetails/WeeklyBillingDetails';

import css from './EditBookingForm.module.css';

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
    bookingDates,
    bookingRate,
    onManageDisableScrolling,
    onSetState,
    selectedPaymentMethodType,
    initiateOrderErrorMessage,
    listingNotFoundErrorMessage,
    initiateOrderInProgress,
    transaction,
    form,
  } = props;

  const [isWeeklyBillingDetailsOpen, setIsWeeklyBillingDetailsOpen] = React.useState(false);

  const weekdays = pick(values, WEEKDAYS);
  const weekdayKeys = Object.keys(weekdays);

  const endOfFirstWeek = getEndOfFirstWeek(values.startDate?.date, weekdays);
  const { bookedDays, bookedDates } = currentListing.attributes.metadata;

  const subHeading =
    Object.keys(weekdays).length > 0 ? (
      <>
        <span className={css.recurringSubheading}>
          First Week Booking
          <PrimaryButton
            className={css.weeklyBillingDetailsButton}
            type="button"
            onClick={() => setIsWeeklyBillingDetailsOpen(true)}
          >
            Weekly Billing Details
          </PrimaryButton>
        </span>
        <p className={css.startEndDates}>
          {moment(values.startDate?.date).format('ddd, MMM DD')} -{' '}
          {moment(endOfFirstWeek).format('ddd, MMM DD')}
        </p>
      </>
    ) : null;

  return (
    <div className={css.requestContentContainer}>
      <div className={css.submissionContainer}>
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
      <BookingSummaryCard
        authorDisplayName={authorDisplayName}
        currentAuthor={currentAuthor}
        selectedBookingTimes={values.dateTimes && formatDateTimeValues(values.dateTimes)}
        bookingRate={bookingRate}
        bookingDates={bookingDates && bookingDates.map(bookingDate => new Date(bookingDate))}
        listing={currentListing}
        onManageDisableScrolling={onManageDisableScrolling}
        onSetState={onSetState}
        selectedPaymentMethod={selectedPaymentMethodType}
        weekdays={weekdays}
        startDate={values.startDate?.date}
        endDate={endOfFirstWeek}
        formValues={values}
        form={form}
        subHeading={subHeading}
        exceptions={values.exceptions}
        bookedDays={bookedDays}
        bookedDates={bookedDates}
      />
      <Modal
        id="WeeklyBillingDetails"
        isOpen={isWeeklyBillingDetailsOpen}
        onClose={() => setIsWeeklyBillingDetailsOpen(false)}
        onManageDisableScrolling={onManageDisableScrolling}
        usePortal
      >
        <WeeklyBillingDetails
          bookedDates={bookedDates}
          bookedDays={bookedDays}
          bookingSchedule={weekdays}
          exceptions={values.exceptions}
          startDate={values.startDate?.date}
          endDate={values.endDate?.date}
        />
      </Modal>
    </div>
  );
};

export default SectionRequest;
