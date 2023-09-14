import moment from 'moment';
import { WEEKDAYS } from './constants';

const filterInsideExceptions = (exceptions, startDate) =>
  Object.keys(exceptions).reduce((acc, exceptionKey) => {
    const insideExceptions = exceptions[exceptionKey].filter(exception =>
      moment(exception.date).isBetween(
        moment(startDate).startOf('week'),
        moment(startDate).endOf('week'),
        'day',
        '[]'
      )
    );

    return { ...acc, [exceptionKey]: insideExceptions };
  }, {});

const reduceWeekdays = (
  acc,
  weekdayKey,
  blockedDays,
  blockedDates,
  insideExceptions,
  startDate,
  endDate,
  weekdays
) => {
  const realDate = moment(startDate)
    .weekday(WEEKDAY_MAP[weekdayKey])
    .toDate();
  const isPastEndDate = endDate ? moment(realDate).isAfter(endDate) : false;

  const isAfterStartDate =
    moment(startDate).weekday(WEEKDAY_MAP[weekdayKey]) >= moment(startDate).startOf('day');
  const isBlockedDate = blockedDates.find(date =>
    moment(startDate)
      .weekday(WEEKDAY_MAP[weekdayKey])
      .isSame(date, 'day')
  );
  const isBlockedDay = blockedDays.some(
    d =>
      d.days.some(dd => WEEKDAY_MAP[dd] === moment(realDate).weekday()) &&
      (!d.endDate || realDate <= moment(d.endDate)) &&
      realDate >= moment(d.startDate)
  );
  const isRemovedDay = insideExceptions.removedDays?.some(d =>
    moment(d.date).isSame(realDate, 'day')
  );

  if (isRemovedDay || isBlockedDate || isBlockedDay || isPastEndDate) {
    return acc;
  }

  const changedDay = insideExceptions.changedDays?.find(d =>
    moment(d.date).isSame(realDate, 'day')
  );
  if (changedDay) {
    return {
      ...acc,
      [weekdayKey]: [
        {
          startTime: changedDay.startTime,
          endTime: changedDay.endTime,
        },
      ],
    };
  }

  return isAfterStartDate ? { ...acc, [weekdayKey]: weekdays[weekdayKey] } : acc;
};

export const filterWeeklyBookingDays = ({
  weekdays,
  startDate,
  endDate,
  exceptions,
  blockedDays,
  blockedDates,
}) => {
  const keys = Object.keys(weekdays);

  if (!keys.length) return {};

  const insideExceptions = filterInsideExceptions(exceptions, startDate);

  const reducedWeekdays = keys.reduce(
    (acc, weekdayKey) =>
      reduceWeekdays(
        acc,
        weekdayKey,
        blockedDays,
        blockedDates,
        insideExceptions,
        startDate,
        endDate,
        weekdays
      ),
    {}
  );

  const weekdaysWithAddedDays = insideExceptions.addedDays.reduce((acc, addedDay) => {
    const weekdayKey = WEEKDAYS[moment(addedDay.date).weekday()];

    return {
      ...acc,
      [weekdayKey]: [
        {
          startTime: addedDay.startTime,
          endTime: addedDay.endTime,
        },
      ],
    };
  }, reducedWeekdays);

  return weekdaysWithAddedDays;
};
