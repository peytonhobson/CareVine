import React, { useState, useRef } from 'react';

import { Form as FinalForm } from 'react-final-form';
import {
  AvatarLarge,
  IconArrowHead,
  InlineTextButton,
  Modal,
  Form,
  FieldRangeSlider,
  Button,
} from '../../components';
import { convertTimeFrom12to24 } from '../../util/data';
import { useCheckMobileScreen, useIsScrollable } from '../../util/hooks';

import css from './CheckoutPage.module.css';

const calculateTimeBetween = (bookingStart, bookingEnd) => {
  const start = convertTimeFrom12to24(bookingStart).split(':')[0];
  const end = bookingEnd === '12:00am' ? 24 : convertTimeFrom12to24(bookingEnd).split(':')[0];

  return end - start;
};

const calculateTotalHours = bookingTimes =>
  bookingTimes.reduce(
    (acc, curr) =>
      acc +
      (curr.startTime && curr.endTime ? calculateTimeBetween(curr.startTime, curr.endTime) : 0),
    0
  );

const calculateCost = (bookingStart, bookingEnd, price) =>
  calculateTimeBetween(bookingStart, bookingEnd) * price;

const calculateTransactionFee = (subTotal, transactionFee = 0.05) =>
  Number(Number.parseFloat(subTotal * transactionFee).toFixed(2));

const calculateSubTotal = (bookingTimes, bookingRate) =>
  bookingTimes.reduce(
    (acc, curr) =>
      acc +
      (curr.startTime && curr.endTime
        ? calculateCost(curr.startTime, curr.endTime, bookingRate)
        : 0),
    0
  );

const calculateTotalCost = (subTotal, transactionFee) =>
  Number.parseFloat(subTotal + transactionFee).toFixed(2);

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
  } = props;
  const totalHours = calculateTotalHours(selectedBookingTimes);
  const isMobile = useCheckMobileScreen();

  const [bookingTimesScrolled, setBookingTimesScrolled] = useState(0);
  const [isChangeRatesModalOpen, setIsChangeRatesModalOpen] = useState(false);

  const bookingTimesRef = useRef(null);

  const scrollToBottom = () => {
    if (bookingTimesRef.current) {
      bookingTimesRef.current.scrollTop = bookingTimesRef.current.scrollHeight;
    }
  };

  const scrollToTop = () => {
    if (bookingTimesRef.current) {
      bookingTimesRef.current.scrollTop = 0;
    }
  };

  const isScrollable = useIsScrollable(bookingTimesRef);
  const isAtBottom =
    bookingTimesScrolled >=
    bookingTimesRef.current?.scrollHeight - bookingTimesRef.current?.clientHeight;

  const subTotal = calculateSubTotal(selectedBookingTimes, bookingRate);
  const transactionFee = calculateTransactionFee(subTotal);

  return (isMobile && displayOnMobile) || (!isMobile && !displayOnMobile) ? (
    <div className={isMobile ? css.detailsContainerMobile : css.detailsContainerDesktop}>
      <div className={css.cardAvatarWrapper}>
        <AvatarLarge user={currentAuthor} disableProfileLink className={css.cardAvatar} />
        <span className={css.bookAuthor}>
          Book <span style={{ whiteSpace: 'nowrap' }}>{authorDisplayName}</span>
        </span>
      </div>
      <div className={css.detailsHeadings}>
        <h2 className={css.detailsTitle}>Booking Summary</h2>
      </div>
      <div
        className={css.bookingTimes}
        ref={bookingTimesRef}
        onScroll={() => setBookingTimesScrolled(bookingTimesRef.current.scrollTop)}
      >
        <div className={css.arrowHeadContainer}>
          {isScrollable && isAtBottom && (
            <IconArrowHead direction="up" className={css.arrowHeadDown} onClick={scrollToTop} />
          )}
        </div>
        {bookingDates.map((bookingDate, index) => {
          const month = bookingDate.getMonth() + 1;
          const day = bookingDate.getDate();
          const bookingTime = selectedBookingTimes.find(b => b.date === `${month}/${day}`) ?? {};
          const date = bookingTime.date;
          const startTime = bookingTime.startTime;
          const endTime = bookingTime.endTime;

          return startTime && endTime ? (
            <div className={css.bookingTime} key={bookingTime.date}>
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
        {isScrollable && !bookingTimesScrolled && (
          <IconArrowHead direction="down" className={css.arrowHeadUp} onClick={scrollToBottom} />
        )}
      </div>
      <div className={css.totalContainer}>
        {totalHours ? (
          <div className={css.totalCalc}>
            <h4 className={css.paymentCalc}>
              {totalHours} hours x ${bookingRate} - ${subTotal}
              <InlineTextButton
                className={css.changeRateButton}
                onClick={() => setIsChangeRatesModalOpen(true)}
              >
                Change Hourly Rate
              </InlineTextButton>
            </h4>
            <h4 className={css.paymentCalc}>+5% transaction fee - ${transactionFee}</h4>
          </div>
        ) : null}
        <h3 className={css.total}>Total: ${calculateTotalCost(subTotal, transactionFee)}</h3>
      </div>
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
            const { minPrice, maxPrice } = listing.attributes.publicData;

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
    </div>
  ) : null;
};

export default BookingSummaryCard;
