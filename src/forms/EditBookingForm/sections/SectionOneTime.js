import React, { useMemo } from 'react';

import { FieldDatePicker } from '../../../components';
import DateTimeSelect from '../DateTimeSelect';
import moment from 'moment';

import css from '../EditBookingForm.module.css';
import classNames from 'classnames';

const modifyBufferDays = 2;

const SectionOneTime = props => {
  const { values, listing, form, className, booking, hideLegend } = props;

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

  const legend = hideLegend ? null : (
    <>
      <p className="text-xs my-1 text-left mt-4 lg:mt-2">
        <span className={classNames(css.day, css.blocked)}>23</span> Dates in gray are not available
      </p>
      <p className="text-xs my-1 text-left">
        <span className={classNames(css.day)}>23</span> Dates in black are available
      </p>
      <p className="text-xs my-1 text-left">
        <span className={classNames(css.day, css.highlighted)}>23</span> Dates in blue are selected
      </p>
    </>
  );

  const classes = classNames(css.datesTimesContainer, className);

  return (
    <div className={classes}>
      <div>
        <h2 className={css.pickYourTimes}>Pick your Dates</h2>
        {legend}
        <FieldDatePicker
          className={css.datePicker}
          bookedDates={filteredBookedDates}
          name="bookingDates"
          id="bookingDates"
          bookedDays={bookedDays}
          onChange={handleBookingDatesChange}
          bufferDays={booking ? modifyBufferDays : 0}
          isModify={booking}
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

            const disabled = booking
              ? moment()
                  .add(modifyBufferDays, 'days')
                  .isSameOrAfter(date, 'day')
              : false;

            return (
              <DateTimeSelect
                key={formattedDate}
                date={formattedDate}
                values={values}
                disabled={disabled}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SectionOneTime;
