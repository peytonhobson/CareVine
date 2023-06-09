import React, { useState } from 'react';

import { Calendar } from 'react-calendar';
import { timestampToDate } from '../../util/dates';
import { Field } from 'react-final-form';
import classNames from 'classnames';
import moment from 'moment';

import css from './FieldDatePicker.module.css';

const isDayHighlighted = (selectedDays, date) => selectedDays.includes(date.getTime());

const isDayDisabled = (monthlyTimeSlots, selectedDays, date) => {
  const month = moment(date).format('YYYY-MM');

  const booked = monthlyTimeSlots[month]?.timeSlots?.find(
    entry => entry.attributes.start.getDate() === date.getDate() && entry.attributes.seats === 0
  );

  if (selectedDays.length == 0) {
    return booked;
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

  const isBeforeFirstSelectedDay = date.getTime() >= twoWeeksAfterFirstSelectedDay.getTime();
  const isAfterLastSelectedDay = date.getTime() <= twoWeeksBeforeLastSelectedDay.getTime();

  return booked || isBeforeFirstSelectedDay || isAfterLastSelectedDay;
};

const formatDay = (locale, date, selectedDays, monthlyTimeSlots, onClick) => {
  const day = date.getDate();
  const isHighlighted = isDayHighlighted(selectedDays, date);
  const isDisabled = isDayDisabled(monthlyTimeSlots, selectedDays, date);

  if (isHighlighted) {
    return (
      <div className={classNames(css.day, css.highlighted)} onClick={() => onClick(date)}>
        <span>{day}</span>
      </div>
    );
  } else if (isDisabled) {
    return <span className={classNames(css.day, css.blocked)}>{day}</span>;
  } else {
    return (
      <span className={css.day} onClick={() => onClick(date)}>
        {day}
      </span>
    );
  }
};

export const FieldDatePickerComponent = props => {
  const { monthlyTimeSlots, input } = props;

  const [selectedDays, setSelectedDays] = useState([]);

  const handleSelectDay = date => {
    const dayTime = date.getTime();
    const isDaySelected = selectedDays.find(entry => entry === dayTime);

    if (isDaySelected) {
      const newSelectedDays = selectedDays.filter(entry => entry !== dayTime);
      setSelectedDays(newSelectedDays);

      input.onChange(selectedDays);
    } else {
      const newSelectedDays = [...selectedDays, dayTime];
      setSelectedDays(newSelectedDays);

      input.onChange(newSelectedDays);
    }
  };

  return (
    <div className={css.root}>
      <Calendar
        className={css.root}
        formatDay={(locale, date) =>
          formatDay(locale, date, selectedDays, monthlyTimeSlots, handleSelectDay)
        }
        value={new Date()}
        onChange={v => console.log(v)}
      />
    </div>
  );
};

const FieldDatePicker = props => {
  return <Field component={FieldDatePickerComponent} {...props} />;
};

export default FieldDatePicker;
