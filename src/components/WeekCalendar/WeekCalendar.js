import React from 'react';

import { useState } from 'react';
import classNames from 'classnames';

import css from './WeekCalendar.module.css';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const WeekCalendar = props => {
  const { entries, mappedTimesToDay } = props;

  const renderDays = () => {
    const days = weekdays.map(day => <div className={css.day}>{day}</div>);
    return <div className={css.days}>{days}</div>;
  };

  const renderCells = () => {
    const days = weekdays.map(day => (
      <div className={css.cell}>
        <div className={mappedTimesToDay[day.toLocaleLowerCase()]?.length > 0 ? css.entry : null}>
          {mappedTimesToDay[day.toLocaleLowerCase()].map(d => (
            <span className={css.time}>
              {d.startTime} - {d.endTime}
            </span>
          ))}
        </div>
      </div>
    ));

    return <div className={css.cells}>{days}</div>;
  };

  return (
    <div className={css.calendar}>
      {renderDays()}
      {renderCells()}
    </div>
  );
};

export default WeekCalendar;
