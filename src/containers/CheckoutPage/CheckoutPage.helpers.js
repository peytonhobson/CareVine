import { convertTimeFrom12to24 } from '../../util/data';
import moment from 'moment';
import { calculateProcessingFee } from '../../util/data';
import { addTimeToStartOfDay, calculateTimeBetween } from '../../util/dates';
import { WEEKDAY_MAP, ISO_OFFSET_FORMAT, BOOKING_FEE_PERCENTAGE } from '../../util/constants';
import { filterWeeklyBookingDays, sortWeekdays } from '../../util/bookings';

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
  const startTime = moment(sortedBookingTimes[0].date).add(additionalTime, 'hours');

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
