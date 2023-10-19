import moment from 'moment';
import { WEEKDAYS, WEEKDAY_MAP, ISO_OFFSET_FORMAT, BOOKING_FEE_PERCENTAGE } from './constants';
import { addTimeToStartOfDay, calculateTimeBetween } from './dates';
import { calculateProcessingFee } from './data';
import { updateListingMetadata } from './api';

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

// Check if one time is blocked by caregivers listing
export const checkIsBlockedOneTime = ({ dates, listing }) => {
  if (!dates || !listing) return false;

  const { bookedDays = [], bookedDates = [] } = listing.attributes.metadata;

  return dates.some(d => checkIsBlockedDay({ date: d, bookedDays, bookedDates }));
};

// Check if recurring booking is blocked by caregivers listing
export const checkIsBlockedRecurring = ({
  bookingSchedule,
  startDate,
  endDate,
  exceptions,
  listing,
}) => {
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

export const checkIsBlockedDay = ({ date, bookedDays, bookedDates }) => {
  const dayOfWeek = WEEKDAYS[moment(date).weekday()];

  // Day is booked if it falls into a the regular booking schedule within the
  // booking window and is not a removed day or it is an added day
  const isBookedDay = bookedDays.some(
    d =>
      (d.days.includes(dayOfWeek) &&
        checkIsDateWithinBookingWindow({ startDate: d.startDate, endDate: d.endDate, date }) &&
        !d.exceptions?.removedDays.some(e => moment(e.date).isSame(date, 'day'))) ||
      d.exceptions?.addedDays.some(e => moment(e.date).isSame(date, 'day'))
  );

  const isBookedDate = bookedDates.some(d => moment(d).isSame(date, 'day'));

  return isBookedDay || isBookedDate;
};

export const checkIsDateWithinBookingWindow = ({ startDate, endDate, date }) =>
  endDate
    ? moment(date).isBetween(startDate, endDate, 'day', '[]')
    : moment(date).isSameOrAfter(startDate, 'day');

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

export const checkIfBookingDateRangesOverlap = (start1, end1, start2, end2) => {
  // If end dates are null, set them to a very distant future date
  end1 = end1 ? moment(end1) : moment().add(1000, 'years');
  end2 = end2 ? moment(end2) : moment().add(1000, 'years');

  // Check for overlap
  return (
    (moment(start1).isSameOrBefore(end2) && end1.isSameOrAfter(start2)) ||
    (moment(start2).isSameOrBefore(end1) && end2.isSameOrAfter(start1))
  );
};

export const getFirstWeekEndDate = (startDate, bookingSchedule, exceptions) => {
  if (!startDate || !bookingSchedule?.length) return null;

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

// TODO: Figure out way to get this to be compatible with removedDays
export const getUnavailableDays = ({
  bookedDays = [],
  startDate,
  endDate,
  bookedDates = [],
  weekdays,
}) => {
  if (!startDate || !weekdays) return [];

  const bookedDaysArr = bookedDays.reduce((acc, booking) => {
    const overlaps = checkIfBookingDateRangesOverlap(
      startDate,
      endDate,
      booking.startDate,
      booking.endDate
    );

    const insideExceptions =
      booking.exceptions?.addedDays.filter(e =>
        checkIsDateWithinBookingWindow({ startDate, endDate, date: e.date })
      ) || [];
    const exceptionDays = insideExceptions.map(e => e.day);

    if (overlaps) {
      return [...acc, ...booking.days, ...exceptionDays];
    }
    return acc;
  }, []);

  const bookedDatesArr = bookedDates.reduce((acc, bookingDate) => {
    const isBetween = checkIsDateWithinBookingWindow({ startDate, endDate, date: bookingDate });

    if (isBetween) {
      const dayOfWeek = WEEKDAYS[new Date(bookingDate).getDay()];
      return [...acc, dayOfWeek];
    }
    return acc;
  }, []);

  const unavailableDays = [...new Set([...bookedDaysArr, ...bookedDatesArr])].filter(w =>
    weekdays.some(weekday => weekday.dayOfWeek === w)
  );

  return unavailableDays;
};

export const checkIsDateInBookingSchedule = (date, bookingSchedule, exceptions) => {
  const isInRegularDays = bookingSchedule.some(
    d => d.dayOfWeek === WEEKDAYS[moment(date).weekday()]
  );
  const isAddedDay = exceptions?.addedDays?.find(d => moment(d).isSame(date, 'day'));
  const isRemovedDay = exceptions?.removedDays?.find(d => moment(d).isSame(date, 'day'));

  return (isInRegularDays && !isRemovedDay) || isAddedDay;
};

export const findNextWeekStartTime = (lineItems, bookingSchedule, exceptions, attemptNum = 1) => {
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

export const findStartTimeFromBookingTimes = bookingTimes => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const dateBookingTimes = formatDateTimeValues(bookingTimes).map(bookingTime => {
    const split = bookingTime.date.split('/');
    const date = new Date(
      split[0] - 1 < currentMonth ? currentYear + 1 : currentYear,
      split[0] - 1,
      split[1]
    );
    return { date, startTime: bookingTime.startTime, endTime: bookingTime.endTime };
  });
  const sortedBookingTimes = dateBookingTimes.sort((a, b) => {
    return a.date - b.date;
  });

  const firstDay = sortedBookingTimes[0];
  const additionalTime = parseInt(convertTimeFrom12to24(firstDay.startTime).split(':')[0], 10);
  const startTime = moment(sortedBookingTimes[0].date).add(additionalTime, 'hours');

  return startTime;
};

export const findStartTimeRecurring = (weekdays, startDate, endDate, exceptions) => {
  console.log(startDate);
  console.log(endDate);
  const filteredWeekdays = sortWeekdays(
    filterWeeklyBookingDays({
      weekdays,
      startDate,
      endDate,
      exceptions,
    })
  );

  if (!filteredWeekdays.length) return null;

  const firstDay = filteredWeekdays[0];
  const startTime = addTimeToStartOfDay(startDate, firstDay.startTime);

  return startTime;
};

const formatDateTimeValues = dateTimes =>
  Object.keys(dateTimes).map(key => {
    const startTime = dateTimes[key].startTime;
    const endTime = dateTimes[key].endTime;

    return {
      startTime,
      endTime,
      date: key,
    };
  });

export const constructBookingMetadataOneTime = (
  bookingDates,
  bookingTimes,
  bookingRate,
  paymentMethodType
) => {
  const lineItems = formatDateTimeValues(bookingTimes).map((booking, index) => {
    const { startTime, endTime } = booking;

    const hours = calculateTimeBetween(startTime, endTime);
    const amount = parseFloat(hours * bookingRate).toFixed(2);
    const isoDate = moment(bookingDates[index])?.format(ISO_OFFSET_FORMAT);

    return {
      code: 'line-item/booking',
      startTime,
      endTime,
      date: isoDate,
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
    bookingRate,
    bookingFee,
    processingFee,
    totalPayment: parseFloat(Number(bookingFee) + Number(processingFee) + Number(payout)).toFixed(
      2
    ),
    payout: parseFloat(payout).toFixed(2),
    type: 'oneTime',
  };
};

export const constructBookingMetadataRecurring = (
  weekdays,
  startDate,
  endDate,
  bookingRate,
  paymentMethodType,
  exceptions
) => {
  const filteredWeekdays = filterWeeklyBookingDays({
    weekdays,
    startDate,
    endDate,
    exceptions,
  });

  const lineItems = filteredWeekdays.map(day => {
    const { dayOfWeek, startTime, endTime } = day;

    const hours = calculateTimeBetween(startTime, endTime);
    const amount = parseFloat(hours * bookingRate).toFixed(2);
    const isoDate = moment(startDate)
      .weekday(WEEKDAY_MAP[dayOfWeek])
      .format(ISO_OFFSET_FORMAT);

    return {
      code: 'line-item/booking',
      startTime,
      endTime,
      date: isoDate,
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
    bookingSchedule: weekdays,
    startDate: moment(startDate).format(ISO_OFFSET_FORMAT),
    endDate: endDate ? moment(endDate).format(ISO_OFFSET_FORMAT) : null,
    cancelAtPeriodEnd: false,
    type: 'recurring',
  };
};

export const updateBookedDays = async ({
  txId,
  bookingSchedule,
  startDate,
  endDate,
  exceptions,
  sdk,
}) => {
  try {
    const transaction = (
      await sdk.transactions.show({
        id: txId,
        include: ['listing'],
      })
    ).data.data;

    const listingId = transaction.relationships.listing.data.id.uuid;
    const listing = (await sdk.listings.show({ id: listingId })).data.data;

    const { bookedDays = [] } = listing.attributes.metadata;

    const isUpdate = bookingSchedule || startDate || endDate || exceptions;

    let newBookedDays;
    if (isUpdate) {
      newBookedDays = bookedDays.map(d => {
        if (d.txId === txId) {
          console.log(bookingSchedule);
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

    console.log('newBookedDays', newBookedDays);

    await updateListingMetadata({
      listingId,
      metadata: {
        bookedDays: newBookedDays,
      },
    });
  } catch (e) {
    console.error(e, 'failed to update booked days');
    throw e;
  }
};
