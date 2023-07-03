import React, { useState, useRef } from 'react';

import { Form as FinalForm } from 'react-final-form';
import {
  Avatar,
  IconArrowHead,
  InlineTextButton,
  Modal,
  Form,
  FieldRangeSlider,
  Button,
} from '../../components';
import { useMediaQuery } from '@mui/material';
import { convertTimeFrom12to24, calculateProcessingFee } from '../../util/data';
import { v4 as uuidv4 } from 'uuid';

import css from './BookingSummaryCard.module.css';

const TRANSACTION_FEE = 0.05;

const calculateTimeBetween = (bookingStart, bookingEnd) => {
  const start = convertTimeFrom12to24(bookingStart).split(':')[0];
  const end = bookingEnd === '12:00am' ? 24 : convertTimeFrom12to24(bookingEnd).split(':')[0];

  return end - start;
};

const calculateTotalHours = bookingTimes =>
  bookingTimes?.reduce(
    (acc, curr) =>
      acc +
      (curr.startTime && curr.endTime ? calculateTimeBetween(curr.startTime, curr.endTime) : 0),
    0
  );

const calculateCost = (bookingStart, bookingEnd, price) =>
  parseFloat(calculateTimeBetween(bookingStart, bookingEnd) * Number(price)).toFixed(2);

const calculateTransactionFee = subTotal =>
  parseFloat(Number(subTotal) * TRANSACTION_FEE).toFixed(2);

const calculateSubTotal = (bookingTimes, bookingRate) =>
  bookingTimes
    ?.reduce(
      (acc, curr) =>
        acc +
        (curr.startTime && curr.endTime
          ? Number(calculateCost(curr.startTime, curr.endTime, bookingRate))
          : 0),
      0
    )
    .toFixed(2);

const calculateTotalCost = (subTotal, transactionFee, processingFee, refundAmount = 0) =>
  parseFloat(
    Number(subTotal) + Number(transactionFee) + Number(processingFee) - Number(refundAmount)
  ).toFixed(2);

const BookingSummaryCard = props => {
  const {
    authorDisplayName,
    currentAuthor,
    selectedBookingTimes,
    bookingRate,
    bookingDates,
    listing,
    onManageDisableScrolling,
    onSetState,
    displayOnMobile,
    selectedPaymentMethod,
    className,
    hideAvatar,
    subHeading,
    hideRatesButton,
    hideFees,
    refundAmount,
  } = props;
  const totalHours = calculateTotalHours(selectedBookingTimes);

  const [isChangeRatesModalOpen, setIsChangeRatesModalOpen] = useState(false);

  const subTotal = calculateSubTotal(selectedBookingTimes, bookingRate);
  const transactionFee = hideFees ? 0 : calculateTransactionFee(subTotal);
  const processingFee = calculateProcessingFee(subTotal, transactionFee, selectedPaymentMethod);
  const total = hideFees
    ? subTotal
    : calculateTotalCost(subTotal, transactionFee, processingFee, refundAmount);
  const isLarge = useMediaQuery('(min-width:1024px)');

  return (!isLarge && displayOnMobile) || (isLarge && !displayOnMobile) ? (
    <div
      className={className || (!isLarge ? css.detailsContainerMobile : css.detailsContainerDesktop)}
    >
      {!hideAvatar ? (
        <div className={css.cardAvatarWrapper}>
          <Avatar
            user={currentAuthor}
            disableProfileLink
            className={css.cardAvatar}
            initialsClassName={css.cardAvatarInitials}
          />
          <div>
            <span className={!isLarge ? css.bookAuthorMobile : css.bookAuthor}>
              Book <span style={{ whiteSpace: 'nowrap' }}>{authorDisplayName}</span>
            </span>
          </div>
        </div>
      ) : null}
      <div className={css.summaryDetailsContainer}>
        <div className={css.detailsHeadings}>
          <h2 className={css.detailsTitle}>{subHeading || 'Booking Summary'}</h2>
        </div>
        <div className={css.bookingTimes}>
          {bookingDates?.map((bookingDate, index) => {
            const month = new Date(bookingDate).getMonth() + 1;
            const day = new Date(bookingDate).getDate();
            const bookingTime = selectedBookingTimes.find(b => b.date === `${month}/${day}`) ?? {};
            const date = bookingTime.date;
            const startTime = bookingTime.startTime;
            const endTime = bookingTime.endTime;

            return startTime && endTime ? (
              <div className={css.bookingTime} key={uuidv4()}>
                <h3 className={css.summaryDate}>
                  {date} - ${calculateCost(startTime, endTime, bookingRate)}{' '}
                </h3>
                <div className={css.summaryTimeContainer}>
                  <span className={css.summaryTimes}>
                    {startTime} - {endTime}
                  </span>
                  <p className={css.tinyNoMargin}>
                    ({calculateTimeBetween(startTime, endTime)} hours)
                  </p>
                </div>
              </div>
            ) : null;
          })}
        </div>
        <div className={css.totalContainer}>
          {totalHours ? (
            <div className={css.totalCalc}>
              <h4 className={css.paymentCalc}>
                <span style={{ paddingRight: '1rem' }}>
                  {totalHours} hours x ${bookingRate} - ${subTotal}
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
              {!hideFees ? (
                <>
                  <h4 className={css.paymentCalc}>+5% Booking fee - ${transactionFee}</h4>
                  <h4 className={css.paymentCalc}>+ Processing fee - ${processingFee}</h4>
                  {refundAmount && refundAmount > 0 ? (
                    <h4 className={css.paymentCalc} style={{ color: 'var(--failColor)' }}>
                      Refunded - ${refundAmount}
                    </h4>
                  ) : null}
                </>
              ) : null}
            </div>
          ) : null}
          <h3 className={css.total}>Total: ${total}</h3>
        </div>
      </div>
      {!hideRatesButton ? (
        <Modal
          id="changeRatesModal"
          isOpen={isChangeRatesModalOpen}
          onClose={() => setIsChangeRatesModalOpen(false)}
          onManageDisableScrolling={onManageDisableScrolling}
          usePortal
          containerClassName={css.modalContainer}
        >
          <FinalForm
            className={css.changeRatesForm}
            onSubmit={values => {
              onSetState({ bookingRate: values.bookingRate[0] });
              setIsChangeRatesModalOpen(false);
            }}
            initialValues={{ bookingRate: [bookingRate] }}
            render={fieldRenderProps => {
              const { handleSubmit, pristine, invalid, values } = fieldRenderProps;
              const { minPrice } = listing?.attributes.publicData;

              return (
                <Form onSubmit={handleSubmit}>
                  <h2 className={css.fieldLabel}>Choose an hourly rate:</h2>
                  <h1 className={css.fieldLabel} style={{ marginBottom: 0 }}>
                    ${values.bookingRate}
                  </h1>
                  <div className={css.availableRatesContainer}>
                    <p>${minPrice / 100}</p>
                    <p>$50</p>
                  </div>
                  <FieldRangeSlider
                    id="bookingRate"
                    name="bookingRate"
                    className={css.priceRange}
                    trackClass={css.track}
                    min={minPrice / 100}
                    max={50}
                    step={1}
                    handles={values.bookingRate}
                    noHandleLabels
                  />
                  <Button
                    type="submit"
                    disabled={pristine || invalid}
                    className={css.submitRateButton}
                  >
                    Save Rate
                  </Button>
                </Form>
              );
            }}
          />
        </Modal>
      ) : null}
    </div>
  ) : null;
};

export default BookingSummaryCard;
