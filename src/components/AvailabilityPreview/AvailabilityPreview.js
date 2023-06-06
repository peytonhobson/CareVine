import React from 'react';

import { InfoTooltip } from '..';
import classNames from 'classnames';
import { convertTimeFrom24to12 } from '../../util/data';

import css from './AvailabilityPreview.module.css';

const weekdayAbbreviations = [
  { key: 'sun', label: 'Su' },
  { key: 'mon', label: 'M' },
  { key: 'tue', label: 'T' },
  { key: 'wed', label: 'W' },
  { key: 'thu', label: 'Th' },
  { key: 'fri', label: 'F' },
  { key: 'sat', label: 'Sa' },
];

const weekdayTooltipTitle = entries => {
  const titles = {
    sun: [],
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
  };

  const is24Hour = entries.length > 0 ? entries[0].startTime.length === 5 : false;

  if (is24Hour) {
    entries.forEach(entry => {
      titles[entry.dayOfWeek].push(
        <p>
          {convertTimeFrom24to12(entry.startTime)} - {convertTimeFrom24to12(entry.endTime)}
        </p>
      );
    });
  } else {
    entries.forEach(entry => {
      titles[entry.dayOfWeek].push(
        <p>
          {entry.startTime} - {entry.endTime}
        </p>
      );
    });
  }

  return titles;
};

const AvailabilityPreview = props => {
  const { className, entries, availableDays } = props;

  const weekdayTooltipTitles = entries && weekdayTooltipTitle(entries);

  const daysInSchedule = weekdayAbbreviations.filter(day =>
    entries
      ? entries?.find(entry => entry?.dayOfWeek === day.key || entry === day.key)
      : availableDays?.includes(day.key)
  );

  return (
    <div className={css.schedule}>
      {weekdayAbbreviations.map(day => {
        const dayInSchedule = daysInSchedule.find(dayInSchedule => dayInSchedule.key === day.key);
        const dayClasses = classNames(css.dayBox, dayInSchedule && css.active, className);
        const title = weekdayTooltipTitles ? weekdayTooltipTitles[day.key] : null;
        const styles = {
          fontSize: '1rem',
          fontFamily: 'var(--fontFamily)',
          paddingInline: '0',
        };
        return weekdayTooltipTitles && dayInSchedule && entries ? (
          <InfoTooltip
            key={day.key}
            title={title}
            icon={<div className={dayClasses}>{day.label}</div>}
            styles={styles}
          />
        ) : (
          <div key={day.key} className={dayClasses}>
            {day.label}
          </div>
        );
      })}
    </div>
  );
};

export default AvailabilityPreview;
