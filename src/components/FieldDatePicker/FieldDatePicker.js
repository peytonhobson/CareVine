import React from 'react';

import { Calendar } from 'react-calendar';
import { Field } from 'react-final-form';
import classNames from 'classnames';
import moment from 'moment';
import { WEEKDAY_MAP, WEEKDAYS } from '../../util/constants';

import css from './FieldDatePicker.module.css';
import { InlineTextButton } from '../Button/Button';

const isDayHighlighted = (selectedDays, date) =>
  selectedDays.map(d => d.getTime()).includes(date.getTime());

const isDayDisabled = (
  bookedDates,
  bookedDays,
  selectedDays,
  date,
  bufferDays,
  currentBookedDays
) => {
  const beforeBuffer =
    date.getTime() <
    moment()
      .add(bufferDays ?? 1, 'days')
      .startOf('day')
      .toDate()
      .getTime();

  let isCurrentBookedDay = false;
  if (currentBookedDays) {
    const afterStart = currentBookedDays.startDate <= date;
    const beforeEnd = !currentBookedDays.endDate || date <= currentBookedDays.endDate;
    const isSelectedWeekday = currentBookedDays.days.includes(WEEKDAYS[date.getDay()]);

    isCurrentBookedDay = !afterStart || !beforeEnd || !isSelectedWeekday;
  }

  const dateBooked = bookedDates.some(
    d => moment(d).format('YYYY-MM-DD') === moment(date).format('YYYY-MM-DD')
  );

  const dayBooked = bookedDays.some(d => {
    const day = date.getDay();

    return (
      d.days.some(dd => WEEKDAY_MAP[dd] === day) &&
      new Date(d.startDate) <= date &&
      (!d.endDate || date <= new Date(d.endDate))
    );
  });

  if (selectedDays.length == 0) {
    return dateBooked || beforeBuffer || dayBooked || isCurrentBookedDay;
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

  return (
    dateBooked ||
    isBeforeFirstSelectedDay ||
    isAfterLastSelectedDay ||
    beforeBuffer ||
    dayBooked ||
    isCurrentBookedDay
  );
};

const formatDay = (
  locale,
  date,
  selectedDays,
  bookedDates,
  bookedDays,
  onClick,
  bufferDays,
  currentBookedDays,
  highlightedClassName
) => {
  const day = date.getDate();
  const isHighlighted = isDayHighlighted(selectedDays, date);
  const isDisabled = isDayDisabled(
    bookedDates,
    bookedDays,
    selectedDays,
    date,
    bufferDays,
    currentBookedDays
  );

  if (isHighlighted) {
    return (
      <div
        className={classNames(css.day, highlightedClassName ?? css.highlighted)}
        onClick={() => onClick(date)}
      >
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
  const {
    bookedDates = [],
    bookedDays = [],
    input,
    children,
    className,
    bufferDays,
    onChange,
    currentBookedDays,
    highlightedClassName,
  } = props;

  const handleSelectDay = date => {
    const isDaySelected = Array.isArray(input.value)
      ? input.value?.find(entry => entry.getTime() === date.getTime())
      : false;

    if (isDaySelected) {
      const newSelectedDays = input.value.filter(entry => entry.getTime() !== date.getTime());

      input.onChange(newSelectedDays);
      if (onChange) {
        onChange(newSelectedDays);
      }
    } else {
      const newSelectedDays = [...input.value, date];

      input.onChange(newSelectedDays);
      if (onChange) {
        onChange(newSelectedDays);
      }
    }
  };

  const handleClearDates = () => {
    input.onChange([]);
    if (onChange) {
      onChange([]);
    }
  };

  const classes = classNames(css.root, className);
  const selectedDays = Array.isArray(input.value) ? input.value : [];
  const initialDate = input.value?.[0] ?? new Date();

  return (
    <div className={classes}>
      {children}
      <Calendar
        formatDay={(locale, date) =>
          formatDay(
            locale,
            date,
            selectedDays,
            bookedDates,
            bookedDays,
            handleSelectDay,
            bufferDays,
            currentBookedDays,
            highlightedClassName
          )
        }
        value={initialDate}
        view="month"
        calendarType="Hebrew"
      />
      <InlineTextButton className={css.clearDatesButton} type="button" onClick={handleClearDates}>
        Clear Dates
      </InlineTextButton>
    </div>
  );
};

const FieldDatePicker = props => {
  return <Field component={FieldDatePickerComponent} {...props} />;
};

export default FieldDatePicker;
