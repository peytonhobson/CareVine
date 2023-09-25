const moment = require('moment');
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const BOOKING_FEE_PERCENTAGE = 0.05;
const BANK_ACCOUNT = 'us_bank_account';
const CARD_PROCESSING_FEE = 0.029;
const BANK_PROCESSING_FEE = 0.008;

const calculateProcessingFee = (subTotal, transactionFee, selectedPaymentMethod) => {
  const totalAmount = Number(subTotal) + Number(transactionFee);
  if (selectedPaymentMethod === BANK_ACCOUNT) {
    const calculatedFee = parseFloat(
      Math.round(((totalAmount * BANK_PROCESSING_FEE) / (1 - BANK_PROCESSING_FEE)) * 100) / 100
    ).toFixed(2);
    return calculatedFee > 5 ? '5.00' : calculatedFee;
  }

  return parseFloat(
    Math.round(((totalAmount * CARD_PROCESSING_FEE + 0.3) / (1 - CARD_PROCESSING_FEE)) * 100) / 100
  ).toFixed(2);
};

const calculateTimeBetween = (bookingStart, bookingEnd) => {
  // Convert time from 12 hour to 24 hour format using moment
  const start = moment(bookingStart, ['h:mma']).format('HH');
  const end = moment(bookingEnd, ['h:mma']).format('HH');

  return bookingEnd === '12:00am' ? 24 : end - start;
};

const filterInsideExceptions = (exceptions, startOfWeek) =>
  Object.keys(exceptions).reduce((acc, exceptionKey) => {
    const insideExceptions = exceptions[exceptionKey].filter(exception =>
      moment(exception.date).isBetween(
        moment(startOfWeek).startOf('week'),
        moment(startOfWeek).endOf('week'),
        'day',
        '[]'
      )
    );

    return { ...acc, [exceptionKey]: insideExceptions };
  }, {});

const reduceWeekdays = (acc, weekday, insideExceptions, startOfWeek, endDate) => {
  const realDate = moment(startOfWeek)
    .weekday(WEEKDAYS.indexOf(weekday.dayOfWeek))
    .toDate();
  const isPastEndDate = endDate ? moment(realDate).isAfter(endDate) : false;

  const isAfterStartDate =
    moment(startOfWeek).weekday(WEEKDAYS.indexOf(weekday.dayOfWeek)) >=
    moment(startOfWeek).startOf('day');
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

const filterWeeklyBookingDays = ({ weekdays, startOfWeek, endDate, exceptions }) => {
  if (!weekdays.length) return [];

  const insideExceptions = filterInsideExceptions(exceptions, startOfWeek);

  const reducedWeekdays = weekdays.reduce(
    (acc, weekday) =>
      reduceWeekdays(acc, weekday, insideExceptions, startOfWeek, endDate, weekdays),
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
  startOfWeek,
  endDate,
  bookingRate,
  paymentMethodType,
  exceptions
) => {
  const filteredWeekdays = filterWeeklyBookingDays({
    weekdays,
    startOfWeek,
    endDate,
    exceptions,
  });

  const lineItems = filteredWeekdays.map(day => {
    const { dayOfWeek, startTime, endTime } = day;

    const hours = calculateTimeBetween(startTime, endTime);
    const amount = parseFloat(hours * bookingRate).toFixed(2);
    const isoDate = moment(startOfWeek)
      .weekday(WEEKDAYS.indexOf(dayOfWeek))
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
