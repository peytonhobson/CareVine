import React from 'react';

import { InfoTooltip } from '..';
import { useCheckMobileScreen } from '../../util/hooks';

import css from './WeekCalendar.module.css';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const WeekCalendar = props => {
  const { mappedTimesToDay } = props;

  const isMobile = useCheckMobileScreen();

  const renderDays = () => {
    const days = weekdays.map(day => <div className={css.day}>{day}</div>);
    return <div className={css.days}>{days}</div>;
  };

  const renderCells = () => {
    const days = weekdays.map(day => {
      return isMobile && mappedTimesToDay[day.toLocaleLowerCase()]?.length > 0 ? (
        <InfoTooltip
          title={mappedTimesToDay[day.toLocaleLowerCase()].map(d => (
            <span className={css.time}>
              {d.startTime}-{d.endTime}
            </span>
          ))}
          icon={
            <div className={css.cell}>
              <div className={css.entry} />
            </div>
          }
          styles={{
            display: 'block',
            width: 'calc(14.285%)',
            padding: 0,
            border: 'none',
            borderRadius: '0',
          }}
        />
      ) : (
        <div className={css.cell}>
          <div className={mappedTimesToDay[day.toLocaleLowerCase()]?.length > 0 ? css.entry : null}>
            {mappedTimesToDay[day.toLocaleLowerCase()].map(d => (
              <span className={css.time}>
                {d.startTime}-{d.endTime}
              </span>
            ))}
          </div>
        </div>
      );
    });

    return <div className={css.cells}>{days}</div>;
  };

  const hasEntries = Object.values(mappedTimesToDay).some(day => day.length > 0);

  return (
    <>
      {isMobile && hasEntries && (
        <p className={css.mobileClickText}>Click each blue cell for times</p>
      )}
      <div className={css.calendar}>
        {renderDays()}
        {renderCells()}
      </div>
    </>
  );
};

export default WeekCalendar;
