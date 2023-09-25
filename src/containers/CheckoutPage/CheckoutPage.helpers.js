import { convertTimeFrom12to24 } from '../../util/data';
import moment from 'moment';
import { calculateProcessingFee } from '../../util/data';
import { addTimeToStartOfDay } from '../../util/dates';
import { WEEKDAY_MAP } from '../../util/constants';
import { filterWeeklyBookingDays, sortWeekdays } from '../../util/bookings';

const BOOKING_FEE_PERCENTAGE = 0.05;

export const formatDateTimeValues = dateTimes =>
  Object.keys(dateTimes).map(key => {
    const startTime = dateTimes[key].startTime;
    const endTime = dateTimes[key].endTime;

    return {
      startTime,
      endTime,
      date: key,
    };
  });

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
  const startTime = moment(sortedBookingTimes[0].date)
    .add(additionalTime, 'hours')
    .toDate();

  return startTime;
};

export const findStartTimeRecurring = (weekdays, startDate, endDate, exceptions) => {
  const filteredWeekdays = sortWeekdays(
    filterWeeklyBookingDays({
      weekdays,
      startDate,
      endDate,
      exceptions,
    })
  );

  const firstDay = filteredWeekdays[0];
  const startTime = addTimeToStartOfDay(startDate, firstDay.startTime);

  return startTime;
};

const calculateTimeBetween = (bookingStart, bookingEnd) => {
  // Convert time from 12 hour to 24 hour format using moment
  const start = moment(bookingStart, ['h:mma']).format('HH');
  const end = moment(bookingEnd, ['h:mma']).format('HH');

  return bookingEnd === '12:00am' ? 24 : end - start;
};

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
    const isoDate = bookingDates[index]?.toISOString();

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
