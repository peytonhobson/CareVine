import React from 'react';

import { useMediaQuery } from '@mui/material';
import { addTimeToStartOfDay } from '../../util/dates';
import { convertTimeFrom12to24 } from '../../util/data';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import { BOOKING_FEE_PERCENTAGE } from '../../util/constants';

import css from './BookingSummaryCard.module.css';

const calculateTimeBetween = (bookingStart, bookingEnd) => {
  const start = convertTimeFrom12to24(bookingStart).split(':')[0];
  const end = bookingEnd === '12:00am' ? 24 : convertTimeFrom12to24(bookingEnd).split(':')[0];

  return end - start;
};

const filterFiftyPercentRefund = lineItems =>
  lineItems
    ?.filter(l => {
      const differenceInHours = addTimeToStartOfDay(l.date, l.startTime) - moment().toDate();
      return differenceInHours < 48 * 36e5 && differenceInHours > 0;
    })
    .map(l => ({ ...l, amount: l.amount / 2 }));

const filterFullRefund = lineItems =>
  lineItems?.filter(l => {
    const startTime = addTimeToStartOfDay(l.date, l.startTime);
    return startTime - moment().toDate() > 48 * 36e5;
  });

const RefundBookingSummaryCard = props => {
  const { lineItems, className, subHeading } = props;

  const isLarge = useMediaQuery('(min-width:1024px)');

  const fiftyPercentRefund = filterFiftyPercentRefund(lineItems) ?? [];
  const fullRefund = filterFullRefund(lineItems) ?? [];
  const subTotal =
    fiftyPercentRefund.reduce((acc, curr) => acc + parseFloat(curr.amount), 0) +
    fullRefund.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
  const bookingFee = parseFloat(subTotal * BOOKING_FEE_PERCENTAGE).toFixed(2);
  const total = subTotal + Number(bookingFee);

  return (
    <div
      className={className || (!isLarge ? css.detailsContainerMobile : css.detailsContainerDesktop)}
    >
      <div className={css.summaryDetailsContainer}>
        <div className={css.detailsHeadings}>
          <h2 className={css.detailsTitle}>{subHeading || 'Refund Summary'}</h2>
        </div>
        <div className={css.bookingTimes}>
          {fiftyPercentRefund.map((lineItem, index) => {
            const date = moment(lineItem.date).format('MM/DD');
            const { startTime, endTime, amount } = lineItem;

            return startTime && endTime ? (
              <div className={css.bookingTime} key={uuidv4()}>
                <h3 className={css.summaryDate}>
                  {date} - ${parseFloat(amount).toFixed(2)} (50% refund)
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
          {fullRefund.map((lineItem, index) => {
            const date = moment(lineItem.date).format('MM/DD');
            const { startTime, endTime, amount } = lineItem;

            return startTime && endTime ? (
              <div className={css.bookingTime} key={uuidv4()}>
                <h3 className={css.summaryDate}>
                  {date} - ${parseFloat(amount).toFixed(2)} (100% refund)
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
          <div className={css.totalCalc}>
            <h4 className={css.paymentCalc}>
              +2% Booking fee refund - ${parseFloat(bookingFee).toFixed(2)}
            </h4>
          </div>
          <h3 className={css.total}>Total Refund: ${parseFloat(total).toFixed(2)}</h3>
        </div>
      </div>
    </div>
  );
};

export default RefundBookingSummaryCard;
