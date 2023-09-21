import moment from 'moment';
import { WEEKDAYS, WEEKDAY_MAP } from './constants';

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

const reduceWeekdays = (acc, weekdayKey, insideExceptions, startDate, endDate, weekdays) => {
  const realDate = moment(startDate)
    .weekday(WEEKDAY_MAP[weekdayKey])
    .toDate();
  const isPastEndDate = endDate ? moment(realDate).isAfter(endDate) : false;

  const isAfterStartDate =
    moment(startDate).weekday(WEEKDAY_MAP[weekdayKey]) >= moment(startDate).startOf('day');
  const isRemovedDay = insideExceptions.removedDays?.some(d =>
    moment(d.date).isSame(realDate, 'day')
  );

  if (isRemovedDay || isPastEndDate) {
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

export const filterWeeklyBookingDays = ({ weekdays, startDate, endDate, exceptions }) => {
  const keys = Object.keys(weekdays);

  if (!keys.length) return {};

  const insideExceptions = filterInsideExceptions(exceptions, startDate);

  const reducedWeekdays = keys.reduce(
    (acc, weekdayKey) =>
      reduceWeekdays(acc, weekdayKey, insideExceptions, startDate, endDate, weekdays),
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

  return sortWeekdays(weekdaysWithAddedDays);
};

export const sortWeekdays = weekdays => {
  const sortedWeekdays = Object.keys(weekdays)
    .sort((a, b) => WEEKDAY_MAP[a] - WEEKDAY_MAP[b])
    .reduce((acc, key) => ({ ...acc, [key]: weekdays[key] }), {});

  return sortedWeekdays;
};

export const sortExceptionsByDate = (a, b) => {
  return moment(a.date) - moment(b.date);
};

export const checkForExceptions = exceptions => {
  return Object.keys(exceptions).some(key => exceptions[key].length > 0);
};

export const checkHasBlockedDates = (dates, bookedDates) =>
  dates?.some(d => bookedDates.includes(d.date));

export const checkHasBlockedDays = (days, startDate, endDate, exceptions, bookedDays) => {
  if (!days || !bookedDays || !startDate) return false;

  const dayKeys = Object.keys(days);

  const overlappingDays = bookedDays.filter(
    d =>
      moment(d.startDate).isBetween(startDate, endDate, 'day', '[]') ||
      moment(d.endDate).isBetween(startDate, endDate, 'day', '[]') ||
      (moment(d.startDate).isSameOrBefore(startDate, 'day') &&
        (!d.endDate || moment(d.endDate).isSameOrAfter(endDate, 'day')))
  );

  if (overlappingDays.length === 0) return false;

  const hasBlockedDay = overlappingDays.some(d => {
    return d.days.some(day => dayKeys.includes(day));
  });

  if (hasBlockedDay) return true;

  const insideExceptions = filterInsideExceptions(exceptions, startDate);

  const hasBlockedException = insideExceptions.addedDays.some(exception => {
    return overlappingDays.some(d => d.days.includes(WEEKDAYS[moment(exception.date).weekday()]));
  });

  return hasBlockedException;
};
