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

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

const CareScheduleSection = forwardRef((props, ref) => {
  const { availabilityPlan, filterConfig } = props;

  const scheduleTypes = findOptionsForSelectFilter('scheduleType', filterConfig);

  const careScheduleCardTitle = (
    <h1 className={css.title}>
      Care Schedule{' '}
      <span style={{ display: isMobile && 'inline-block' }}>
        ({scheduleTypes.find(s => s.key === availabilityPlan?.type)?.label})
      </span>
    </h1>
  );

  let content = null;

  switch (availabilityPlan?.type) {
    case AVAILABILITY_PLAN_TYPE_ONE_TIME:
      const { selectedSessions } = availabilityPlan;
      content = (
        <div className={css.container}>
          <ViewCalendar selectedSessions={selectedSessions} planType="oneTime" />
        </div>
      );
      break;
    case AVAILABILITY_PLAN_TYPE_REPEAT:
      const { entries } = availabilityPlan;
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
                  {availabilityPlan?.startDate
                    ? timestampToDate(availabilityPlan.startDate).toLocaleDateString()
                    : 'NA'}
                </span>
              </p>
            </span>
            <span className={css.dateContainer}>
              <p>
                <span className={isMobile ? css.smallBold : css.bold}>End Date: </span>
                <span className={css.item}>
                  {availabilityPlan?.endDate
                    ? timestampToDate(availabilityPlan.endDate).toLocaleDateString()
                    : 'NA'}
                </span>
              </p>
            </span>
          </div>
        </div>
      );
      break;
    case AVAILABILITY_PLAN_TYPE_24_HOUR:
      const availableDays = availabilityPlan?.availableDays;
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
            <h1 className={css.hoursPerDay}>{availabilityPlan?.hoursPerDay}</h1>
            <span>Working hours per day</span>
          </div>
          {availabilityPlan?.liveIn && <p className={css.liveIn}>*This is a live-in position</p>}
          <div className={css.datesContainer}>
            <span className={css.dateContainer}>
              <p>
                <span className={isMobile ? css.smallBold : css.bold}>Start Date: </span>
                <span className={css.item}>
                  {availabilityPlan?.startDate
                    ? timestampToDate(availabilityPlan.startDate).toLocaleDateString()
                    : 'NA'}
                </span>
              </p>
            </span>
            <span className={css.dateContainer}>
              <p>
                <span className={isMobile ? css.smallBold : css.bold}>End Date: </span>
                <span className={css.item}>
                  {availabilityPlan?.endDate
                    ? timestampToDate(availabilityPlan.endDate).toLocaleDateString()
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
    isMobile && availabilityPlan?.type === AVAILABILITY_PLAN_TYPE_ONE_TIME
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
