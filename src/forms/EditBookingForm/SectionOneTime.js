import React from 'react';

import { FieldDatePicker, Button } from '../../components';
import DateTimeSelect from './DateTimeSelect';

import css from './EditBookingForm.module.css';

const SectionOneTime = props => {
  const { bookedDates, onSaveBookingDates, values, monthYearBookingDates } = props;

  return (
    <div className={css.datesTimesContainer}>
      <div>
        <h2 className={css.pickYourTimes}>Pick your Dates</h2>
        <FieldDatePicker
          className={css.datePicker}
          bookedDates={bookedDates}
          name="bookingDates"
          id="bookingDates"
          onChange={onSaveBookingDates}
        >
          <p className={css.bookingTimeText}>
            Caregivers can only be booked within a two-week period
          </p>
        </FieldDatePicker>
      </div>
      <div>
        <h2 className={css.pickYourTimes}>Pick your Times</h2>
        <div className={css.datesContainer}>
          {monthYearBookingDates.map(monthYearBookingDate => (
            <DateTimeSelect
              key={monthYearBookingDate}
              monthYearBookingDate={monthYearBookingDate}
              values={values}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SectionOneTime;
