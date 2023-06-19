import React, { useState } from 'react';

import {
  Avatar,
  SecondaryButton,
  Modal,
  BookingSummaryCard,
  BookingCalendar,
  CancelButton,
  Button,
} from '..';
import { convertTimeFrom12to24 } from '../../util/data';
import TablePagination from '@mui/material/TablePagination';
import { useMediaQuery } from '@mui/material';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import ModifyBookingModal from './ModifyBookingModal';

import css from './BookingCards.module.css';

const CREDIT_CARD = 'Payment Card';
const BANK_ACCOUNT = 'Bank Account';

const calculateBookingDayHours = (bookingStart, bookingEnd) => {
  const start = convertTimeFrom12to24(bookingStart).split(':')[0];
  const end = bookingEnd === '12:00am' ? 24 : convertTimeFrom12to24(bookingEnd).split(':')[0];

  return end - start;
};

const calculateRefundAmount = (lineItems, bookingRate, transactionFee) => {
  const refundedBookings = lineItems
    ?.map(l => ({
      date: new Date(l.date),
      amount: l.amount,
    }))
    .filter(l => l.date > moment().add(1, 'days'));

  const refundedAmount = refundedBookings.reduce(
    (acc, curr) => acc + (curr.amount ? curr.amount : 0),
    0
  );

  return Number.parseFloat(refundedAmount - refundedAmount * transactionFee).toFixed(2);
};

const EmployerBookingCard = props => {
  const [bookingTimesPage, setBookingTimesPage] = useState(0);
  const [isPaymentDetailsModalOpen, setIsPaymentDetailsModalOpen] = useState(false);
  const [isBookingCalendarModalOpen, setIsBookingCalendarModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isBookingCanceled, setIsBookingCanceled] = useState(false);
  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);

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
  const { bookingRate, lineItems, paymentMethodType, transactionFee } = bookingMetadata;

  const handleChangeTimesPage = (e, page) => {
    setBookingTimesPage(page);
  };

  const handleCancelBooking = () => {
    const refundAmount = calculateRefundAmount(lineItems, bookingRate, transactionFee);
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
  const refundBookingDates = bookingDates.filter(d => d > moment().add(1, 'days'));
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
          <Button className={css.changeButton} onClick={() => setIsModifyModalOpen(true)}>
            Modify
          </Button>
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
        containerClassName={css.modalContainer}
      >
        <p className={css.modalTitle}>Cancel Booking with {providerDisplayName}</p>
        <p className={css.modalMessage}>
          When you cancel, any future booking days will be canceled. You will be refunded for any
          unused time where the start of the day is more than 24 hours away.
        </p>
        <div>
          <BookingSummaryCard
            className={css.refundSummaryCard}
            authorDisplayName={providerDisplayName}
            currentAuthor={provider}
            selectedBookingTimes={bookingTimes}
            bookingRate={bookingRate}
            bookingDates={refundBookingDates}
            onManageDisableScrolling={onManageDisableScrolling}
            displayOnMobile={!isLarge}
            hideAvatar
            subHeading={<span className={css.bookingWith}>Refund Summary</span>}
            hideRatesButton
          />
        </div>
        {cancelBookingError ? (
          <p className={css.modalError}>
            There was an error cancelling your booking. Please try again.
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
      <ModifyBookingModal
        isOpen={isModifyModalOpen}
        onClose={() => setIsModifyModalOpen(false)}
        onManageDisableScrolling={onManageDisableScrolling}
        bookingDates={bookingDates}
        provider={provider}
        providerDisplayName={providerDisplayName}
        listing={listing}
        bookingRate={bookingRate}
        bookingTimes={bookingTimes}
        isLarge={isLarge}
      />
    </div>
  );
};

export default EmployerBookingCard;
