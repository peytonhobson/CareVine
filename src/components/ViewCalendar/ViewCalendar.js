import React, { useState } from 'react';

import { Calendar } from 'react-calendar';
import { InfoTooltip } from '..';
import { timestampToDate } from '../../util/dates';
import { timeOrderMap } from '../../util/constants';

import css from './ViewCalendar.module.css';

const dayMap = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
};

const isOneTimeDateHighlighted = (selectedSessions, date) => {
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

const formatOneTimeDay = (
  locale,
  date,
  selectedSessions,
  startDate,
  endDate,
  availabilityExceptions,
  hoursPerDay,
  onClick
) => {
  const day = date.getDate();
  const highlightedselectedSessions =
    selectedSessions && isOneTimeDateHighlighted(selectedSessions, date);

  if (highlightedselectedSessions) {
    const styles = {
      color: 'var(--matterColor)',
      backgroundColor: 'var(--matterColorLight)',
      paddingBlock: 'auto',
      borderRadius: '0.5rem',
      width: '100%',
      fontSize: '1em',
      fontFamily: "'poppins', Helvetica, Arial, sans-serif",
      '&:hover': {
        backgroundColor: 'var(--matterColorAnti)',
      },
    };
    const startTimes = highlightedselectedSessions?.map(entry =>
      timestampToDate(entry.start).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
    const endTimes = highlightedselectedSessions?.map(entry =>
      timestampToDate(entry.end).toDateString() === date.toDateString()
        ? timestampToDate(entry.end).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '12:00 AM'
    );

    const allDay = startTimes[0] === '12:00 AM' && endTimes[0] === '12:00 AM';
    const title = allDay ? (
      <p>All day</p>
    ) : (
      <div style={{ textAlign: 'center' }}>
        {startTimes.map((startTime, index) => (
          <p key={index}>
            {startTime} - {endTimes[index]}
          </p>
        ))}
      </div>
    );
    return (
      <InfoTooltip
        title={<p>{title}</p>}
        icon={<span className={css.highlighted}>{day}</span>}
        styles={styles}
        onClick={onClick}
      />
    );
  } else {
    return (
      <span className={css.blocked} onClick={onClick} style={{ cursor: onClick && 'pointer' }}>
        {day}
      </span>
    );
  }
};

const isRepeatDateHighlighted = (entries, date, startDate, endDate, availabilityExceptions) => {
  const formattedDate = date.setHours(0, 0, 0, 0);
  const day = date.getDay();

  let isHighlighted = [];
  entries.forEach(entry => {
    const startDay = timestampToDate(startDate).setHours(0, 0, 0, 0);
    const endDay = timestampToDate(endDate).setHours(0, 0, 0, 0);
    const afterStartDay = startDate ? startDay <= formattedDate : true;
    const beforeEndDay = endDate ? endDay >= formattedDate : true;
    const afterToday = formattedDate >= new Date().setHours(0, 0, 0, 0);

    // Check if the day of the week matches the day of the date and if the date is within the start and end date range
    if (entry.dayOfWeek === dayMap[day] && afterStartDay && beforeEndDay && afterToday) {
      isHighlighted.push(entry);
    }
  });

  availabilityExceptions.forEach(exception => {
    const exceptionStartTime = exception?.attributes?.start;
    const exceptionEndTime = exception?.attributes?.end;
    const seats = exception?.attributes?.seats;

    let exceptionStartWithinEntry = false;
    let exceptionEndWithinEntry = false;
    let exceptionOverlapsEntry = false;

    entries.forEach(entry => {
      const entryStartTime = formattedDate + timeOrderMap.get(entry.startTime) * 60 * 60 * 1000;
      const entryEndTime =
        formattedDate +
        (entry.endTime === '12:00am' ? 24 : timeOrderMap.get(entry.endTime)) * 60 * 60 * 1000;
      const da = dayMap[day];
      if (entry.dayOfWeek === dayMap[day]) {
        if (entryStartTime <= exceptionStartTime && entryEndTime >= exceptionStartTime) {
          exceptionStartWithinEntry = true;
        }
        if (entryStartTime <= exceptionEndTime && entryEndTime >= exceptionEndTime) {
          exceptionEndWithinEntry = true;
        }
        if (exceptionStartTime <= entryStartTime && exceptionEndTime >= entryEndTime) {
          exceptionOverlapsEntry = true;
        }
      }
    });

    const exceptionWithinEntry =
      exceptionStartWithinEntry || exceptionEndWithinEntry || exceptionOverlapsEntry;

    // Check if the date is within the start and end date range and if exception is "available", then add to highlighted
    // TODO: Need to check if entry times are within other entries, if so, then don't highlight
    if (
      exceptionStartTime <= formattedDate &&
      exceptionEndTime >= formattedDate &&
      !exceptionWithinEntry &&
      seats === 1
    ) {
      const newEntry = {
        startTime: timestampToDate(exceptionStartTime)
          .toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
          .replace(' ', '')
          .toLocaleLowerCase(),
        endTime: timestampToDate(exceptionEndTime)
          .toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
          .replace(' ', '')
          .toLocaleLowerCase(),
        seats: 1,
        dayOfWeek: dayMap[day],
      };
      isHighlighted.push(newEntry);
    }
  });

  availabilityExceptions.forEach(exception => {
    const exceptionStartTime = exception?.attributes?.start;
    const exceptionEndTime = exception?.attributes?.end;
    const seats = exception?.attributes?.seats;

    // Check if the date is within the start and end date range and if exception is "unavailable", then remove from highlighted
    if (
      exceptionStartTime <= formattedDate &&
      exceptionEndTime >= formattedDate &&
      seats % 2 === 0
    ) {
      isHighlighted = [];
    }
  });

  return isHighlighted.length > 0
    ? isHighlighted.sort((a, b) => timeOrderMap.get(a.startTime) - timeOrderMap.get(b.startTime))
    : false;
};

const formatRepeatDay = (
  locale,
  date,
  entries,
  startDate,
  endDate,
  availabilityExceptions,
  hoursPerDay,
  onClick
) => {
  const day = date.getDate();
  const highlightedEntries =
    entries && isRepeatDateHighlighted(entries, date, startDate, endDate, availabilityExceptions);

  if (highlightedEntries) {
    const styles = {
      color: 'var(--matterColor)',
      backgroundColor: 'var(--matterColorLight)',
      paddingBlock: 'auto',
      borderRadius: '0.5rem',
      width: '100%',
      fontSize: '1em',
      fontFamily: "'poppins', Helvetica, Arial, sans-serif",
      '&:hover': {
        backgroundColor: 'var(--matterColorAnti)',
      },
    };
    const startTimes = highlightedEntries.map(entry => entry.startTime);
    const endTimes = highlightedEntries.map(entry => entry.endTime);

    const allDay = startTimes[0] === '12:00 AM' && endTimes[0] === '12:00 AM';
    const title = allDay ? (
      <p>All day</p>
    ) : (
      <div style={{ textAlign: 'center' }}>
        {startTimes.map((startTime, index) => (
          <p key={index}>
            {startTime} - {endTimes[index]}
          </p>
        ))}
      </div>
    );
    return (
      <InfoTooltip
        title={<p>{title}</p>}
        icon={<span className={css.highlighted}>{day}</span>}
        styles={styles}
        onClick={onClick}
      />
    );
  } else {
    return (
      <span className={css.blocked} onClick={onClick} style={{ cursor: onClick && 'pointer' }}>
        {day}
      </span>
    );
  }
};

const is24HourDateHighlighted = (
  availableDays,
  date,
  startDate,
  endDate,
  availabilityExceptions
) => {
  const formattedDate = date.setHours(0, 0, 0, 0);
  const day = date.getDay();

  let isHighlighted = false;
  availableDays.forEach(d => {
    const startDay = timestampToDate(startDate).setHours(0, 0, 0, 0);
    const endDay = timestampToDate(endDate).setHours(0, 0, 0, 0);
    const afterStartDay = startDate ? startDay <= formattedDate : true;
    const beforeEndDay = endDate ? endDay >= formattedDate : true;
    const afterToday = formattedDate >= new Date().setHours(0, 0, 0, 0);
    if (d === dayMap[day] && afterStartDay && beforeEndDay && afterToday) {
      isHighlighted = true;
    }
  });

  availabilityExceptions?.forEach(exception => {
    const startTime = timestampToDate(exception?.attributes?.start).setHours(0, 0, 0, 0);
    const endTime = timestampToDate(exception?.attributes?.end).setHours(0, 0, 0, 0);
    const seats = exception?.attributes?.seats;
    if (startTime <= formattedDate && endTime >= formattedDate && seats % 2 === 0) {
      isHighlighted = false;
    }
    if (startTime <= formattedDate && endTime >= formattedDate && seats % 2 !== 0) {
      isHighlighted = true;
    }
  });

  return isHighlighted;
};

const format24HourDay = (
  locale,
  date,
  availableDays,
  startDate,
  endDate,
  availabilityExceptions,
  hoursPerDay,
  onClick
) => {
  const day = date.getDate();
  const highlighted =
    availableDays &&
    is24HourDateHighlighted(availableDays, date, startDate, endDate, availabilityExceptions);

  if (highlighted) {
    const styles = {
      color: 'var(--matterColor)',
      backgroundColor: 'var(--matterColorLight)',
      paddingBlock: 'auto',
      borderRadius: '0.5rem',
      width: '100%',
      fontSize: '1em',
      fontFamily: "'poppins', Helvetica, Arial, sans-serif",
      '&:hover': {
        backgroundColor: 'var(--matterColorAnti)',
        cursor: 'pointer',
      },
    };

    const title = <p>{hoursPerDay} hours</p>;

    return (
      <InfoTooltip
        title={<p>{title}</p>}
        icon={<span className={css.highlighted}>{day}</span>}
        styles={styles}
        onClick={onClick}
      />
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
  const {
    selectedSessions,
    entries,
    availableDays,
    hoursPerDay,
    startDate,
    endDate,
    availabilityExceptions,
    planType,
    onClick,
  } = props;

  const planDays = selectedSessions || entries || availableDays;

  let formatDay = null;
  if (planType === 'oneTime') {
    formatDay = formatOneTimeDay;
  } else if (planType === 'repeat') {
    formatDay = formatRepeatDay;
  } else {
    formatDay = format24HourDay;
  }

  return (
    <div className={css.root}>
      <Calendar
        className={css.root}
        formatDay={(locale, date) =>
          formatDay(
            locale,
            date,
            planDays,
            startDate,
            endDate,
            availabilityExceptions,
            hoursPerDay,
            onClick
          )
        }
        value={new Date()}
      />
    </div>
  );
};

export default ViewCalendar;
