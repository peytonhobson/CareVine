import React from 'react';

import { Calendar } from 'react-calendar';
import { Field } from 'react-final-form';
import classNames from 'classnames';
import moment from 'moment';
import { WEEKDAY_MAP, WEEKDAYS } from '../../util/constants';

import css from './FieldDatePicker.module.css';
import { InlineTextButton } from '../Button/Button';
import { checkIsBlockedDay, checkIsDateWithinBookingWindow } from '../../util/bookings';

const isDayHighlighted = (selectedDays, date) =>
  selectedDays.map(d => d.getTime()).includes(date.getTime());

const isDayDisabled = ({ selectedDays, date, currentBookedDays }) => {
  const inPastOrToday = moment(date).isSameOrBefore(moment(), 'day');

  let isCurrentBookedDay = false;
  if (currentBookedDays) {
    const { startDate, endDate } = currentBookedDays;
    const isWithinBookingWindow = checkIsDateWithinBookingWindow({ startDate, endDate, date });
    const isSelectedWeekday = currentBookedDays.days.includes(WEEKDAYS[date.getDay()]);

    isCurrentBookedDay = !isWithinBookingWindow || !isSelectedWeekday;
  }

  if (selectedDays.length == 0) {
    return inPastOrToday || isCurrentBookedDay;
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

  return inPastOrToday || isBeforeFirstSelectedDay || isAfterLastSelectedDay || isCurrentBookedDay;
};

const formatDay = ({
  date,
  selectedDays,
  bookedDates,
  bookedDays,
  onClick,
  currentBookedDays,
  highlightedClassName,
}) => {
  const day = date.getDate();
  const isHighlighted = isDayHighlighted(selectedDays, date);
  const isDisabled = isDayDisabled({
    selectedDays,
    date,
    currentBookedDays,
  });
  const isUnavailable = checkIsBlockedDay({ bookedDays, date, bookedDates });

  if (isDisabled || isUnavailable) {
    return (
      <span className={classNames(css.day, css.blocked, isUnavailable && css.unavailable)}>
        {day}
      </span>
    );
  } else if (isHighlighted) {
    return (
      <div
        className={classNames(css.day, highlightedClassName ?? css.highlighted)}
        onClick={() => onClick(date)}
      >
        <span>{day}</span>
      </div>
    );
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
        formatDay={(_, date) =>
          formatDay({
            date,
            selectedDays,
            bookedDates,
            bookedDays,
            onClick: handleSelectDay,
            currentBookedDays,
            highlightedClassName,
          })
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
