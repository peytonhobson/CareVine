import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';

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
import { useMediaQuery } from '@mui/material';
import { convertTimeFrom12to24, calculateProcessingFee } from '../../util/data';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import classNames from 'classnames';

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

const calculateRecurringTotalHours = weekdays =>
  Object.keys(weekdays)?.reduce(
    (acc, curr) =>
      acc +
      (weekdays[curr]?.[0].startTime && weekdays[curr]?.[0].endTime
        ? calculateTimeBetween(weekdays[curr]?.[0].startTime, weekdays[curr]?.[0].endTime)
        : 0),
    0
  );

const calculateCost = (bookingStart, bookingEnd, price) =>
  parseFloat(calculateTimeBetween(bookingStart, bookingEnd) * Number(price)).toFixed(2);

const calculateTransactionFee = subTotal =>
  parseFloat(Number(subTotal) * TRANSACTION_FEE).toFixed(2);

const calculateSubTotal = (totalHours, bookingRate) => totalHours * Number(bookingRate);

const calculateTotalCost = (subTotal, transactionFee, processingFee, refundAmount = 0) =>
  parseFloat(
    Number(subTotal) + Number(transactionFee) + Number(processingFee) - Number(refundAmount)
  ).toFixed(2);

const RecurringBookingSummaryCard = props => {
  const {
    authorDisplayName,
    currentAuthor,
    weekdays,
    endDate,
    startDate,
    bookingRate,
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

  const [isChangeRatesModalOpen, setIsChangeRatesModalOpen] = useState(false);
  const [showFullWeek, setShowFullWeek] = useState(false);
  const isLarge = useMediaQuery('(min-width:1024px)');
  const [showArrow, setShowArrow] = useState(true);

  const heightRef = useRef(null);
  const clientHeight = heightRef.current?.clientHeight;
  const scrollHeight = heightRef.current?.scrollHeight;

  useEffect(() => {
    if (scrollHeight > clientHeight) {
      setShowArrow(true);
    }
  }, [clientHeight, scrollHeight]);

  const cardRef = useCallback(node => {
    if (node !== null && window.innerWidth >= 1024) {
      node.addEventListener('scroll', () => {
        const isTop = node.scrollTop === 0;
        setShowArrow(isTop);
      });
    }
  }, []);

  const totalHours = calculateTotalHours(filteredWeekdays);

  const subTotal = calculateSubTotal(totalHours, bookingRate);
  const transactionFee = hideFees ? 0 : calculateTransactionFee(subTotal);
  const processingFee = calculateProcessingFee(subTotal, transactionFee, selectedPaymentMethod);
  const total = hideFees
    ? subTotal
    : calculateTotalCost(subTotal, transactionFee, processingFee, refundAmount);

  const tabs = [
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
      {!hideAvatar ? (
        <div className={css.cardAvatarWrapper} style={{ paddingBottom: 0 }}>
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
      <div className={css.startEnd}>
        <p>Start Date: {moment(startDate).format('MM/DD/YYYY')}</p>
        {endDate ? <p>End Date: {moment(endDate).format('MM/DD/YYYY')}</p> : null}
      </div>
      <ButtonTabNavHorizontal className={css.tabNav} tabNavClassName={css.tabNav} tabs={tabs} />
      <div className={css.summaryDetailsContainer}>
        <div className={css.bookingTimes}>
          {Object.keys(filteredWeekdays)?.map((weekdayKey, index) => {
            const weekday = filteredWeekdays[weekdayKey];
            const bookingDate = moment(startDate).weekday(weekdayMap[weekdayKey]);

            const format = showFullWeek ? 'dddd' : 'ddd, MMM Do';

            const formattedBookingDate = bookingDate.format(format);

            const { startTime, endTime } = weekday[0];

            return (
              <div className={css.bookingTime} key={uuidv4()}>
                <h3 className={css.summaryDate}>
                  {formattedBookingDate} - ${calculateCost(startTime, endTime, bookingRate)}{' '}
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
            );
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
                  <h4 className={css.paymentCalc}>CareVine Service fee - ${transactionFee}</h4>
                  <h4 className={css.paymentCalc}>Processing fee - ${processingFee}</h4>
                </>
              ) : null}
            </div>
          ) : null}
          <h3 className={css.total}>Total: ${total}</h3>
        </div>
      </div>
      {showArrow ? (
        <IconArrowHead direction="down" height="1.5em" width="1.5em" className={css.arrow} />
      ) : null}
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
  );
};

export default RecurringBookingSummaryCard;
