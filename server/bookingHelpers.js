const moment = require('moment');
const { integrationSdk } = require('./api-util/sdk');
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const BOOKING_FEE_PERCENTAGE = 0.02;
const BANK_ACCOUNT = 'us_bank_account';
const CARD_PROCESSING_FEE = 0.029;
const BANK_PROCESSING_FEE = 0.008;
const ISO_OFFSET_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSZ';

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
  const end = bookingEnd === '12:00am' ? 24 : moment(bookingEnd, ['h:mma']).format('HH');

  return end - start;
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
  if (!bookingSchedule || !bookingSchedule.length) return null;

  // Find start and end of week
  const start = moment(startDate).format(ISO_OFFSET_FORMAT);
  const weekStart = moment.parseZone(start).startOf('week');
  const weekEnd = moment.parseZone(start).endOf('week');

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

  const momentStartOfWeek =
    typeof startOfWeek === 'string' ? moment.parseZone(startOfWeek) : moment(startOfWeek);

  const lineItems = filteredWeekdays.map(day => {
    const { dayOfWeek, startTime, endTime } = day;

    const hours = calculateTimeBetween(startTime, endTime);
    const amount = parseFloat(hours * bookingRate).toFixed(2);
    const isoDate = momentStartOfWeek
      .clone()
      .weekday(WEEKDAYS.indexOf(dayOfWeek))
      .format(ISO_OFFSET_FORMAT);

    return {
      code: 'line-item/booking',
      startTime,
      endTime,
      seats: 1,
      date: isoDate,
      shortDay: moment(isoDate).format('ddd'),
      shortDate: moment(isoDate).format('MM/DD'),
      hours,
      amount,
      bookingFee: parseFloat(amount * BOOKING_FEE_PERCENTAGE).toFixed(2),
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

const checkIsDateWithinBookingWindow = ({ startDate, endDate, date }) =>
  endDate
    ? moment(date).isBetween(startDate, endDate, 'day', '[]')
    : moment(date).isSameOrAfter(startDate, 'day');

const checkIfBookingDateRangesOverlap = (start1, end1, start2, end2) => {
  // If end dates are null, set them to a very distant future date
  end1 = end1 ? moment(end1) : moment().add(1000, 'years');
  end2 = end2 ? moment(end2) : moment().add(1000, 'years');

  // Check for overlap
  return (
    (moment(start1).isSameOrBefore(end2) && end1.isSameOrAfter(start2)) ||
    (moment(start2).isSameOrBefore(end1) && end2.isSameOrAfter(start1))
  );
};

const addTimeToStartOfDay = (day, time) => {
  const hours = moment(time, ['h:mma']).format('HH');

  return typeof day === 'string'
    ? moment
        .parseZone(day)
        .startOf('day')
        .add(hours, 'hours')
    : moment(day)
        .startOf('day')
        .add(hours, 'hours');
};

// Check if one time is blocked by caregivers listing
const checkIsBlockedOneTime = ({ dates, listing }) => {
  if (!dates || !listing) return false;

  const { bookedDates = [], bookedDays = [] } = listing.attributes.metadata;

  // Dates are blocked if they are in the bookedDates array
  const overlappingDates = bookedDates.filter(d =>
    dates.some(date => moment(d).isSame(date, 'day'))
  );

  if (overlappingDates.length > 0) return true;

  // Dates are blocked if they a intersect a previous recurring booking (thats not a removed day) or its added days
  const hasBlockingDays = bookedDays.some(d =>
    dates.some(
      date =>
        checkIsDateWithinBookingWindow({ date, startDate: d.startDate, endDate: d.endDate }) &&
        ((d.days.includes(WEEKDAYS[moment(date).weekday()]) &&
          !d.exceptions?.removedDays.some(r => moment(r.date).isSame(date))) ||
          d.exceptions?.addedDays.some(a => moment(a.date).isSame(date)))
    )
  );

  return hasBlockingDays;
};

const checkIsBlockedRecurring = ({ bookingSchedule, startDate, endDate, exceptions, listing }) => {
  if (!listing) return;

  const { bookedDays = [], bookedDates = [] } = listing.attributes.metadata;

  if (!bookingSchedule || !startDate) return false;

  const overlappingDates = bookedDates.filter(d =>
    checkIsDateWithinBookingWindow({ date: d, startDate, endDate })
  );

  const hasBlockedDates = overlappingDates.some(d => {
    return (
      (bookingSchedule.find(b => b.dayOfWeek === WEEKDAYS[moment(d).weekday()]) &&
        !exceptions?.removedDays?.some(e => moment(e.date).isSame(d, 'day'))) ||
      exceptions?.addedDays?.some(e => moment(e.date).isSame(d, 'day'))
    );
  });

  if (hasBlockedDates) return true;

  const overlappingDays = bookedDays.filter(d =>
    checkIfBookingDateRangesOverlap(d.startDate, d.endDate, startDate, endDate)
  );

  if (overlappingDays.length === 0) return false;

  // If pre-existing booking is found, check if it overlaps with the booking schedule
  // This can be the regularaly scheduled days or added day from exceptions
  const hasBlockedDay = overlappingDays.some(d => {
    return d.days.some(day =>
      bookingSchedule.find(
        b => b.dayOfWeek === day || d.exceptions?.addedDays.some(e => e.day === day)
      )
    );
  });

  if (hasBlockedDay) return true;

  const insideExceptions = filterInsideExceptions(exceptions, startDate);

  // Check if exceptions overlap with previous booked days or exceptions
  const hasBlockedException = insideExceptions.addedDays.some(exception => {
    return overlappingDays.some(
      d =>
        d.days.includes(exception.day) ||
        d.exceptions?.addedDays.some(e => moment(e.date).isSame(exception.date))
    );
  });

  return hasBlockedException;
};

const findNextWeekStartTime = (lineItems, bookingSchedule, exceptions, attemptNum = 1) => {
  if (attemptNum > 4) return null;

  // Find start and end of next week
  // Unlike cron you can use lineItems here because they haven't been updated yet
  const nextWeekLineItemStart = moment.parseZone(lineItems[0].date).add(7 * attemptNum, 'days');
  const nextWeekStart = nextWeekLineItemStart.clone().startOf('week');
  const nextWeekEnd = nextWeekLineItemStart.clone().endOf('week');

  // Filter exceptions for those within next week
  const insideExceptions = Object.values(exceptions)
    .flat()
    .filter(e => moment(e.date).isBetween(nextWeekStart, nextWeekEnd, null, '[]'));

  // Create new booking schedule with exceptions
  const newBookingSchedule = WEEKDAYS.reduce((acc, day) => {
    const removeDay = insideExceptions.find(e => e.day === day && e.type === 'removeDate');
    if (removeDay) return acc;

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

    const daySchedule = bookingSchedule.find(b => b.dayOfWeek === day);
    if (!daySchedule) return acc;

    return [...acc, daySchedule];
  }, []);

  if (newBookingSchedule.length === 0) {
    return findNextWeekStartTime(lineItems, bookingSchedule, exceptions, attemptNum + 1);
  }

  const firstDay = newBookingSchedule[0] || {};

  const firstTime = firstDay.startTime;
  const startTime = addTimeToStartOfDay(
    nextWeekStart
      .clone()
      .weekday(WEEKDAYS.indexOf(firstDay.dayOfWeek))
      .startOf('day'),
    firstTime
  );

  return moment(startTime);
};

const updateBookedDays = async ({ txId, bookingSchedule, startDate, endDate, exceptions }) => {
  try {
    const transaction = (
      await integrationSdk.transactions.show({
        id: txId,
        include: ['listing'],
      })
    ).data.data;

    const listingId = transaction.relationships.listing.data.id.uuid;
    const listing = (await integrationSdk.listings.show({ id: listingId })).data.data;

    const { bookedDays = [] } = listing.attributes.metadata;

    const isUpdate = bookingSchedule || startDate || endDate || exceptions;

    let newBookedDays;
    if (isUpdate) {
      newBookedDays = bookedDays.map(d => {
        if (d.txId === txId) {
          return {
            ...d,
            days: bookingSchedule ? bookingSchedule.map(b => b.dayOfWeek) : d.days,
            startDate: startDate ? moment(startDate).format(ISO_OFFSET_FORMAT) : d.startDate,
            endDate: endDate ? moment(endDate).format(ISO_OFFSET_FORMAT) : d.endDate,
            exceptions: exceptions ? exceptions : d.exceptions,
          };
        }
        return d;
      });
    } else {
      newBookedDays = bookedDays.filter(d => d.txId !== txId);
    }

    await integrationSdk.listings.update({
      id: listingId,
      metadata: {
        bookedDays: newBookedDays,
      },
    });
  } catch (e) {
    log.error(e, 'update-booked-days-failed', {});
  }
};

const updateBookingLedger = transaction => {
  const {
    lineItems,
    paymentMethodType,
    bookingRate,
    paymentMethodId,
    paymentIntentId,
    refundAmount,
    ledger = [],
  } = transaction.attributes.metadata;

  const amount = parseFloat(
    lineItems.reduce((acc, item) => acc + parseFloat(item.amount), 0)
  ).toFixed(2);
  const bookingFee = parseInt(Math.round(amount * BOOKING_FEE_PERCENTAGE));
  const processingFee =
    paymentMethodType === 'Bank Account'
      ? parseFloat(Math.round(amount * 0.008)).toFixed(2)
      : parseFloat(Math.round(amount * 0.029) + 0.3).toFixed(2);

  const ledgerEntry = {
    bookingRate,
    paymentMethodId,
    paymentMethodType,
    bookingFee,
    processingFee,
    paymentIntentId,
    totalPayment: parseFloat(Number(bookingFee) + Number(processingFee) + Number(amount)).toFixed(
      2
    ),
    payout: parseFloat(amount).toFixed(2),
    refundAmount: refundAmount ? refundAmount : null,
    lineItems: lineItems.map(item => ({
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
    })),
    createdAt: moment().format(ISO_OFFSET_FORMAT),
  };

  return [...ledger, ledgerEntry];
};

module.exports = {
  filterWeeklyBookingDays,
  checkForExceptions,
  mapWeekdays,
  getFirstWeekEndDate,
  sortExceptionsByDate,
  sortWeekdays,
  constructBookingMetadataRecurring,
  checkIsBlockedRecurring,
  checkIsBlockedOneTime,
  addTimeToStartOfDay,
  findNextWeekStartTime,
  updateBookedDays,
  updateBookingLedger,
};
