import React from 'react';

import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';
import { convertTimeFrom24to12 } from '../../util/data';
import { WEEKDAYS } from '../../util/constants';

import css from './WeekPanel.module.css';

const findEntry = (availabilityPlan, dayOfWeek) =>
  availabilityPlan?.entries?.find(d => d.dayOfWeek === dayOfWeek);

const getEntries = (availabilityPlan, dayOfWeek) =>
  availabilityPlan?.entries?.filter(d => d.dayOfWeek === dayOfWeek);

const Weekday = props => {
  const { availabilityPlan, dayOfWeek, openEditModal, disabled: booked } = props;
  const hasEntry = findEntry(availabilityPlan, dayOfWeek);

  const dayOfWeekClasses = classNames(css.dayOfWeek, !openEditModal && css.viewOnly);

  return (
    <div
      className={classNames(
        css.weekDay,
        { [css.blockedWeekDay]: !hasEntry },
        !openEditModal && css.viewOnly,
        { [css.bookedWeekDay]: booked }
      )}
      onClick={() => openEditModal && !booked && openEditModal(true)}
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
      {booked && <span className={css.booked}> Unavailable</span>}
    </div>
  );
};

const WeekPanel = props => {
  const { className, availabilityPlan, openEditModal, disabledDays } = props;

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
            disabled={disabledDays?.includes(day)}
          />
        );
      })}
    </div>
  );
};

export default WeekPanel;
