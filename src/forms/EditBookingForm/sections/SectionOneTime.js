import React from 'react';

import { FieldDatePicker } from '../../../components';
import DateTimeSelect from '../DateTimeSelect';
import moment from 'moment';

import css from '../EditBookingForm.module.css';

const SectionOneTime = props => {
  const { bookedDates, values, listing, form } = props;

  const { bookedDays } = listing.attributes.metadata ?? [];

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

  return (
    <div className={css.datesTimesContainer}>
      <div>
        <h2 className={css.pickYourTimes}>Pick your Dates</h2>
        <FieldDatePicker
          className={css.datePicker}
          bookedDates={bookedDates}
          name="bookingDates"
          id="bookingDates"
          bookedDays={bookedDays}
          onChange={handleBookingDatesChange}
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
