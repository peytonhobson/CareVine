import { convertTimeFrom12to24 } from '../../util/data';
import moment from 'moment';
import { calculateProcessingFee } from '../../util/data';
import { addTimeToStartOfDay } from '../../util/dates';

const BANK_ACCOUNT = 'Bank Account';
const CREDIT_CARD = 'Payment Card';
const BOOKING_FEE_PERCENTAGE = 0.05;

const weekdayMap = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

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

export const findStartTimeRecurring = (weekdays, startDate) => {
  const filteredWeekdays = Object.keys(weekdays)?.reduce((acc, weekdayKey) => {
    const bookingDate = moment(startDate).weekday(weekdayMap[weekdayKey]);

    return bookingDate >= startDate
      ? [...acc, { weekday: weekdayKey, ...weekdays[weekdayKey][0] }]
      : acc;
  }, []);

  const firstDay = filteredWeekdays[0];
  const startTime = addTimeToStartOfDay(startDate, firstDay.startTime);

  return startTime;
};

const calculateTimeBetween = (bookingStart, bookingEnd) => {
  const start = convertTimeFrom12to24(bookingStart).split(':')[0];
  const end = bookingEnd === '12:00am' ? 24 : convertTimeFrom12to24(bookingEnd).split(':')[0];

  return end - start;
};

export const constructBookingMetadataOneTime = (
  bookingDates,
  bookingTimes,
  bookingRate,
  paymentMethodType
) => {
  const lineItems = formatDateTimeValues(bookingTimes).map(booking => {
    const { startTime, endTime, date } = booking;

    const hours = calculateTimeBetween(startTime, endTime);
    const amount = parseFloat(hours * bookingRate).toFixed(2);
    const isoDate = bookingDates
      .find(d => `${d.getMonth() + 1}/${d.getDate()}` === date)
      ?.toISOString();

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
  const processingFee = calculateProcessingFee(
    payout,
    bookingFee,
    paymentMethodType === 'card' ? CREDIT_CARD : BANK_ACCOUNT
  );

  return {
    lineItems,
    bookingRate,
    bookingFee,
    processingFee,
    totalPayment: parseFloat(Number(bookingFee) + Number(processingFee) + Number(payout)).toFixed(
      2
    ),
    payout: parseFloat(payout).toFixed(2),
  };
};

export const constructBookingMetadataRecurring = (
  weekdays,
  startDate,
  endDate,
  bookingRate,
  paymentMethodType
) => {
  const filteredWeekdays = Object.keys(weekdays)?.reduce((acc, weekdayKey) => {
    const bookingDate = moment(startDate).weekday(weekdayMap[weekdayKey]);

    return bookingDate >= startDate
      ? [...acc, { weekday: weekdayKey, ...weekdays[weekdayKey][0] }]
      : acc;
  }, []);

  const lineItems = filteredWeekdays.map(day => {
    const { weekday, startTime, endTime } = day;

    const hours = calculateTimeBetween(startTime, endTime);
    const amount = parseFloat(hours * bookingRate).toFixed(2);
    const isoDate = moment(startDate)
      .weekday(weekdayMap[weekday])
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
  const processingFee = calculateProcessingFee(
    payout,
    bookingFee,
    paymentMethodType === 'card' ? CREDIT_CARD : BANK_ACCOUNT
  );

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
    endDate: moment(endDate).toISOString(),
    cancelAtPeriodEnd: false,
  };
};
