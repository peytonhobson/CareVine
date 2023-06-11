import React from 'react';

import { AvatarLarge, IconArrowHead } from '../../components';
import { convertTimeFrom12to24 } from '../../util/data';
import { useIsScrollable } from '../../util/hooks';

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

const calculateTotalCost = (bookingTimes, bookingRate) =>
  bookingTimes.reduce(
    (acc, curr) =>
      acc +
      (curr.startTime && curr.endTime
        ? calculateCost(curr.startTime, curr.endTime, bookingRate)
        : 0),
    0
  );

const BookingSummaryCard = props => {
  const {
    authorDisplayName,
    currentAuthor,
    selectedBookingTimes,
    bookingRate,
    bookingDates,
  } = props;
  const totalHours = calculateTotalHours(selectedBookingTimes);

  const [bookingTimesScrolled, setBookingTimesScrolled] = React.useState(0);

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

  const bookingTimesRef = React.useRef(null);

  const isScrollable = useIsScrollable(bookingTimesRef);
  const isAtBottom =
    bookingTimesScrolled >=
    bookingTimesRef.current?.scrollHeight - bookingTimesRef.current?.clientHeight;

  return (
    <div className={css.detailsContainerDesktop}>
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
          const month = new Date(bookingDate).getMonth() + 1;
          const day = new Date(bookingDate).getDate();
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
                <p className={css.dateCostText}>
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
          <h3>
            {totalHours} hours x ${bookingRate}
          </h3>
        ) : null}
        <h3>Total: ${calculateTotalCost(selectedBookingTimes, bookingRate)}</h3>
      </div>
    </div>
  );
};

export default BookingSummaryCard;
