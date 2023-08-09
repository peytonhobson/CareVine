import React, { useState, useMemo } from 'react';

import { InlineTextButton, PrimaryButton, Modal, WeeklyBillingDetails } from '../../../components';
import { convertTimeFrom12to24, calculateProcessingFee } from '../../../util/data';
import moment from 'moment';
import { WEEKDAY_MAP, WEEKDAYS } from '../../../util/constants';
import RecurringBookingItem from './RecurringBookingItem';
import BookingSummaryCard from '../BookingSummaryCard';
import ChangeRatesModal from '../ChangeRatesModal';

import css from '../BookingSummaryCard.module.css';

const TRANSACTION_FEE = 0.05;

const calculateTimeBetween = (bookingStart, bookingEnd) => {
  const start = convertTimeFrom12to24(bookingStart).split(':')[0];
  const end = bookingEnd === '12:00am' ? 24 : convertTimeFrom12to24(bookingEnd).split(':')[0];

  return end - start;
};

const calculateTotalHours = weekdays =>
  Object.keys(weekdays)?.reduce(
    (acc, curr) =>
      acc +
      (weekdays[curr]?.[0].startTime && weekdays[curr]?.[0].endTime
        ? calculateTimeBetween(weekdays[curr]?.[0].startTime, weekdays[curr]?.[0].endTime)
        : 0),
    0
  );

const calculateBookingFee = subTotal => parseFloat(Number(subTotal) * TRANSACTION_FEE).toFixed(2);

const calculateSubTotal = (totalHours, bookingRate) =>
  parseFloat(totalHours * Number(bookingRate)).toFixed(2);

const calculateTotalCost = (subTotal, bookingFee, processingFee, refundAmount = 0) =>
  parseFloat(
    Number(subTotal) + Number(bookingFee) + Number(processingFee) - Number(refundAmount)
  ).toFixed(2);

const filterInsideException = (exception, startDate) =>
  moment(exception.date).isBetween(
    moment(startDate).startOf('week'),
    moment(startDate).endOf('week'),
    'day',
    '[]'
  );

const filterInsideExceptions = (exceptions, startDate) =>
  Object.keys(exceptions).reduce((acc, exceptionKey) => {
    const insideExceptions = exceptions[exceptionKey].filter(exception =>
      filterInsideException(exception, startDate)
    );

    return { ...acc, [exceptionKey]: insideExceptions };
  }, {});

const reduceWeekdays = (
  acc,
  weekdayKey,
  bookedDays,
  bookedDates,
  insideExceptions,
  startDate,
  weekdays
) => {
  const realDate = moment(startDate)
    .weekday(WEEKDAY_MAP[weekdayKey])
    .toDate();

  const isAfterToday = moment(startDate).weekday(WEEKDAY_MAP[weekdayKey]) >= startDate;
  const isBookedDate = bookedDates.find(date =>
    moment(startDate)
      .weekday(WEEKDAY_MAP[weekdayKey])
      .isSame(date, 'day')
  );
  const isBookedDay = bookedDays.some(
    d =>
      d.days.some(dd => WEEKDAY_MAP[dd] === moment(realDate).weekday()) &&
      (!d.endDate || realDate <= moment(d.endDate)) &&
      realDate >= moment(d.startDate)
  );
  const isRemovedDay = insideExceptions.removedDays?.some(d =>
    moment(d.date).isSame(realDate, 'day')
  );

  if (isRemovedDay || isBookedDate || isBookedDay) {
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

  return isAfterToday ? { ...acc, [weekdayKey]: weekdays[weekdayKey] } : acc;
};

const RecurringBookingSummaryCard = props => {
  const {
    currentAuthor,
    formValues,
    form,
    listing,
    onManageDisableScrolling,
    selectedPaymentMethod,
    className,
    hideAvatar,
    subHeading,
    hideRatesButton,
    hideFees,
    refundAmount,
    weekdays = [],
    startDate,
    weekEndDate,
    bookingEndDate,
    exceptions = {
      addedDays: [],
      removedDays: [],
      changedDays: [],
    },
    bookedDays,
    bookedDates,
    bookingRate,
    hideWeeklyBillingDetails,
  } = props;

  const [isChangeRatesModalOpen, setIsChangeRatesModalOpen] = useState(false);
  const [isWeeklyBillingDetailsOpen, setIsWeeklyBillingDetailsOpen] = useState(false);

  const insideExceptions = useMemo(() => filterInsideExceptions(exceptions, startDate), [
    exceptions,
    startDate,
  ]);

  const filteredWeekdays = useMemo(() => {
    const keys = Object.keys(weekdays);

    if (!keys.length) return {};

    const reducedWeekdays = keys.reduce(
      (acc, weekdayKey) =>
        reduceWeekdays(
          acc,
          weekdayKey,
          bookedDays,
          bookedDates,
          insideExceptions,
          startDate,
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
  }, [weekdays, startDate, insideExceptions, bookedDays, bookedDates]);

  const totalHours = calculateTotalHours(filteredWeekdays);

  const subTotal = calculateSubTotal(totalHours, bookingRate);
  const bookingFee = hideFees ? 0 : calculateBookingFee(subTotal);
  const processingFee = calculateProcessingFee(subTotal, bookingFee, selectedPaymentMethod);
  const total = hideFees
    ? subTotal
    : calculateTotalCost(subTotal, bookingFee, processingFee, refundAmount);

  const cardHeading =
    Object.keys(weekdays).length > 0 ? (
      <>
        <span className={css.recurringSubheading}>
          {subHeading}
          {hideWeeklyBillingDetails ? null : (
            <PrimaryButton
              className={css.weeklyBillingDetailsButton}
              type="button"
              onClick={() => setIsWeeklyBillingDetailsOpen(true)}
            >
              Weekly Billing Details
            </PrimaryButton>
          )}
        </span>
        <p className={css.startEndDates}>
          {moment(startDate).format('ddd, MMM DD')} - {moment(weekEndDate).format('ddd, MMM DD')}
        </p>
      </>
    ) : null;

  return (
    <BookingSummaryCard
      currentAuthor={currentAuthor}
      className={className}
      hideAvatar={hideAvatar}
      subHeading={cardHeading}
    >
      <div className={css.bookingTimes}>
        {Object.keys(filteredWeekdays)?.map((weekdayKey, index) => {
          const weekday = filteredWeekdays[weekdayKey];

          return (
            <RecurringBookingItem
              weekday={weekday}
              weekdayKey={weekdayKey}
              bookingRate={bookingRate}
              startDate={startDate}
              key={weekdayKey}
            />
          );
        })}
      </div>
      <div className={css.totalContainer}>
        {totalHours ? (
          <div className={css.totalCalc}>
            <div className={css.spread}>
              <h4 className={css.paymentCalc}>
                <span style={{ paddingRight: '0.5rem' }}>
                  {totalHours} hours x ${bookingRate}
                </span>
                {!hideRatesButton ? (
                  <InlineTextButton
                    className={css.changeRateButton}
                    onClick={() => setIsChangeRatesModalOpen(true)}
                    type="button"
                  >
                    Change Hourly Rate
                  </InlineTextButton>
                ) : null}
              </h4>

              <h4 className={css.paymentCalc}>${subTotal}</h4>
            </div>
            {!hideFees ? (
              <>
                <div className={css.spread}>
                  <h4 className={css.paymentCalc}>CareVine Service Fee</h4>
                  <h4 className={css.paymentCalc}>${bookingFee}</h4>
                </div>
                <div className={css.spread}>
                  <h4 className={css.paymentCalc}>Processing Fee</h4>
                  <h4 className={css.paymentCalc}>${processingFee}</h4>
                </div>
                {refundAmount && refundAmount > 0 ? (
                  <div className={css.spread}>
                    <h4 className={css.paymentCalc} style={{ color: 'var(--failColor)' }}>
                      Refunded
                    </h4>
                    <h4 className={css.paymentCalc} style={{ color: 'var(--failColor)' }}>
                      ${refundAmount}
                    </h4>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}
        <div className={css.spread}>
          <h3 className={css.total}>Total:</h3>
          <h3 className={css.total}>${total}</h3>
        </div>
      </div>
      {isChangeRatesModalOpen ? (
        <ChangeRatesModal
          isOpen={isChangeRatesModalOpen}
          bookingRate={bookingRate}
          form={form}
          onManageDisableScrolling={onManageDisableScrolling}
          minPrice={listing.attributes.publicData.minPrice ?? 1500}
          formValues={formValues}
          onClose={() => setIsChangeRatesModalOpen(false)}
        />
      ) : null}
      {isWeeklyBillingDetailsOpen ? (
        <Modal
          id="WeeklyBillingDetails"
          isOpen={isWeeklyBillingDetailsOpen}
          onClose={() => setIsWeeklyBillingDetailsOpen(false)}
          onManageDisableScrolling={onManageDisableScrolling}
          usePortal
        >
          <p className={css.modalTitle}>Weekly Billing Breakdown</p>
          <p className={css.modalMessage}>
            Click any week in your booking to view the billing details for that week.
          </p>
          <div className={css.weeklyBillingDetails}>
            <WeeklyBillingDetails
              bookedDates={bookedDates}
              bookedDays={bookedDays}
              bookingSchedule={weekdays}
              exceptions={exceptions}
              startDate={startDate}
              endDate={bookingEndDate}
              currentAuthor={currentAuthor}
              bookingRate={bookingRate}
              listing={listing}
              onManageDisableScrolling={onManageDisableScrolling}
              selectedPaymentMethodType={selectedPaymentMethod.type}
            />
          </div>
        </Modal>
      ) : null}
    </BookingSummaryCard>
  );
};

export default RecurringBookingSummaryCard;
