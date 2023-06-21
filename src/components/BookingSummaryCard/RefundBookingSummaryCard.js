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
import { convertTimeFrom12to24 } from '../../util/data';
import { v4 as uuidv4 } from 'uuid';

import css from './BookingSummaryCard.module.css';
import moment from 'moment';

const CREDIT_CARD = 'Payment Card';
const TRANSACTION_FEE = 0.05;
const CARD_FEE = 0.03;

const calculateTimeBetween = (bookingStart, bookingEnd) => {
  const start = convertTimeFrom12to24(bookingStart).split(':')[0];
  const end = bookingEnd === '12:00am' ? 24 : convertTimeFrom12to24(bookingEnd).split(':')[0];

  return end - start;
};

const filterFiftyPercentRefund = lineItems =>
  lineItems
    .filter(l => {
      const startTimeHours = parseInt(convertTimeFrom12to24(l.startTime).split(':')[0], 10);
      const differenceInHours = moment(l.date).add(startTimeHours, 'hours') - moment();
      return differenceInHours < 72 && differenceInHours > 0;
    })
    .map(l => ({ ...l, amount: l.amount / 2 }));

const filterFullRefund = lineItems =>
  lineItems.filter(l => {
    const startTimeHours = parseInt(convertTimeFrom12to24(l.startTime).split(':')[0], 10);
    return moment(l.date).add(startTimeHours, 'hours') - moment() > 72;
  });

const RefundBookingSummaryCard = props => {
  const { lineItems, className, subHeading } = props;

  const isLarge = useMediaQuery('(min-width:1024px)');

  const fiftyPercentRefund = filterFiftyPercentRefund(lineItems);
  const fullRefund = filterFullRefund(lineItems);
  const subTotal =
    fiftyPercentRefund.reduce((acc, curr) => acc + curr.amount, 0) +
    fullRefund.reduce((acc, curr) => acc + curr.amount, 0);
  const bookingFee = subTotal * TRANSACTION_FEE;
  const total = subTotal + bookingFee;

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
                  {date} - ${amount} (50% refund)
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
                  {date} - ${amount} (100% refund)
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
            <h4 className={css.paymentCalc}>+5% transaction fee refund - ${bookingFee}</h4>
          </div>
          <h3 className={css.total}>Total Refund: ${total}</h3>
        </div>
      </div>
    </div>
  );
};

export default RefundBookingSummaryCard;
