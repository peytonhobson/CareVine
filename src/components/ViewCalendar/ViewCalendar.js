import React from 'react';

import { Calendar } from 'react-calendar';
import { InfoTooltip } from '..';
import { timestampToDate } from '../../util/dates';

import css from './ViewCalendar.module.css';

const isDateHighlighted = (entries, date) => {
  const day = date.setHours(0, 0, 0, 0);

  let isHighlighted = [];
  entries.forEach(entry => {
    const startDay = timestampToDate(entry.start).setHours(0, 0, 0, 0);
    const endDay = timestampToDate(entry.end).setHours(0, 0, 0, 0);
    if (startDay <= day && endDay >= day) {
      isHighlighted.push(entry);
      return;
    }
  });

  return isHighlighted.length > 0 ? isHighlighted : false;
};

const ViewCalendar = props => {
  const { entries } = props;

  const formatDay = (locale, date) => {
    const day = date.getDate();
    const highlightedEntries = entries && isDateHighlighted(entries, date);

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
      const startTimes = highlightedEntries.map(entry =>
        timestampToDate(entry.start).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
      const endTimes = highlightedEntries.map(entry =>
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
        />
      );
    } else {
      return <span className={css.blocked}>{day}</span>;
    }
  };

  return (
    <div className={css.root}>
      <Calendar
        className={css.root}
        formatDay={(locale, date) => formatDay(locale, date)}
        //   onChange={this.onChange}
        value={new Date()}
      />
    </div>
  );
};

export default ViewCalendar;
