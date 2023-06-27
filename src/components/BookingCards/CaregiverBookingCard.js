import React, { useState } from 'react';

import {
  Avatar,
  SecondaryButton,
  Modal,
  BookingSummaryCard,
  BookingCalendar,
  CancelButton,
  Button,
  UserDisplayName,
} from '..';
import {
  TRANSITION_DISPUTE,
  TRANSITION_REQUEST_BOOKING,
  TRANSITION_ACCEPT_BOOKING,
} from '../../util/transaction';
import { convertTimeFrom12to24 } from '../../util/data';
import MuiTablePagination from '@mui/material/TablePagination';
import { useMediaQuery } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import { useCheckMobileScreen } from '../../util/hooks';
import { styled } from '@mui/material/styles';
import { compose } from 'redux';
import { injectIntl } from 'react-intl';

import css from './BookingCards.module.css';

const CREDIT_CARD = 'Payment Card';
const BANK_ACCOUNT = 'Bank Account';

const calculateBookingDayHours = (bookingStart, bookingEnd) => {
  if (!bookingStart || !bookingEnd) return 0;

  const start = convertTimeFrom12to24(bookingStart).split(':')[0];
  const end = bookingEnd === '12:00am' ? 24 : convertTimeFrom12to24(bookingEnd).split(':')[0];

  return end - start;
};

const CaregiverBookingCard = props => {
  const [bookingTimesPage, setBookingTimesPage] = useState(0);
  const [isPaymentDetailsModalOpen, setIsPaymentDetailsModalOpen] = useState(false);
  const [isBookingCalendarModalOpen, setIsBookingCalendarModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const {
    booking,
    onManageDisableScrolling,
    cancelBookingInProgress,
    cancelBookingError,
    onCancelBooking,
    intl,
  } = props;

  const { customer } = booking;

  const bookingMetadata = booking.attributes.metadata;
  const { bookingRate, lineItems, paymentMethodType, senderListingTitle } = bookingMetadata;

  const handleChangeTimesPage = (e, page) => {
    setBookingTimesPage(page);
  };

  const handleCancelBooking = () => {
    const refundAmount = calculateRefundAmount(lineItems);
    onCancelBooking(booking, refundAmount);
  };

  const customerDisplayName = (
    <UserDisplayName user={customer} intl={intl} className={css.userDisplayName} />
  );
  const selectedPaymentMethod =
    paymentMethodType === 'us_bank_account' ? BANK_ACCOUNT : CREDIT_CARD;

  const bookingTimes =
    lineItems
      ?.filter(l => l.code === 'line-item/booking')
      .map(l => ({
        date: `${new Date(l.date).getMonth() + 1}/${new Date(l.date).getDate()}`,
        startTime: l.startTime,
        endTime: l.endTime,
      })) ?? [];
  const refundAmount = lineItems
    ?.filter(l => l.code === 'refund')
    .reduce((acc, curr) => acc - curr.amount, 0);
  const bookingDates = lineItems?.map(li => new Date(li.date)) ?? [];
  const disputeInReview = booking?.attributes.lastTransition === TRANSITION_DISPUTE;
  const isRequest = booking?.attributes.lastTransition === TRANSITION_REQUEST_BOOKING;
  const isActive = booking?.attributes.lastTransition === TRANSITION_ACCEPT_BOOKING;
  const showCancel = isRequest || isActive;

  const isLarge = useMediaQuery('(min-width:1024px)');
  const isMobile = useCheckMobileScreen();

  const timesToDisplay = isMobile ? 1 : 3;

  const TablePagination = styled(MuiTablePagination)`
    ${isMobile
      ? `& .MuiTablePagination-toolbar {
      padding-left: 1rem;
    }

    & .MuiTablePagination-actions {
      margin-left: 0;
    }`
      : ''}
  `;

  return (
    <div className={css.bookingCard}>
      <div className={css.header}>
        <div className={css.bookingTitle}>
          <Avatar user={customer} disableProfileLink className={css.avatar} />
          <div>
            <h2 style={{ margin: 0 }}>{senderListingTitle}</h2>
          </div>
        </div>
        <div className={css.changeButtonsContainer}>
          {disputeInReview && <h3 className={css.error}>Customer Dispute In Review</h3>}
          {showCancel && (
            <CancelButton className={css.changeButton} onClick={() => setIsCancelModalOpen(true)}>
              Cancel
            </CancelButton>
          )}
        </div>
      </div>
      <div className={css.body}>
        <div className={css.dateTimesContainer}>
          <h2 className={css.datesAndTimes}>Dates & Times</h2>
          <div className={css.dateTimes}>
            {bookingTimes
              ?.slice(
                bookingTimesPage * timesToDisplay,
                bookingTimesPage * timesToDisplay + timesToDisplay
              )
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
            {bookingTimes?.length > timesToDisplay ? (
              <TablePagination
                component="div"
                count={bookingTimes?.length}
                page={bookingTimesPage}
                onPageChange={handleChangeTimesPage}
                rowsPerPage={timesToDisplay}
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}${isMobile ? '' : `-${to}`} of ${count}`
                }
                labelRowsPerPage=""
                rowsPerPageOptions={[]}
              />
            ) : null}
          </div>
        </div>
        <div className={css.viewContainer}>
          <Button className={css.viewButton} onClick={() => setIsPaymentDetailsModalOpen(true)}>
            Payment Details
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
        id="PaymentDetailsModal"
        isOpen={isPaymentDetailsModalOpen}
        onClose={() => setIsPaymentDetailsModalOpen(false)}
        containerClassName={css.modalContainer}
        onManageDisableScrolling={onManageDisableScrolling}
        usePortal
      >
        <p className={css.modalTitle}>Payment Summary</p>
        <BookingSummaryCard
          className={css.refundSummaryCard}
          authorDisplayName={customerDisplayName}
          currentAuthor={customer}
          selectedBookingTimes={bookingTimes}
          bookingRate={bookingRate}
          bookingDates={bookingDates}
          onManageDisableScrolling={onManageDisableScrolling}
          selectedPaymentMethod={selectedPaymentMethod}
          displayOnMobile={!isLarge}
          hideAvatar
          subHeading={<span className={css.bookingWith}>Payment Details</span>}
          refundAmount={refundAmount}
          hideRatesButton
          hideFees
        />
      </Modal>
      <Modal
        title="Booking Calendar"
        id="BookingCalendarModal"
        isOpen={isBookingCalendarModalOpen}
        onClose={() => setIsBookingCalendarModalOpen(false)}
        containerClassName={css.modalContainer}
        onManageDisableScrolling={onManageDisableScrolling}
        usePortal
      >
        <p className={css.modalTitle} style={{ marginBottom: '1.5rem' }}>
          Booking Calendar
        </p>
        <BookingCalendar bookedDates={bookingDates} noDisabled />
      </Modal>
      <Modal
        title="Cancel Booking"
        id="CancelBookingModal"
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onManageDisableScrolling={onManageDisableScrolling}
        usePortal
        containerClassName={css.modalContainer}
      >
        <p className={css.modalTitle}>Cancel Booking with {customerDisplayName}</p>
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
          >
            Cancel
          </CancelButton>
        </div>
      </Modal>
    </div>
  );
};

export default compose(injectIntl)(CaregiverBookingCard);
