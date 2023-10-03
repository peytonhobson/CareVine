import React, { useMemo } from 'react';

import { FieldDatePicker } from '../../../components';
import DateTimeSelect from '../DateTimeSelect';
import moment from 'moment';

import css from '../EditBookingForm.module.css';
import classNames from 'classnames';

const SectionOneTime = props => {
  const { values, listing, form, className, booking } = props;

  const { bookedDays = [], bookedDates = [] } = listing.attributes.metadata ?? {};

  const { lineItems } = booking?.attributes.metadata || {};
  const bookingDates = lineItems?.map(lineItem => lineItem.date) || [];

  const filteredBookedDates = useMemo(() => {
    if (!booking) return bookedDates;

    return bookedDates.filter(date => !bookingDates.some(b => moment(b).isSame(date, 'day')));
  }, [bookingDates, bookedDates]);

  const handleBookingDatesChange = bookingDates => {
    const dateTimes = values.dateTimes ?? {};
    const newDateTimes = bookingDates.reduce((acc, curr) => {
      const formattedDate = moment(curr).format('MM/DD');

      if (!dateTimes[formattedDate]) {
        return { ...acc, [formattedDate]: {} };
      }

      return {
        ...acc,
        [formattedDate]: dateTimes[formattedDate],
      };
    }, {});

    form.change('dateTimes', newDateTimes);
  };

  const classes = classNames(css.datesTimesContainer, className);

  return (
    <div className={classes}>
      <div>
        <h2 className={css.pickYourTimes}>Pick your Dates</h2>
        <FieldDatePicker
          className={css.datePicker}
          bookedDates={filteredBookedDates}
          name="bookingDates"
          id="bookingDates"
          bookedDays={bookedDays}
          onChange={handleBookingDatesChange}
          bufferDays={booking ? 2 : 0}
        >
          <p className={css.bookingTimeText}>
            Caregivers can only be booked within a two-week period
          </p>
        </FieldDatePicker>
      </div>
      <div>
        <h2 className={css.pickYourTimes}>Pick your Times</h2>
        <div className={css.datesContainer}>
          {values.bookingDates?.map(date => {
            const formattedDate = moment(date).format('MM/DD');

            return <DateTimeSelect key={formattedDate} date={formattedDate} values={values} />;
          })}
        </div>
      </div>
    </div>
  );
};

export default SectionOneTime;
