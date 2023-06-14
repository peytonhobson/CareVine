import React, { useState, useRef } from 'react';

import classNames from 'classnames';
import { makeStyles } from '@material-ui/core/styles';
import {
  Typography,
  Box,
  Card,
  CardActionArea,
  CardActions,
  CardMedia,
  CardContent,
  Avatar,
  CardHeader,
} from '@material-ui/core';
import { useIsScrollable } from '../../util/hooks';
import { convertTimeFrom12to24 } from '../../util/data';

import css from './BookingConfirmationCard.module.css';

const useStyles = makeStyles(theme => ({
  card: {
    maxWidth: '30rem',
  },
  media: {
    height: '12rem',
  },
  cardActions: {
    display: 'flex',
    margin: '0 10px',
    justifyContent: 'space-between',
  },
  cardDescription: {
    height: '4.5rem',
    marginTop: '1rem',
  },
  cardTitle: {
    height: '6rem',
  },
  author: {
    display: 'flex',
  },
}));

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

const calculateTransactionFee = subTotal => Number(Number.parseFloat(subTotal * 0.05).toFixed(2));

const calculateCost = (bookingStart, bookingEnd, price) =>
  calculateTimeBetween(bookingStart, bookingEnd) * price;

const calculateCardFee = subTotal => Number(Number.parseFloat(subTotal * 0.03).toFixed(2));

const calculateSubTotal = (bookingTimes, bookingRate) =>
  bookingTimes.reduce(
    (acc, curr) =>
      acc +
      (curr.startTime && curr.endTime
        ? calculateCost(curr.startTime, curr.endTime, bookingRate)
        : 0),
    0
  );

const calculateTotalCost = (subTotal, transactionFee, cardFee) =>
  Number.parseFloat(subTotal + transactionFee + cardFee).toFixed(2);

const BookingConfirmationCard = props => {
  const { authorDisplayName, className, transaction } = props;

  const {
    bookingDates,
    bookingTimes: origBookingTimes,
    bookingRate,
    paymentMethodType,
  } = transaction.attributes.metadata;

  const bookingTimes = Object.keys(origBookingTimes).map(key => ({
    date: key,
    startTime: origBookingTimes[key].startTime,
    endTime: origBookingTimes[key].endTime,
  }));

  const [bookingTimesScrolled, setBookingTimesScrolled] = useState(0);
  const startDate = bookingDates.sort((a, b) => new Date(a) - new Date(b))[0];
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

  return (
    <div className={css.root}>
      <h2 className={css.newBookingRequested}>New Booking Requested!</h2>
      <h2>
        A notification has been sent to {authorDisplayName}. They have either 72 hours from now or
        until the booking starts to accept your request.
      </h2>
      {/* <BookingSummaryCard */}
    </div>
  );
};

export default BookingConfirmationCard;
