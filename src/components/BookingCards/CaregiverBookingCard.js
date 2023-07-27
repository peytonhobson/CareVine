import React, { useState, useMemo } from 'react';

import {
  Avatar,
  SecondaryButton,
  Modal,
  BookingSummaryCard,
  BookingCalendar,
  CancelButton,
  Button,
  UserDisplayName,
  PrimaryButton,
} from '..';
import {
  TRANSITION_DISPUTE,
  TRANSITION_REQUEST_BOOKING,
  TRANSITION_ACCEPT_BOOKING,
  TRANSITION_CHARGE,
  TRANSITION_START,
  TRANSITION_START_UPDATE_TIMES,
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
  const [isRespondModalOpen, setIsRespondModalOpen] = useState(false);

  const {
    booking,
    onManageDisableScrolling,
    cancelBookingInProgress,
    cancelBookingError,
    cancelBookingSuccess,
    onCancelBooking,
    intl,
    acceptBookingError,
    acceptBookingInProgress,
    acceptBookingSuccess,
    declineBookingError,
    declineBookingInProgress,
    declineBookingSuccess,
    onAcceptBooking,
    onDeclineBooking,
    onFetchBookings,
    onResetInitialState,
    bookedDates,
    onFetchCurrentUserListing,
  } = props;

  const { customer } = booking;

  const lastTransition = booking.attributes.lastTransition;
  const bookingMetadata = booking.attributes.metadata;
  const {
    bookingRate,
    lineItems,
    paymentMethodType,
    senderListingTitle,
    bookingNumber,
  } = bookingMetadata;

  const handleChangeTimesPage = (e, page) => {
    setBookingTimesPage(page);
  };

  const handleModalOpen = modalOpenFunc => {
    onFetchBookings();
    modalOpenFunc(true);
  };

  const handleModalClose = modalCloseFunc => {
    modalCloseFunc(false);
    onResetInitialState();
    onFetchBookings();
    onFetchCurrentUserListing();
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
  const disputeInReview = lastTransition === TRANSITION_DISPUTE;
  const isRequest = lastTransition === TRANSITION_REQUEST_BOOKING;
  const isAccepted = lastTransition === TRANSITION_ACCEPT_BOOKING;
  const isCharged = lastTransition === TRANSITION_CHARGE;
  const isActive =
    lastTransition === TRANSITION_START || lastTransition === TRANSITION_START_UPDATE_TIMES;
  const showCancel = isActive || isAccepted || isCharged;
  const hasSameDayBooking = useMemo(
    () =>
      bookedDates?.some(date =>
        lineItems?.some(l => new Date(date).getTime() === new Date(l.date).getTime())
      ),
    [bookedDates, lineItems]
  );

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
      {bookingNumber ? <h4 className={css.bookingNumber}>Booking #{bookingNumber}</h4> : null}
      <div className={css.header}>
        <div className={css.bookingTitle}>
          <Avatar user={customer} className={css.avatar} />
          <div>
            {isMobile ? (
              <h3 style={{ margin: 0 }}>{senderListingTitle}</h3>
            ) : (
              <h2 style={{ margin: 0 }}>{senderListingTitle}</h2>
            )}
          </div>
        </div>
        <div className={css.changeButtonsContainer}>
          {isRequest && (
            <Button
              className={css.changeButton}
              onClick={() => handleModalOpen(setIsRespondModalOpen)}
            >
              Respond
            </Button>
          )}
          {disputeInReview && <h3 className={css.error}>Customer Dispute In Review</h3>}
          {showCancel && (
            <CancelButton
              className={css.changeButton}
              onClick={() => handleModalOpen(setIsCancelModalOpen)}
            >
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
          <Button
            className={css.viewButton}
            onClick={() => handleModalOpen(setIsPaymentDetailsModalOpen)}
          >
            Payment Details
          </Button>
          <SecondaryButton
            className={css.viewButton}
            onClick={() => handleModalOpen(setIsBookingCalendarModalOpen)}
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
          className={css.bookingSummaryCard}
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
        onClose={() => handleModalClose(setIsCancelModalOpen)}
        onManageDisableScrolling={onManageDisableScrolling}
        usePortal
        containerClassName={css.modalContainer}
      >
        <p className={css.modalTitle}>Cancel Booking with {customerDisplayName}</p>
        <p className={css.modalMessage}>
          If you cancel the booking now, {customerDisplayName} will be fully refunded for any
          booking times not completed. Your search ranking may also be affected.
        </p>
        {cancelBookingError ? (
          <p className={css.modalError}>
            There was an error cancelling your booking. Please try again.
          </p>
        ) : null}
        <div className={css.modalButtonContainer}>
          <Button
            onClick={() => handleModalClose(setIsCancelModalOpen)}
            className={css.modalButton}
          >
            Back
          </Button>
          <CancelButton
            inProgress={cancelBookingInProgress}
            onClick={() => onCancelBooking(booking)}
            className={css.modalButton}
            ready={cancelBookingSuccess}
            disabled={cancelBookingSuccess || cancelBookingInProgress}
          >
            Cancel
          </CancelButton>
        </div>
      </Modal>
      <Modal
        title="Respond to Booking"
        id="RespondModal"
        isOpen={isRespondModalOpen}
        onClose={() => handleModalClose(setIsRespondModalOpen)}
        onManageDisableScrolling={onManageDisableScrolling}
        usePortal
        containerClassName={css.modalContainer}
      >
        <p className={css.modalTitle}>Accept or Decline Booking with {customerDisplayName}</p>
        <BookingSummaryCard
          className={css.bookingSummaryCard}
          authorDisplayName={customerDisplayName}
          currentAuthor={customer}
          selectedBookingTimes={bookingTimes}
          bookingRate={bookingRate}
          bookingDates={bookingDates}
          onManageDisableScrolling={onManageDisableScrolling}
          selectedPaymentMethod={selectedPaymentMethod}
          hideAvatar
          subHeading={<span className={css.bookingWith}>Payment Details</span>}
          refundAmount={refundAmount}
          hideRatesButton
          hideFees
        />
        {acceptBookingError ? (
          <p className={css.error}>
            There was an issue accepting the booking request. Please try again.
          </p>
        ) : null}
        {declineBookingError ? (
          <p className={css.error}>
            There was an issue declining the booking request. Please try again.
          </p>
        ) : null}
        {hasSameDayBooking ? (
          <div className={css.bookingDecisionContainer}>
            <h3 className={css.bookingDeclined}>
              You have a booking on the same day. Please decline this booking request.
            </h3>
            <CancelButton
              inProgress={declineBookingInProgress}
              ready={declineBookingSuccess}
              className={css.declineButton}
              // inProgress={transitionTransactionInProgress === TRANSITION_DECLINE_BOOKING}
              onClick={() => onDeclineBooking(booking)}
              disabled={
                acceptBookingSuccess ||
                acceptBookingInProgress ||
                declineBookingSuccess ||
                declineBookingInProgress
              }
            >
              Decline
            </CancelButton>
          </div>
        ) : (
          <div className={css.acceptDeclineButtons}>
            <PrimaryButton
              inProgress={acceptBookingInProgress}
              ready={acceptBookingSuccess}
              onClick={() => onAcceptBooking(booking)}
              disabled={
                declineBookingSuccess ||
                declineBookingInProgress ||
                acceptBookingSuccess ||
                acceptBookingInProgress
              }
            >
              Accept
            </PrimaryButton>
            <CancelButton
              inProgress={declineBookingInProgress}
              ready={declineBookingSuccess}
              className={css.declineButton}
              // inProgress={transitionTransactionInProgress === TRANSITION_DECLINE_BOOKING}
              onClick={() => onDeclineBooking(booking)}
              disabled={
                acceptBookingSuccess ||
                acceptBookingInProgress ||
                declineBookingSuccess ||
                declineBookingInProgress
              }
            >
              Decline
            </CancelButton>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default compose(injectIntl)(CaregiverBookingCard);
