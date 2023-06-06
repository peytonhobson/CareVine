import React, { forwardRef } from 'react';
import { findOptionsForSelectFilter } from '../../../util/search';

import { WeekCalendar, ViewCalendar } from '../../';
import { SectionCard } from './';
import { timestampToDate } from '../../../util/dates';
import classNames from 'classnames';

import css from './sections.module.css';

const AVAILABILITY_PLAN_TYPE_ONE_TIME = 'oneTime';
const AVAILABILITY_PLAN_TYPE_REPEAT = 'repeat';
const AVAILABILITY_PLAN_TYPE_24_HOUR = '24hour';

const weekdayMap = [
  { day: 'mon', label: 'Monday' },
  { day: 'tue', label: 'Tuesday' },
  { day: 'wed', label: 'Wednesday' },
  { day: 'thu', label: 'Thursday' },
  { day: 'fr', label: 'Friday' },
  { day: 'sat', label: 'Saturday' },
  { day: 'sun', label: 'Sunday' },
];

const CareScheduleSection = forwardRef((props, ref) => {
  const { careSchedule, filterConfig, isMobile } = props;

  const scheduleTypes = findOptionsForSelectFilter('scheduleType', filterConfig);

  const careScheduleCardTitle = (
    <h1 className={css.title}>
      Care Schedule{' '}
      <div style={{ display: 'inline-block' }}>
        ({scheduleTypes.find(s => s.key === careSchedule?.type)?.label})
      </div>
    </h1>
  );

  let content = null;

  switch (careSchedule?.type) {
    case AVAILABILITY_PLAN_TYPE_ONE_TIME:
      const { selectedSessions } = careSchedule;
      content = (
        <div className={css.container}>
          <ViewCalendar selectedSessions={selectedSessions} planType="oneTime" />
        </div>
      );
      break;
    case AVAILABILITY_PLAN_TYPE_REPEAT:
      const { entries } = careSchedule;
      const mappedTimesToDay = {
        sun: [],
        mon: [],
        tue: [],
        wed: [],
        thu: [],
        fri: [],
        sat: [],
      };

      entries?.forEach(entry => {
        const { dayOfWeek, startTime, endTime } = entry;
        mappedTimesToDay[dayOfWeek].push({ startTime, endTime });
      });

      content = (
        <div>
          <WeekCalendar mappedTimesToDay={mappedTimesToDay} />
          <div className={css.datesContainer}>
            <span className={css.dateContainer}>
              <p>
                <span className={isMobile ? css.smallBold : css.bold}>Start Date: </span>
                <span className={css.item}>
                  {careSchedule?.startDate
                    ? timestampToDate(careSchedule.startDate).toLocaleDateString()
                    : 'NA'}
                </span>
              </p>
            </span>
            <span className={css.dateContainer}>
              <p>
                <span className={isMobile ? css.smallBold : css.bold}>End Date: </span>
                <span className={css.item}>
                  {careSchedule?.endDate
                    ? timestampToDate(careSchedule.endDate).toLocaleDateString()
                    : 'NA'}
                </span>
              </p>
            </span>
          </div>
        </div>
      );
      break;
    case AVAILABILITY_PLAN_TYPE_24_HOUR:
      const availableDays = careSchedule?.availableDays;
      content = (
        <div className={css.liveInContainer}>
          <div className={css.buttonContainer}>
            <div className={css.buttonRowContainer}>
              {weekdayMap.map((day, index) => {
                if (index < 4) {
                  return (
                    <div
                      key={index}
                      className={classNames(
                        css.weekdayButton,
                        availableDays?.includes(day.day) && css.selected
                      )}
                    >
                      {day.label}
                    </div>
                  );
                }
              })}
            </div>
            <div className={css.buttonRowContainer}>
              {weekdayMap.map((day, index) => {
                if (index >= 4) {
                  return (
                    <div
                      key={index}
                      className={classNames(
                        css.weekdayButton,
                        availableDays?.includes(day.day) && css.selected
                      )}
                    >
                      {day.label}
                    </div>
                  );
                }
              })}
            </div>
          </div>
          <div className={css.hoursPerDayContainer}>
            <h1 className={css.hoursPerDay}>{careSchedule?.hoursPerDay}</h1>
            <span>Hours of care per day</span>
          </div>
          {careSchedule?.liveIn && <p className={css.liveIn}>*This is a live-in position</p>}
          <div className={css.datesContainer}>
            <span className={css.dateContainer}>
              <p className={css.dateText}>
                <span className={isMobile ? css.smallBold : css.bold}>Start Date: </span>
                <span className={css.item}>
                  {careSchedule?.startDate
                    ? timestampToDate(careSchedule.startDate).toLocaleDateString()
                    : 'NA'}
                </span>
              </p>
            </span>
            <span className={css.dateContainer}>
              <p className={css.dateText}>
                <span className={isMobile ? css.smallBold : css.bold}>End Date: </span>
                <span className={css.item}>
                  {careSchedule?.endDate
                    ? timestampToDate(careSchedule.endDate).toLocaleDateString()
                    : 'NA'}
                </span>
              </p>
            </span>
          </div>
        </div>
      );
      break;
    default:
      content = null;
  }

  const cardContentStyles =
    isMobile && careSchedule?.type === AVAILABILITY_PLAN_TYPE_ONE_TIME
      ? {
          paddingBottom: '0 !important',
        }
      : {};

  return (
    <SectionCard title={careScheduleCardTitle} ref={ref} cardContentStyles={cardContentStyles}>
      {content}
    </SectionCard>
  );
});

export default CareScheduleSection;
