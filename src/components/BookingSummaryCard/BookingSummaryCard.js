import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';

import { Form as FinalForm } from 'react-final-form';
import {
  Avatar,
  IconArrowHead,
  InlineTextButton,
  Modal,
  Form,
  FieldRangeSlider,
  Button,
  ButtonTabNavHorizontal,
} from '../../components';
import classNames from 'classnames';
import { useMediaQuery } from '@mui/material';
import { convertTimeFrom12to24, calculateProcessingFee } from '../../util/data';
import BookingItems from './BookingItems';
import moment from 'moment';
import { addTimeToStartOfDay } from '../../util/dates';

import css from './BookingSummaryCard.module.css';

const TRANSACTION_FEE = 0.05;
const weekdayMap = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

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

const calculateRecurringTotalHours = weekdays =>
  Object.keys(weekdays)?.reduce(
    (acc, curr) =>
      acc +
      (weekdays[curr]?.[0].startTime && weekdays[curr]?.[0].endTime
        ? calculateTimeBetween(weekdays[curr]?.[0].startTime, weekdays[curr]?.[0].endTime)
        : 0),
    0
  );

const calculateBookingFee = subTotal => parseFloat(Number(subTotal) * TRANSACTION_FEE).toFixed(2);

const calculateSubTotal = (totalHours, bookingRate, lineItems) => {
  if (lineItems?.length > 0) {
    return parseFloat(
      lineItems.reduce((acc, lineItem) => {
        const { startTime, date, amount } = lineItem;

        const differenceInHours = addTimeToStartOfDay(date, startTime) - moment().toDate();
        const isInFuture = differenceInHours > 0;
        const isFifty = differenceInHours < 48 * 36e5 && isInFuture;
        const refund = isFifty ? 0.5 : 1;

        return acc + refund * amount;
      }, 0)
    ).toFixed(2);
  }

  return parseFloat(totalHours * Number(bookingRate)).toFixed(2);
};

const calculateTotalCost = (subTotal, bookingFee, processingFee, refundAmount = 0) =>
  parseFloat(
    Number(subTotal) + Number(bookingFee) + Number(processingFee) - Number(refundAmount)
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
    selectedPaymentMethod,
    className,
    hideAvatar,
    subHeading,
    hideRatesButton,
    hideFees,
    refundAmount,
    weekdays = [],
    startDate,
    endDate,
    lineItems: allLineItems,
  } = props;

  const isLarge = useMediaQuery('(min-width:1024px)');
  const [showArrow, setShowArrow] = useState(false);
  const [isChangeRatesModalOpen, setIsChangeRatesModalOpen] = useState(false);
  const [showFullWeek, setShowFullWeek] = useState(false);

  const heightRef = useRef(null);

  const lineItems = allLineItems?.filter(lineItem => {
    const { startTime, date } = lineItem;

    const differenceInHours = addTimeToStartOfDay(date, startTime) - moment().toDate();
    const isInFuture = differenceInHours > 0;

    return isInFuture;
  });

  const filteredWeekdays = useMemo(() => {
    const keys = Object.keys(weekdays);

    if (!keys.length) return {};

    return Object.keys(weekdays)?.reduce((acc, weekdayKey) => {
      const bookingDate = moment(startDate).weekday(weekdayMap[weekdayKey]);

      return bookingDate >= startDate || showFullWeek
        ? { ...acc, [weekdayKey]: weekdays[weekdayKey] }
        : acc;
    }, {});
  }, [weekdays, startDate, showFullWeek]);

  const cardRef = useCallback(node => {
    if (node !== null && window.innerWidth >= 1024) {
      heightRef.current = node;
      node.addEventListener('scroll', () => {
        const isTop = node.scrollTop === 0;
        setShowArrow(isTop);
      });

      const resizeObserver = new ResizeObserver(() => {
        const isTop = node.scrollTop === 0;
        setShowArrow(isTop);
      });
      resizeObserver.observe(node);
    }
  }, []);

  const scrollToBottom = () => {
    if (heightRef.current) {
      // Smooth scroll to bottom
      heightRef.current.scrollTo({
        top: heightRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  let itemType = 'single';

  if (lineItems && lineItems.length > 0) {
    itemType = 'refund';
  } else if (filteredWeekdays && Object.keys(filteredWeekdays).length > 0) {
    itemType = 'recurring';
  }

  const totalHours = selectedBookingTimes
    ? calculateTotalHours(selectedBookingTimes)
    : Object.keys(filteredWeekdays)?.length > 0
    ? calculateRecurringTotalHours(filteredWeekdays)
    : lineItems?.length > 0
    ? calculateTotalHours(lineItems)
    : 0;

  const subTotal = calculateSubTotal(totalHours, bookingRate, lineItems);
  const bookingFee = hideFees ? 0 : calculateBookingFee(subTotal);
  const processingFee =
    itemType === 'refund' ? 0 : calculateProcessingFee(subTotal, bookingFee, selectedPaymentMethod);
  const total = hideFees
    ? subTotal
    : calculateTotalCost(subTotal, bookingFee, processingFee, refundAmount);

  const recurringTabs = [
    {
      text: 'First Week',
      selected: !showFullWeek,
      onClick: () => setShowFullWeek(false),
    },
    {
      text: 'Full Week',
      selected: showFullWeek,
      onClick: () => setShowFullWeek(true),
    },
  ];

  return (
    <div
      className={classNames(
        !isLarge ? css.detailsContainerMobile : css.detailsContainerDesktop,
        className
      )}
      ref={cardRef}
    >
      {!hideAvatar && itemType !== 'refund' ? (
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
      {itemType === 'recurring' ? (
        <>
          <div className={css.startEnd}>
            <p>Start Date: {moment(startDate).format('MM/DD/YYYY')}</p>
            {endDate ? <p>End Date: {moment(endDate).format('MM/DD/YYYY')}</p> : null}
          </div>
          <ButtonTabNavHorizontal
            className={css.tabNav}
            tabNavClassName={css.tabNav}
            tabs={recurringTabs}
          />
        </>
      ) : null}
      <div className={css.summaryDetailsContainer}>
        <div className={css.detailsHeadings}>
          <h2 className={css.detailsTitle}>
            {subHeading || `${itemType === 'refund' ? 'Refund' : 'Booking'} Summary`}
          </h2>
        </div>
        <div className={css.bookingTimes}>
          <BookingItems
            bookingDates={bookingDates}
            selectedBookingTimes={selectedBookingTimes}
            bookingRate={bookingRate}
            weekdays={filteredWeekdays}
            startDate={startDate}
            showFullWeek={showFullWeek}
            itemType={itemType}
            lineItems={lineItems}
          />
        </div>
        <div className={css.totalContainer}>
          {totalHours ? (
            <div className={css.totalCalc}>
              {itemType !== 'refund' ? (
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
              ) : null}
              {!hideFees ? (
                <>
                  <div className={css.spread}>
                    <h4 className={css.paymentCalc}>
                      CareVine Service Fee {itemType === 'refund' && 'Refund'}
                    </h4>
                    <h4 className={css.paymentCalc}>${bookingFee}</h4>
                  </div>
                  {itemType !== 'refund' ? (
                    <div className={css.spread}>
                      <h4 className={css.paymentCalc}>Processing Fee</h4>
                      <h4 className={css.paymentCalc}>${processingFee}</h4>
                    </div>
                  ) : null}
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
            <h3 className={css.total}>Total {itemType === 'refund' && 'Refund'}:</h3>
            <h3 className={css.total}>${total}</h3>
          </div>
        </div>
      </div>
      {showArrow ? (
        <IconArrowHead
          direction="down"
          height="1.5em"
          width="1.5em"
          className={css.arrow}
          onClick={scrollToBottom}
        />
      ) : null}
      {!hideRatesButton && itemType !== 'refund' ? (
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
  );
};

export default BookingSummaryCard;
