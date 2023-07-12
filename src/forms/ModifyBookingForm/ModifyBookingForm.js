import React, { useEffect, useState } from 'react';
import { compose } from 'redux';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import { intlShape, injectIntl, FormattedMessage } from '../../util/reactIntl';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';
import {
  Form,
  Button,
  FieldSelect,
  Modal,
  FieldDatePicker,
  FieldTextInput,
  NamedLink,
  FieldRangeSlider,
} from '../../components';
import { convertTimeFrom12to24 } from '../../util/data';

import css from './ModifyBookingForm.module.css';

const checkValidBookingTimes = (bookingTimes, bookingDates) => {
  if (!bookingTimes || !bookingDates || bookingDates.length === 0) return false;

  const sameLength = Object.keys(bookingTimes).length === bookingDates.length;
  const hasStartAndEndTimes = Object.keys(bookingTimes).every(
    bookingTime => bookingTimes[bookingTime].startTime && bookingTimes[bookingTime].endTime
  );

  return sameLength && hasStartAndEndTimes;
};

const ModifyBookingFormComponent = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={formRenderProps => {
      const {
        className,
        disabled,
        ready,
        handleSubmit,
        intl,
        invalid,
        pristine,
        updated,
        values,
        form,
        bookingDates,
        authorDisplayName,
        inProgress,
        currentListing,
      } = formRenderProps;

      const [monthYearBookingDates, setMonthYearBookingDates] = useState(
        bookingDates.map(
          bookingDate =>
            `${new Date(bookingDate).getMonth() + 1}/${new Date(bookingDate).getDate()}`
        )
      );

      const handleChangeBookingDates = bookingDates => {
        const newMonthYearBookingDates = bookingDates.map(
          bookingDate =>
            `${new Date(bookingDate).getMonth() + 1}/${new Date(bookingDate).getDate()}`
        );

        const newDateTimes = values.dateTimes
          ? Object.keys(values.dateTimes)?.reduce((acc, monthYear) => {
              if (newMonthYearBookingDates.includes(monthYear)) {
                acc[monthYear] = values.dateTimes[monthYear];
              }
              return acc;
            }, {})
          : {};

        form.change('dateTimes', newDateTimes);
        setMonthYearBookingDates(newMonthYearBookingDates);
      };

      const bookedDates = currentListing.attributes.metadata.bookedDates?.filter(
        d => !bookingDates.find(bookingDate => bookingDate.toISOString() === d)
      );
      const minPrice = currentListing.attributes.publicData.minPrice;

      const classes = classNames(css.root, className);
      const submitInProgress = null;
      const submitReady = (updated && pristine) || ready;
      const submitDisabled =
        invalid || disabled || !checkValidBookingTimes(values.dateTimes, values.bookingDates);

      const onSubmit = e => {
        e.preventDefault();
        if (submitDisabled) {
          return;
        }
        handleSubmit(e);
      };

      return (
        <Form className={classes} onSubmit={onSubmit}>
          <h2 className={css.fieldLabel}>Choose your dates:</h2>
          <FieldDatePicker
            className={css.datePicker}
            bookedDates={bookedDates}
            name="bookingDates"
            id="bookingDates"
            onChange={handleChangeBookingDates}
          >
            <p className={css.bookingTimeText}>Caregivers can be booked for 1-14 days</p>
          </FieldDatePicker>
          <h2 className={css.fieldLabel}>Choose your times:</h2>
          <div className={css.datesContainer}>
            {monthYearBookingDates.map(monthYearBookingDate => {
              const startTimeValue = values.dateTimes?.[monthYearBookingDate]?.startTime;
              const endTimeValue = values.dateTimes?.[monthYearBookingDate]?.endTime;
              const integerStartTimeVal = startTimeValue
                ? Number.parseInt(convertTimeFrom12to24(startTimeValue).split(':')[0])
                : null;
              const integerEndTimeVal = endTimeValue
                ? Number.parseInt(convertTimeFrom12to24(endTimeValue).split(':')[0])
                : 0;

              return (
                <div className={css.dateContainer} key={monthYearBookingDate}>
                  <h3 className={css.date}>{monthYearBookingDate}</h3>
                  <div className={css.formRow}>
                    <div className={css.field}>
                      <FieldSelect
                        id={`dateTimes.${monthYearBookingDate}.startTime`}
                        name={`dateTimes.${monthYearBookingDate}.startTime`}
                        selectClassName={css.timeSelect}
                        initialValueSelected={monthYearBookingDate.startTime}
                      >
                        <option disabled>8:00am</option>
                        {Array.from(
                          { length: integerEndTimeVal ? integerEndTimeVal : 24 },
                          (v, i) => i
                        ).map(i => {
                          const hour = i % 12 || 12;
                          const ampm = i < 12 ? 'am' : 'pm';
                          const time = `${hour}:00${ampm}`;
                          return (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          );
                        })}
                      </FieldSelect>
                    </div>
                    <span className={css.dashBetweenTimes}>-</span>
                    <div className={css.field}>
                      <FieldSelect
                        id={`dateTimes.${monthYearBookingDate}.endTime`}
                        name={`dateTimes.${monthYearBookingDate}.endTime`}
                        selectClassName={css.timeSelect}
                      >
                        <option disabled>5:00pm</option>
                        {Array.from({ length: 24 - integerStartTimeVal }, (v, i) => i).map(i => {
                          const hour = (i + integerStartTimeVal + 1) % 12 || 12;
                          const ampm =
                            i + integerStartTimeVal + 1 < 12 || i + integerStartTimeVal === 23
                              ? 'am'
                              : 'pm';
                          const time = `${hour}:00${ampm}`;
                          return (
                            <option key={i + 25} value={time}>
                              {time}
                            </option>
                          );
                        })}
                      </FieldSelect>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <h2 className={css.fieldLabel}>Choose an hourly rate:</h2>
          <h1 className={css.fieldLabel} style={{ marginBottom: 0 }}>
            ${values.bookingRate}
          </h1>
          <div className={css.availableRatesContainer}>
            <p>${minPrice / 100}</p>
            <p>$50</p>
          </div>
          <FieldRangeSlider
            id="bookingRate"
            name="bookingRate"
            className={css.priceRange}
            trackClass={css.track}
            min={minPrice / 100}
            max={50}
            step={1}
            handles={values.bookingRate}
            noHandleLabels
          />
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
            <p className={css.paymentInfo}>
              The caregiver has 72 hours or until the changes start to accept or decline your
              request. If they do not respond within 72 hours, the booking will remain as is.
            </p>
            <Button
              className={css.submitButton}
              disabled={submitDisabled}
              inProgress={inProgress}
              type="submit"
            >
              View Changes
            </Button>
          </div>
        </Form>
      );
    }}
  />
);

export default compose(injectIntl)(ModifyBookingFormComponent);
