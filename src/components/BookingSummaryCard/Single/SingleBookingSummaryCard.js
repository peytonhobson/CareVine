import React, { useState, useMemo } from 'react';

import { InlineTextButton } from '../..';
import { calculateProcessingFee } from '../../../util/data';
import BookingSummaryCard from '../BookingSummaryCard';
import ChangeRatesModal from '../ChangeRatesModal';
import SingleBookingItem from './SingleBookingItem';
import { calculateTimeBetween } from '../../../util/dates';

import css from '../BookingSummaryCard.module.css';

const TRANSACTION_FEE = 0.05;

const calculateTotalHours = bookingTimes =>
  bookingTimes?.reduce(
    (acc, curr) =>
      acc +
      (curr.startTime && curr.endTime ? calculateTimeBetween(curr.startTime, curr.endTime) : 0),
    0
  );

const calculateBookingFee = subTotal => parseFloat(Number(subTotal) * TRANSACTION_FEE).toFixed(2);

const calculateSubTotal = (totalHours, bookingRate) => {
  return parseFloat(totalHours * Number(bookingRate)).toFixed(2);
};

const calculateTotalCost = (subTotal, bookingFee, processingFee, refundAmount = 0) =>
  parseFloat(
    Number(subTotal) + Number(bookingFee) + Number(processingFee) - Number(refundAmount)
  ).toFixed(2);

const SingleBookingSummaryCard = props => {
  const {
    currentAuthor,
    formValues,
    form,
    listing,
    onManageDisableScrolling,
    className,
    hideAvatar,
    hideRatesButton,
    hideFees,
    refundAmount,
    subHeading,
    booking,
  } = props;

  const { bookingRate, lineItems, paymentMethodType } = booking?.attributes.metadata || {};

  const [isChangeRatesModalOpen, setIsChangeRatesModalOpen] = useState(false);

  const bookingTimes = useMemo(
    () =>
      lineItems?.map(l => ({
        date: `${new Date(l.date).getMonth() + 1}/${new Date(l.date).getDate()}`,
        startTime: l.startTime,
        endTime: l.endTime,
      })),
    [lineItems]
  );
  const totalHours = calculateTotalHours(bookingTimes);

  const subTotal = calculateSubTotal(totalHours, bookingRate);
  const bookingFee = hideFees ? 0 : calculateBookingFee(subTotal);
  const processingFee = calculateProcessingFee(subTotal, bookingFee, paymentMethodType);
  const total = hideFees
    ? subTotal
    : calculateTotalCost(subTotal, bookingFee, processingFee, refundAmount);

  return (
    <BookingSummaryCard
      currentAuthor={currentAuthor}
      className={className}
      hideAvatar={hideAvatar}
      subHeading={subHeading}
    >
      <div className={css.bookingTimes}>
        {bookingTimes?.map(bookingTime => (
          <SingleBookingItem
            bookingTime={bookingTime}
            bookingRate={bookingRate}
            key={bookingTime.date}
          />
        ))}
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
    </BookingSummaryCard>
  );
};

export default SingleBookingSummaryCard;
