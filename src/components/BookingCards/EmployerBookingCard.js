import React, { useState } from 'react';

import {
  Avatar,
  SecondaryButton,
  Modal,
  BookingSummaryCard,
  RefundBookingSummaryCard,
  BookingCalendar,
  CancelButton,
  Button,
} from '..';
import { convertTimeFrom12to24 } from '../../util/data';
import TablePagination from '@mui/material/TablePagination';
import { useMediaQuery } from '@mui/material';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';

import css from './BookingCards.module.css';

const CREDIT_CARD = 'Payment Card';
const BANK_ACCOUNT = 'Bank Account';

const calculateBookingDayHours = (bookingStart, bookingEnd) => {
  const start = convertTimeFrom12to24(bookingStart).split(':')[0];
  const end = bookingEnd === '12:00am' ? 24 : convertTimeFrom12to24(bookingEnd).split(':')[0];

  return end - start;
};

const calculateRefundAmount = (lineItems, bookingRate, transactionFee) => {
  const fiftyPercentRefunds = lineItems
    .filter(l => {
      const startTimeHours = parseInt(convertTimeFrom12to24(l.startTime).split(':')[0], 10);
      const differenceInHours = moment(l.date).add(startTimeHours, 'hours') - moment();
      return differenceInHours < 72 && differenceInHours > 0;
    })
    .reduce((acc, curr) => acc + curr.amount / 2, 0);

  const fullRefunds = lineItems
    .filter(l => {
      const startTimeHours = parseInt(convertTimeFrom12to24(l.startTime).split(':')[0], 10);
      const differenceInHours = moment(l.date).add(startTimeHours, 'hours') - moment();
      return differenceInHours < 72 && differenceInHours > 0;
    })
    .reduce((acc, curr) => acc + curr.amount / 2, 0);

  return parseFloat(fiftyPercentRefunds + fullRefunds).toFixed(2) * 100;
};

const EmployerBookingCard = props => {
  const [bookingTimesPage, setBookingTimesPage] = useState(0);
  const [isPaymentDetailsModalOpen, setIsPaymentDetailsModalOpen] = useState(false);
  const [isBookingCalendarModalOpen, setIsBookingCalendarModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isBookingCanceled, setIsBookingCanceled] = useState(false);
  const {
    booking,
    currentUser,
    onManageDisableScrolling,
    cancelBookingInProgress,
    cancelBookingError,
    onCancelBooking,
  } = props;

  const { provider } = booking;

  const bookingMetadata = booking.attributes.metadata;
  const { bookingRate, lineItems, paymentMethodType } = bookingMetadata;

  const handleChangeTimesPage = (e, page) => {
    setBookingTimesPage(page);
  };

  const handleCancelBooking = () => {
    const refundAmount = calculateRefundAmount(lineItems);
    onCancelBooking(booking, refundAmount);
    setIsBookingCanceled(true);

    setTimeout(() => {
      setIsCancelModalOpen(false);
    }, 2000);
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
  const bookingDates = lineItems?.map(li => new Date(li.date)) ?? [];
  const listing = booking.listing;

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
          <CancelButton className={css.changeButton} onClick={() => setIsCancelModalOpen(true)}>
            Cancel
          </CancelButton>
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
                  <div className={css.bookingTime} key={uuidv4()}>
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
          <SecondaryButton
            className={css.viewButton}
            onClick={() => setIsBookingCalendarModalOpen(true)}
          >
            View Calendar
          </SecondaryButton>
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
          authorDisplayName={providerDisplayName}
          currentAuthor={provider}
          selectedBookingTimes={bookingTimes}
          bookingRate={bookingRate}
          bookingDates={bookingDates}
          onManageDisableScrolling={onManageDisableScrolling}
          selectedPaymentMethod={selectedPaymentMethod}
          displayOnMobile={!isLarge}
          hideAvatar
          subHeading={<span className={css.bookingWith}>Payment Details</span>}
          hideRatesButton
        />
      </Modal>
      <Modal
        title="Booking Calendar"
        isOpen={isBookingCalendarModalOpen}
        onClose={() => setIsBookingCalendarModalOpen(false)}
        containerClassName={css.modalContainer}
        onManageDisableScrolling={onManageDisableScrolling}
        usePortal
      >
        <BookingCalendar bookedDates={bookingDates} noDisabled />
      </Modal>
      <Modal
        title="Cancel Booking"
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onManageDisableScrolling={onManageDisableScrolling}
        usePortal
      >
        <p className={css.modalTitle}>Cancel Booking with {providerDisplayName}</p>
        <p className={css.modalMessageRefund}>
          You will be refunded for any days that are canceled as follows:
        </p>
        <ul className={css.refundList}>
          <li className={css.refundListItem}>
            100% refund for booked times canceled more than 72 hours in advance
          </li>
          <li className={css.refundListItem}>
            50% refund for booked times canceled less than 72 hours in advance
          </li>
        </ul>
        <div>
          <RefundBookingSummaryCard className={css.refundSummaryCard} lineItems={lineItems} />
        </div>
        {cancelBookingError ? (
          <p className={css.modalError}>
            There was an error canceling your booking. Please try again.
          </p>
        ) : null}
        <div className={css.modalButtonContainer}>
          <Button onClick={() => setIsCancelModalOpen(false)} className={css.modalButton}>
            Back
          </Button>
          <CancelButton
            inProgress={cancelBookingInProgress}
            onClick={handleCancelBooking}
            className={css.modalButton}
            ready={isBookingCanceled}
          >
            Cancel
          </CancelButton>
        </div>
      </Modal>
    </div>
  );
};

export default EmployerBookingCard;
