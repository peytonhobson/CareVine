import React, { useState } from 'react';

import { Calendar } from 'react-calendar';
import { timestampToDate } from '../../util/dates';

import css from './FieldDatePicker.module.css';

const isDayHighlighted = (selectedSessions, date) => {
  const day = date.setHours(0, 0, 0, 0);

  let isHighlighted = [];
  selectedSessions.forEach(entry => {
    const startDay = timestampToDate(entry.start).setHours(0, 0, 0, 0);
    const endDay = timestampToDate(entry.end).setHours(0, 0, 0, 0);
    if (startDay <= day && endDay >= day) {
      isHighlighted.push(entry);
      return;
    }
  });

  return isHighlighted.length > 0 ? isHighlighted : false;
};

const formatDay = (locale, date, selectedSessions, onClick) => {
  const day = date.getDate();
  const highlightedselectedSessions = selectedSessions && isDayHighlighted(selectedSessions, date);

  if (highlightedselectedSessions) {
    return (
      <span className={css.highlighted} onClick={onClick} style={{ cursor: onClick && 'pointer' }}>
        {day}
      </span>
    );
  } else {
    return (
      <span className={css.blocked} onClick={onClick} style={{ cursor: onClick && 'pointer' }}>
        {day}
      </span>
    );
  }
};

export const ViewCalendar = props => {
  const { onClick } = props;

  return (
    <div className={css.root}>
      <Calendar
        className={css.root}
        formatDay={(locale, date) => formatDay(locale, date, planDays, onClick)}
        value={new Date()}
      />
    </div>
  );
};

export default ViewCalendar;
