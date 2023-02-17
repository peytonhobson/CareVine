import React from 'react';

import { useState } from 'react';
import classNames from 'classnames';

import css from './WeekCalendar.module.css';

const timeOrderMap = new Map([
  ['12:00am', 0],
  ['1:00am', 1],
  ['2:00am', 2],
  ['3:00am', 3],
  ['4:00am', 4],
  ['5:00am', 5],
  ['6:00am', 6],
  ['7:00am', 7],
  ['8:00am', 8],
  ['9:00am', 9],
  ['10:00am', 10],
  ['11:00am', 11],
  ['12:00pm', 12],
  ['1:00pm', 13],
  ['2:00pm', 14],
  ['3:00pm', 15],
  ['4:00pm', 16],
  ['5:00pm', 17],
  ['6:00pm', 18],
  ['7:00pm', 19],
  ['8:00pm', 20],
  ['9:00pm', 21],
  ['10:00pm', 22],
  ['11:00pm', 23],
]);

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
