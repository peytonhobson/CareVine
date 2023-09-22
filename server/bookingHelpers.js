const moment = require('moment');
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

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
    .weekday(WEEKDAYS.indexOf(weekday.dayOfWeek))
    .toDate();
  const isPastEndDate = endDate ? moment(realDate).isAfter(endDate) : false;

  const isAfterStartDate =
    moment(startDate).weekday(WEEKDAYS.indexOf(weekday.dayOfWeek)) >=
    moment(startDate).startOf('day');
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

const filterWeeklyBookingDays = ({ weekdays, startDate, endDate, exceptions }) => {
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

const sortWeekdays = weekdays =>
  weekdays.sort((a, b) => WEEKDAYS.indexOf(a.dayOfWeek) - WEEKDAYS.indexOf(b.dayOfWeek));

const sortExceptionsByDate = (a, b) => {
  return moment(a.date) - moment(b.date);
};

const checkForExceptions = exceptions => {
  return Object.keys(exceptions).some(key => exceptions[key].length > 0);
};

const checkHasBlockedDates = (dates, bookedDates) => dates?.some(d => bookedDates.includes(d.date));

const checkHasBlockedDays = (bookingSchedule, startDate, endDate, exceptions, bookedDays) => {
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

const mapWeekdays = values =>
  WEEKDAYS.reduce((acc, val) => {
    if (values[val]) {
      return [
        ...acc,
        { dayOfWeek: val, startTime: values[val][0].startTime, endTime: values[val][0].endTime },
      ];
    }

    return acc;
  }, []);

const getFirstWeekEndDate = (startDate, bookingSchedule, exceptions) => {
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

const constructBookingMetadataRecurring = (
  weekdays,
  startDate,
  endDate,
  bookingRate,
  paymentMethodType,
  exceptions
) => {
  const filteredWeekdaysObj = filterWeeklyBookingDays({
    weekdays,
    startDate,
    endDate,
    exceptions,
  });

  const filteredWeekdays = Object.keys(filteredWeekdaysObj)?.reduce((acc, weekdayKey) => {
    return [...acc, { weekday: weekdayKey, ...filteredWeekdaysObj[weekdayKey] }];
  }, []);

  const lineItems = filteredWeekdays.map(day => {
    const { dayOfWeek, startTime, endTime } = day;

    const hours = calculateTimeBetween(startTime, endTime);
    const amount = parseFloat(hours * bookingRate).toFixed(2);
    const isoDate = moment(startDate)
      .weekday(WEEKDAY_MAP[dayOfWeek])
      .toISOString();

    return {
      code: 'line-item/booking',
      startTime,
      endTime,
      seats: 1,
      date: isoDate,
      shortDate: moment(isoDate).format('MM/DD'),
      hours,
      amount,
      bookingFee: parseFloat(amount * 0.05).toFixed(2),
    };
  });

  const payout = lineItems.reduce((acc, item) => acc + parseFloat(item.amount), 0);

  const bookingFee = parseFloat(payout * BOOKING_FEE_PERCENTAGE).toFixed(2);
  const processingFee = calculateProcessingFee(payout, bookingFee, paymentMethodType);

  return {
    lineItems,
    bookingFee,
    processingFee,
    totalPayment: parseFloat(Number(bookingFee) + Number(processingFee) + Number(payout)).toFixed(
      2
    ),
    payout: parseFloat(payout).toFixed(2),
    bookingSchedule: weekdays,
    startDate: moment(startDate).toISOString(),
    endDate: endDate ? moment(endDate).toISOString() : null,
    cancelAtPeriodEnd: false,
    type: 'recurring',
  };
};

module.exports = {
  filterWeeklyBookingDays,
  checkForExceptions,
  checkHasBlockedDates,
  checkHasBlockedDays,
  mapWeekdays,
  getFirstWeekEndDate,
  sortExceptionsByDate,
  sortWeekdays,
  constructBookingMetadataRecurring,
};
