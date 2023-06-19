import React, { useState } from 'react';

import { Avatar, Button, CancelButton, SecondaryButton, Modal, BookingSummaryCard } from '..';
import { convertTimeFrom12to24 } from '../../util/data';
import TablePagination from '@mui/material/TablePagination';
import { useMediaQuery } from '@mui/material';

import css from './BookingCards.module.css';

const CREDIT_CARD = 'Payment Card';
const BANK_ACCOUNT = 'Bank Account';

const calculateBookingDayHours = (bookingStart, bookingEnd) => {
  const start = convertTimeFrom12to24(bookingStart).split(':')[0];
  const end = bookingEnd === '12:00am' ? 24 : convertTimeFrom12to24(bookingEnd).split(':')[0];

  return end - start;
};

const EmployerBookingCard = props => {
  const [bookingTimesPage, setBookingTimesPage] = useState(0);
  const [isPaymentDetailsModalOpen, setIsPaymentDetailsModalOpen] = useState(false);

  const { booking, currentUser, onManageDisableScrolling } = props;

  const { provider } = booking;

  const bookingMetadata = booking.attributes.metadata;
  const { bookingRate, lineItems, paymentMethodType } = bookingMetadata;

  const handleChangeTimesPage = (e, page) => {
    setBookingTimesPage(page);
  };

  const providerDisplayName = provider.attributes.profile.displayName;
  const selectedPaymentMethod =
    paymentMethodType === 'us_bank_account' ? BANK_ACCOUNT : CREDIT_CARD;

  const bookingTimes =
    lineItems?.map(l => ({
      date: `${new Date(l.date).getMonth() + 1}/${new Date(l.date).getDate()}`,
      startTime: l.startTime,
      endTime: l.endTime,
    })) ?? [];

  const isLarge = useMediaQuery('(min-width:1024px)');

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
          <Button className={css.viewButton} onClick={() => setIsPaymentDetailsModalOpen(true)}>
            Full Payment Details
          </Button>
          <SecondaryButton className={css.viewButton}>View Calendar</SecondaryButton>
        </div>
      </div>
      <Modal
        title="Payment Details"
        isOpen={isPaymentDetailsModalOpen}
        onClose={() => setIsPaymentDetailsModalOpen(false)}
        containerClassName={css.modalContainer}
        onManageDisableScrolling={onManageDisableScrolling}
        usePortal
      >
        <BookingSummaryCard
          className={css.summaryCard}
          authorDisplayName={providerDisplayName}
          currentAuthor={provider}
          selectedBookingTimes={bookingTimes}
          bookingRate={bookingRate}
          bookingDates={lineItems?.map(li => new Date(li.date)) ?? []}
          onManageDisableScrolling={onManageDisableScrolling}
          selectedPaymentMethod={selectedPaymentMethod}
          displayOnMobile={!isLarge}
          hideAvatar
          subHeading={<span className={css.bookingWith}>Payment Details</span>}
          hideRatesButton
        />
      </Modal>
    </div>
  );
};

export default EmployerBookingCard;
