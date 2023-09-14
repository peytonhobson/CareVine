import React, { useState, useMemo } from 'react';

import { InlineTextButton, PrimaryButton, Modal, WeeklyBillingDetails } from '../../../components';
import { convertTimeFrom12to24, calculateProcessingFee } from '../../../util/data';
import moment from 'moment';
import { WEEKDAY_MAP, WEEKDAYS } from '../../../util/constants';
import RecurringBookingItem from './RecurringBookingItem';
import BookingSummaryCard from '../BookingSummaryCard';
import ChangeRatesModal from '../ChangeRatesModal';

import css from '../BookingSummaryCard.module.css';
import { filterWeeklyBookingDays } from '../../../util/bookings';

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
    blockedDays,
    blockedDates,
    bookingRate,
    hideWeeklyBillingDetails,
    avatarText,
  } = props;

  const [isChangeRatesModalOpen, setIsChangeRatesModalOpen] = useState(false);
  const [isWeeklyBillingDetailsOpen, setIsWeeklyBillingDetailsOpen] = useState(false);

  const filteredWeekdays = useMemo(() => {
    return filterWeeklyBookingDays({
      weekdays,
      startDate,
      endDate: bookingEndDate,
      exceptions,
      blockedDays,
      blockedDates,
    });
  }, [weekdays, startDate, bookingEndDate, exceptions, blockedDays, blockedDates]);

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
      avatarText={avatarText}
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
              blockedDates={blockedDates}
              blockedDays={blockedDays}
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
