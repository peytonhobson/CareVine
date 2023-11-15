import React, { useState, useMemo } from 'react';

import {
  InlineTextButton,
  PrimaryButton,
  Button,
  Modal,
  WeeklyBillingDetails,
  BookingException,
} from '../../../components';
import { calculateProcessingFee } from '../../../util/data';
import moment from 'moment';
import { WEEKDAYS, BOOKING_FEE_PERCENTAGE } from '../../../util/constants';
import RecurringBookingItem from './RecurringBookingItem';
import BookingSummaryCard from '../BookingSummaryCard';
import ChangeRatesModal from '../ChangeRatesModal';
import { sortExceptionsByDate } from '../../../util/bookings';
import { filterWeeklyBookingDays } from '../../../util/bookings';
import { calculateTimeBetween } from '../../../util/dates';

import css from '../BookingSummaryCard.module.css';

const calculateTotalHours = weekdays =>
  weekdays?.reduce((acc, curr) => acc + calculateTimeBetween(curr.startTime, curr.endTime), 0);

const calculateBookingFee = subTotal =>
  parseFloat(Number(subTotal) * BOOKING_FEE_PERCENTAGE).toFixed(2);

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
    className,
    hideAvatar,
    subHeading,
    hideRatesButton,
    hideFees,
    refundAmount,
    startOfWeek,
    hideWeeklyBillingDetails,
    avatarText,
    showWeekly,
    showExceptions,
    hideFullSchedule,
    booking,
  } = props;

  const {
    paymentMethodType,
    bookingSchedule: weekdays = [],
    startDate,
    endDate: bookingEndDate,
    exceptions = { addedDays: [], removedDays: [], changedDays: [] },
    bookingRate,
  } = booking?.attributes.metadata || {};

  const [isChangeRatesModalOpen, setIsChangeRatesModalOpen] = useState(false);
  const [isWeeklyBillingDetailsOpen, setIsWeeklyBillingDetailsOpen] = useState(false);
  const [isExceptionsModalOpen, setIsExceptionsModalOpen] = useState(false);

  const usedExceptions = showWeekly
    ? {
        addedDays: [],
        removedDays: [],
        changedDays: [],
      }
    : exceptions;

  const allExceptions = useMemo(() => {
    return Object.values(exceptions)
      .flat()
      .sort(sortExceptionsByDate);
  }, [exceptions]);

  const filteredWeekdays = useMemo(() => {
    return filterWeeklyBookingDays({
      weekdays,
      startDate: startOfWeek,
      endDate: bookingEndDate,
      exceptions: usedExceptions,
    });
  }, [weekdays, startDate, bookingEndDate, usedExceptions]);

  const totalHours = calculateTotalHours(filteredWeekdays);

  const subTotal = calculateSubTotal(totalHours, bookingRate);
  const bookingFee = hideFees ? 0 : calculateBookingFee(subTotal);
  const processingFee = calculateProcessingFee(subTotal, bookingFee, paymentMethodType);
  const total = hideFees
    ? subTotal
    : calculateTotalCost(subTotal, bookingFee, processingFee, refundAmount);

  const visibleEndDate = showWeekly ? bookingEndDate : moment(startOfWeek).endOf('week');

  const handleOpenModal = func => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
    func(true);
  };

  const cardHeading =
    weekdays.length > 0 ? (
      <>
        <span className={css.recurringSubheading}>
          {subHeading}
          {hideWeeklyBillingDetails ? null : (
            <PrimaryButton
              className={css.weeklyBillingDetailsButton}
              type="button"
              onClick={() => handleOpenModal(setIsWeeklyBillingDetailsOpen)}
            >
              Weekly Billing Details
            </PrimaryButton>
          )}
          {showWeekly && !hideFullSchedule ? (
            <PrimaryButton
              className="min-h-0 py-2 mb-4"
              type="button"
              onClick={() => handleOpenModal(setIsWeeklyBillingDetailsOpen)}
            >
              Full Schedule
            </PrimaryButton>
          ) : null}
          {showExceptions ? (
            <Button
              className="min-h-0 py-2 mb-4"
              type="button"
              onClick={() => handleOpenModal(setIsExceptionsModalOpen)}
            >
              Exceptions
            </Button>
          ) : null}
        </span>
        {showExceptions ? (
          <p className="text-error text-xs mt-0 mb-4">
            This schedule contains exceptions. Please review the full schedule and exceptions before
            accepting.
          </p>
        ) : null}
        <p className={css.startEndDates}>
          {moment(startOfWeek).format('ddd, MMM DD')} -{' '}
          {visibleEndDate ? moment(visibleEndDate).format('ddd, MMM DD') : 'No End Date'}
        </p>
      </>
    ) : null;

  const bookingItems = useMemo(
    () =>
      filteredWeekdays?.map(weekday => {
        const isException = allExceptions.find(e => {
          const momentDate = moment(e.date);

          return (
            moment(startOfWeek).isSameOrBefore(momentDate, 'day') &&
            moment(startOfWeek)
              .endOf('week')
              .isSameOrAfter(momentDate, 'day') &&
            momentDate.weekday() === WEEKDAYS.indexOf(weekday.dayOfWeek)
          );
        });

        return (
          <RecurringBookingItem
            weekday={weekday}
            bookingRate={bookingRate}
            startDate={startOfWeek}
            key={weekday.dayOfWeek}
            showWeekly={showWeekly}
            isException={isException}
          />
        );
      }),
    [filteredWeekdays, bookingRate, startOfWeek, showWeekly, allExceptions]
  );

  return (
    <BookingSummaryCard
      currentAuthor={currentAuthor}
      className={className}
      hideAvatar={hideAvatar}
      subHeading={cardHeading}
      avatarText={avatarText}
      bookingItems={bookingItems}
    >
      <div className={css.totalContainer}>
        {totalHours ? (
          <div className={css.totalCalc}>
            <div className={css.spread}>
              <div className="flex flex-wrap">
                <h4 className={css.paymentCalc}>
                  <span style={{ paddingRight: '0.5rem' }}>
                    {totalHours} hours x ${bookingRate}
                  </span>
                </h4>
                {!hideRatesButton ? (
                  <InlineTextButton
                    className={css.changeRateButton}
                    onClick={() => setIsChangeRatesModalOpen(true)}
                    type="button"
                  >
                    Change Hourly Rate
                  </InlineTextButton>
                ) : null}
              </div>

              <h4 className={css.paymentCalc}>${subTotal}</h4>
            </div>
            {!hideFees ? (
              <>
                <div className={css.spread}>
                  <h4 className={css.paymentCalc}>CareVine Service Fee (2%)</h4>
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
          <h3 className={css.total}>{showWeekly && 'Weekly'} Total:</h3>
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
          <p className={css.modalTitle}>Weekly {showWeekly ? 'Payment' : 'Billing'} Breakdown</p>
          <p className={css.modalMessage}>
            Click any week in your booking to view the {showWeekly ? 'payment' : 'billing'} details
            for that week.
          </p>
          <div className={css.weeklyBillingDetails}>
            <WeeklyBillingDetails
              booking={booking}
              currentAuthor={currentAuthor}
              listing={listing}
              onManageDisableScrolling={onManageDisableScrolling}
              hideFees={hideFees}
              isPayment={showWeekly}
            />
          </div>
        </Modal>
      ) : null}
      {isExceptionsModalOpen ? (
        <Modal
          id="ExceptionsModal"
          isOpen={isExceptionsModalOpen}
          onClose={() => setIsExceptionsModalOpen(false)}
          onManageDisableScrolling={onManageDisableScrolling}
          usePortal
          containerClassName={css.modalContainer}
        >
          <p className={css.modalTitle}>Booking Exceptions</p>
          <p className={css.modalMessage}>
            Listed below are days that are different from the regular booking schedule. Please
            review these exceptions and make sure you're available during those days and times
            before accepting the booking.
          </p>
          <div className={css.exceptions}>
            {allExceptions.map(exception => {
              return (
                <BookingException {...exception} key={exception.date} className={css.exception} />
              );
            })}
          </div>
        </Modal>
      ) : null}
    </BookingSummaryCard>
  );
};

export default RecurringBookingSummaryCard;
