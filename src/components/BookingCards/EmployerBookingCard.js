import React, { useState } from 'react';

import { Avatar, Button, CancelButton, SecondaryButton } from '..';
import { convertTimeFrom12to24 } from '../../util/data';
import TablePagination from '@mui/material/TablePagination';

import css from './BookingCards.module.css';

const calculateBookingDayHours = (bookingStart, bookingEnd) => {
  const start = convertTimeFrom12to24(bookingStart).split(':')[0];
  const end = bookingEnd === '12:00am' ? 24 : convertTimeFrom12to24(bookingEnd).split(':')[0];

  return end - start;
};

const calculateBookingDayCost = (bookingStart, bookingEnd, price) =>
  calculateBookingDayHours(bookingStart, bookingEnd) * price;

const EmployerBookingCard = props => {
  const [bookingTimesPage, setBookingTimesPage] = useState(0);

  const { booking, currentUser } = props;

  const { provider } = booking;

  const bookingMetadata = booking.attributes.metadata;
  const { bookingRate, lineItems } = bookingMetadata;

  const handleChangeTimesPage = (e, page) => {
    setBookingTimesPage(page);
  };

  const providerDisplayName = provider.attributes.profile.displayName;

  const bookingTimes = lineItems?.map(l => ({
    date: `${new Date(l.date).getMonth() + 1}/${new Date(l.date).getDate()}`,
    startTime: l.startTime,
    endTime: l.endTime,
  }));
  const totalHours = bookingTimes?.reduce(
    (acc, curr) => acc + calculateBookingDayHours(curr.startTime, curr.endTime),
    0
  );
  const totalPayment = lineItems?.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className={css.bookingCard}>
      <div className={css.header}>
        <div className={css.bookingTitle}>
          <Avatar user={provider} disableProfileLink className={css.avatar} />
          <div>
            <h2 style={{ margin: 0 }}>Booking with </h2>
            <h2 style={{ margin: 0 }}>{providerDisplayName}</h2>
          </div>
        </div>
        <div className={css.changeButtonsContainer}>
          <Button className={css.changeButton}>Modify</Button>
          <CancelButton className={css.changeButton}>Cancel</CancelButton>
        </div>
      </div>
      <div className={css.body}>
        <div className={css.dateTimesContainer}>
          <h2 className={css.datesAndTimes}>Dates & Times</h2>
          <div className={css.dateTimes}>
            {bookingTimes
              ?.slice(bookingTimesPage * 3, bookingTimesPage * 3 + 3)
              .map(({ date, startTime, endTime }) => {
                return (
                  <div className={css.bookingTime} key={date}>
                    <h3 className={css.summaryDate}>{date}</h3>
                    <span className={css.summaryTimes}>
                      {startTime} - {endTime}
                    </span>
                    <p className={css.tinyNoMargin}>
                      ({calculateBookingDayHours(startTime, endTime)} hours)
                    </p>
                  </div>
                );
              })}
          </div>
          <div className={css.tablePagination}>
            {bookingTimes?.length > 3 ? (
              <TablePagination
                component="div"
                count={bookingTimes?.length}
                page={bookingTimesPage}
                onPageChange={handleChangeTimesPage}
                rowsPerPage={3}
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
                labelRowsPerPage=""
                rowsPerPageOptions={[]}
              />
            ) : null}
          </div>
        </div>
        <div className={css.viewContainer}>
          <Button className={css.viewButton}>Full Payment Details</Button>
          <SecondaryButton className={css.viewButton}>View Calendar</SecondaryButton>
        </div>
      </div>
    </div>
  );
};

export default EmployerBookingCard;
