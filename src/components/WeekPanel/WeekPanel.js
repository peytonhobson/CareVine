import React from 'react';

import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';
import { convertTimeFrom24to12 } from '../../util/data';

import css from './WeekPanel.module.css';

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const findEntry = (availabilityPlan, dayOfWeek) =>
  availabilityPlan?.entries?.find(d => d.dayOfWeek === dayOfWeek);

const getEntries = (availabilityPlan, dayOfWeek) =>
  availabilityPlan?.entries?.filter(d => d.dayOfWeek === dayOfWeek);

const Weekday = props => {
  const { availabilityPlan, dayOfWeek, openEditModal } = props;
  const hasEntry = findEntry(availabilityPlan, dayOfWeek);

  const dayOfWeekClasses = classNames(css.dayOfWeek, !openEditModal && css.viewOnly);

  return (
    <div
      className={classNames(
        css.weekDay,
        { [css.blockedWeekDay]: !hasEntry },
        !openEditModal && css.viewOnly
      )}
      onClick={() => openEditModal && openEditModal(true)}
      role="button"
    >
      <div className={dayOfWeekClasses}>
        <FormattedMessage id={`Weekday.dayOfWeek.${dayOfWeek}`} />
      </div>
      <div className={css.entries}>
        {availabilityPlan && hasEntry
          ? getEntries(availabilityPlan, dayOfWeek).map(e => {
              return (
                <span
                  className={css.entry}
                  key={`${e.dayOfWeek}${e.startTime}`}
                >{`${convertTimeFrom24to12(e.startTime)} - ${convertTimeFrom24to12(
                  e.endTime
                )}`}</span>
              );
            })
          : null}
      </div>
    </div>
  );
};

const WeekPanel = props => {
  const { className, availabilityPlan, openEditModal } = props;

  const classes = classNames(css.weekPanel, className);

  return (
    <div className={classes}>
      {WEEKDAYS.map(day => {
        return (
          <Weekday
            key={day}
            dayOfWeek={day}
            availabilityPlan={availabilityPlan}
            openEditModal={openEditModal}
          />
        );
      })}
    </div>
  );
};

export default WeekPanel;
