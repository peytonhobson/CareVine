import React, { useMemo } from 'react';

import { FieldDatePicker, Button } from '../../../components';
import DateTimeSelect from '../DateTimeSelect';
import moment from 'moment';
import { checkIsBlockedDay } from '../../../util/bookings';
import classNames from 'classnames';

import css from '../EditBookingForm.module.css';

const isDayDisabled = ({ bookedDays, bookedDates }) => ({ date, selectedDays }) => {
  const inPastOrToday = moment().isSameOrAfter(date, 'day');
  const isBlocked = checkIsBlockedDay({ bookedDays, bookedDates, date });

  if (selectedDays.length === 0) {
    return inPastOrToday || isBlocked;
  }

  const sortedSelectedDays = selectedDays.sort((a, b) => a - b);

  const firstSelectedDay = sortedSelectedDays[0];
  const lastSelectedDay = sortedSelectedDays[sortedSelectedDays.length - 1];

  const twoWeeksAfterFirstSelectedDay = moment(firstSelectedDay)
    .add(2, 'weeks')
    .toDate();

  const twoWeeksBeforeLastSelectedDay = moment(lastSelectedDay)
    .subtract(2, 'weeks')
    .toDate();

  const isBeforeFirstSelectedDay = moment(date).isSameOrAfter(twoWeeksAfterFirstSelectedDay);
  const isAfterLastSelectedDay = moment(date).isSameOrBefore(twoWeeksBeforeLastSelectedDay);

  return inPastOrToday || isBeforeFirstSelectedDay || isAfterLastSelectedDay || isBlocked;
};

const SectionOneTime = props => {
  const {
    values,
    listing,
    form,
    className,
    booking,
    hideLegend,
    goToPaymentError,
    onGoToPayment,
    hideNextButton,
  } = props;

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
          onChange={handleBookingDatesChange}
          isDayDisabled={isDayDisabled({
            bookedDays,
            bookedDates,
          })}
        >
          <p className={css.bookingTimeText}>
            Caregivers can only be booked within a two-week period
          </p>
        </FieldDatePicker>
      </div>
      <div className="mt-8 md:mt-0">
        <h2 className={css.pickYourTimes}>Pick your Times</h2>
        <div className={css.datesContainer}>
          {values.bookingDates?.map(date => {
            const formattedDate = moment(date).format('MM/DD');

            return <DateTimeSelect key={formattedDate} date={formattedDate} values={values} />;
          })}
        </div>
        {values.bookingDates?.length && !hideNextButton ? (
          <div className={css.nextButton}>
            {goToPaymentError ? <p className={css.error}>{goToPaymentError}</p> : null}

            <Button onClick={onGoToPayment} type="button">
              Next: Payment
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SectionOneTime;
