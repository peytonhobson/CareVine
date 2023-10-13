import React from 'react';

import { FieldSelect } from '../../components';
import { convertTimeFrom12to24 } from '../../util/data';
import classNames from 'classnames';

import css from './EditBookingForm.module.css';

const DateTimeSelect = props => {
  const { date, values, disabled } = props;

  const startTimeValue = values.dateTimes?.[date]?.startTime;
  const endTimeValue = values.dateTimes?.[date]?.endTime;
  const integerStartTimeVal = startTimeValue
    ? Number.parseInt(convertTimeFrom12to24(startTimeValue).split(':')[0])
    : null;
  const integerEndTimeVal = endTimeValue
    ? Number.parseInt(convertTimeFrom12to24(endTimeValue).split(':')[0])
    : 0;

  return (
    <div className={classNames(css.dateContainer, 'bg-bright')} key={date}>
      <h3 className={css.date}>
        {date} {disabled ? '(Past)' : ''}
      </h3>
      <div className={css.formRow}>
        <div className={css.field}>
          <label htmlFor={`dateTimes.${date}.startTime`} className={css.timeSelectLabel}>
            Start Time
          </label>
          <FieldSelect
            id={`dateTimes.${date}.startTime`}
            name={`dateTimes.${date}.startTime`}
            selectClassName={css.timeSelect}
            initialValueSelected={date.startTime}
            disabled={disabled}
          >
            <option disabled value="">
              8:00am
            </option>
            {Array.from({ length: integerEndTimeVal ? integerEndTimeVal : 24 }, (v, i) => i).map(
              i => {
                const hour = i % 12 || 12;
                const ampm = i < 12 ? 'am' : 'pm';
                const time = `${hour}:00${ampm}`;
                return (
                  <option key={time} value={time}>
                    {time}
                  </option>
                );
              }
            )}
          </FieldSelect>
        </div>
        <span className={css.dashBetweenTimes}>-</span>
        <div className={css.field}>
          <label htmlFor={`dateTimes.${date}.startTime`} className={css.timeSelectLabel}>
            End Time
          </label>
          <FieldSelect
            id={`dateTimes.${date}.endTime`}
            name={`dateTimes.${date}.endTime`}
            selectClassName={css.timeSelect}
            disabled={disabled}
          >
            <option disabled value="">
              5:00pm
            </option>
            {Array.from({ length: 24 - integerStartTimeVal }, (v, i) => i).map(i => {
              const hour = (i + integerStartTimeVal + 1) % 12 || 12;
              const ampm =
                i + integerStartTimeVal + 1 < 12 || i + integerStartTimeVal === 23 ? 'am' : 'pm';
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
};

export default DateTimeSelect;
