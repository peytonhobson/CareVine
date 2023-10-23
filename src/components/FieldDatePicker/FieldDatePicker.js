import React from 'react';

import { Calendar } from 'react-calendar';
import { Field } from 'react-final-form';
import classNames from 'classnames';
import moment from 'moment';
import { WEEKDAY_MAP, WEEKDAYS } from '../../util/constants';

import css from './FieldDatePicker.module.css';
import { InlineTextButton } from '../Button/Button';

const isDayHighlighted = (selectedDays, date) =>
  selectedDays.some(d => moment(d).isSame(date, 'day'));

const formatDay = ({ date, selectedDays, onClick, highlightedClassName, isDayDisabled }) => {
  const day = date.getDate();
  const isHighlighted = isDayHighlighted(selectedDays, date);
  const isDisabled = isDayDisabled ? isDayDisabled({ date, selectedDays }) : false;

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
  const { input, children, className, onChange, highlightedClassName, isDayDisabled } = props;

  const handleSelectDay = date => {
    const isDaySelected = Array.isArray(input.value)
      ? input.value?.find(entry => moment(entry).isSame(date, 'day'))
      : false;

    if (isDaySelected) {
      const newSelectedDays = input.value.filter(entry => !moment(entry).isSame(date, 'day'));

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
            onClick: handleSelectDay,
            highlightedClassName,
            isDayDisabled,
          })
        }
        value={initialDate}
        view="month"
        calendarType="Hebrew"
        showNeighboringMonth={false}
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
