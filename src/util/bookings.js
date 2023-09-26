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

const reduceWeekdays = (acc, weekday, insideExceptions, startDate, endDate) => {
  const realDate = moment(startDate)
    .weekday(WEEKDAY_MAP[weekday.dayOfWeek])
    .toDate();
  const isPastEndDate = endDate ? moment(realDate).isAfter(endDate) : false;

  const isAfterStartDate =
    moment(startDate).weekday(WEEKDAY_MAP[weekday.dayOfWeek]) >= moment(startDate).startOf('day');
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
    return [
      ...acc,
      {
        dayOfWeek: weekday.dayOfWeek,
        startTime: changedDay.startTime,
        endTime: changedDay.endTime,
      },
    ];
  }

  return isAfterStartDate ? [...acc, weekday] : acc;
};

export const filterWeeklyBookingDays = ({ weekdays, startDate, endDate, exceptions }) => {
  if (!weekdays.length) return [];

  const insideExceptions = filterInsideExceptions(exceptions, startDate);

  const reducedWeekdays = weekdays.reduce(
    (acc, weekday) => reduceWeekdays(acc, weekday, insideExceptions, startDate, endDate, weekdays),
    []
  );

  const weekdaysWithAddedDays = insideExceptions.addedDays.reduce((acc, addedDay) => {
    const weekdayKey = WEEKDAYS[moment(addedDay.date).weekday()];

    return [
      ...acc,
      {
        dayOfWeek: weekdayKey,
        startTime: addedDay.startTime,
        endTime: addedDay.endTime,
      },
    ];
  }, reducedWeekdays);

  return sortWeekdays(weekdaysWithAddedDays);
};

export const sortWeekdays = weekdays =>
  weekdays.sort((a, b) => WEEKDAY_MAP[a.dayOfWeek] - WEEKDAY_MAP[b.dayOfWeek]);

export const sortExceptionsByDate = (a, b) => {
  return moment(a.date) - moment(b.date);
};

export const checkForExceptions = exceptions => {
  return Object.keys(exceptions).some(key => exceptions[key].length > 0);
};

export const checkHasBlockedDates = (dates = [], bookedDates = []) =>
  dates?.some(d => bookedDates.includes(d.date));

export const checkHasBlockedDays = (
  bookingSchedule,
  startDate,
  endDate,
  exceptions,
  bookedDays = []
) => {
  if (!bookingSchedule || !bookedDays || !startDate) return false;

  const overlappingDays = bookedDays.filter(
    d =>
      moment(d.startDate).isBetween(startDate, endDate, 'day', '[]') ||
      moment(d.endDate).isBetween(startDate, endDate, 'day', '[]') ||
      (moment(d.startDate).isSameOrBefore(startDate, 'day') &&
        (!d.endDate || moment(d.endDate).isSameOrAfter(endDate, 'day')))
  );

  if (overlappingDays.length === 0) return false;

  const hasBlockedDay = overlappingDays.some(d => {
    return d.days.some(day => bookingSchedule.find(b => b.dayOfWeek === day));
  });

  if (hasBlockedDay) return true;

  const insideExceptions = filterInsideExceptions(exceptions, startDate);

  const hasBlockedException = insideExceptions.addedDays.some(exception => {
    return overlappingDays.some(d => d.days.includes(WEEKDAYS[moment(exception.date).weekday()]));
  });

  return hasBlockedException;
};

export const mapWeekdays = values =>
  WEEKDAYS.reduce((acc, val) => {
    if (values[val]) {
      return [
        ...acc,
        { dayOfWeek: val, startTime: values[val][0].startTime, endTime: values[val][0].endTime },
      ];
    }

    return acc;
  }, []);

export const getFirstWeekEndDate = (startDate, bookingSchedule, exceptions) => {
  // Find start and end of week
  const start = moment(startDate);
  const weekStart = start.startOf('week');
  const weekEnd = start.endOf('week');

  // Filter exceptions for those within next week
  const insideExceptions = Object.keys(exceptions)
    .flat()
    .filter(e => moment(e.date).isBetween(weekStart, weekEnd, null, '[]'));

  // Create new booking schedule with exceptions
  const newBookingSchedule = WEEKDAYS.reduce((acc, day) => {
    const removeDay = insideExceptions.find(e => e.day === day && e.type === 'removeDate');
    if (removeDay) return acc;

    const daySchedule = bookingSchedule.find(b => b.dayOfWeek === day);
    if (!daySchedule) return acc;

    const addOrChangeDay = insideExceptions.find(
      e => e.day === day && (e.type === 'addDate' || e.type === 'changeDate')
    );
    if (addOrChangeDay) {
      return [
        ...acc,
        {
          dayOfWeek: day,
          startTime: addOrChangeDay.startTime,
          endTime: addOrChangeDay.endTime,
        },
      ];
    }

    return [...acc, daySchedule];
  }, []);

  const lastDay = sortWeekdays(newBookingSchedule)[newBookingSchedule.length - 1];

  return weekStart.weekday(WEEKDAYS.indexOf(lastDay.dayOfWeek));
};
