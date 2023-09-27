import React, { useState, useMemo } from 'react';

import {
  Avatar,
  SecondaryButton,
  Modal,
  BookingCalendar,
  CancelButton,
  Button,
  UserDisplayName,
  PrimaryButton,
  SingleBookingSummaryCard,
  WeeklyBillingDetails,
  BookingException,
  Menu,
  MenuItem,
  MenuContent,
  MenuLabel,
  InlineTextButton,
} from '..';
import MenuIcon from '../ManageListingCard/MenuIcon';
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
import { WEEKDAYS, FULL_WEEKDAY_MAP } from '../../util/constants';
import {
  checkIsBlockedOneTime,
  checkIsBlockedRecurring,
  sortExceptionsByDate,
} from '../../util/bookings';
import classNames from 'classnames';
import moment from 'moment';

const isDev = process.env.NODE_ENV === 'development';

import css from './BookingCards.module.css';

const calculateBookingDayHours = (bookingStart, bookingEnd) => {
  if (!bookingStart || !bookingEnd) return 0;

  const start = convertTimeFrom12to24(bookingStart).split(':')[0];
  const end = bookingEnd === '12:00am' ? 24 : convertTimeFrom12to24(bookingEnd).split(':')[0];

  return end - start;
};

const cancelableTransitions = [
  TRANSITION_ACCEPT_BOOKING,
  TRANSITION_CHARGE,
  TRANSITION_START,
  TRANSITION_START_UPDATE_TIMES,
  TRANSITION_COMPLETE,
  TRANSITION_COMPLETE_CANCELED,
  TRANSITION_UPDATE_NEXT_WEEK_START,
  TRANSITION_UPDATE_BOOKING_END_REPEAT,
  TRANSITION_WAIT_FOR_PAYMENT,
  TRANSITION_NEW_PAYMENT_ACCEPTED,
  TRANSITION_UPDATE_BOOKING_END,
];

const CaregiverBookingCard = props => {
  const [bookingTimesPage, setBookingTimesPage] = useState(0);
  const [isPaymentDetailsModalOpen, setIsPaymentDetailsModalOpen] = useState(false);
  const [isBookingCalendarModalOpen, setIsBookingCalendarModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isRespondModalOpen, setIsRespondModalOpen] = useState(false);
  const [isExceptionsModalOpen, setIsExceptionsModalOpen] = useState(false);

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
    onFetchCurrentUserListing,
    currentUser,
    onResetTransactionsInitialState,
  } = props;

  const { customer, listing } = booking;

  const { bookedDays, bookedDates } = listing.attributes.metadata;

  const lastTransition = booking.attributes.lastTransition;
  const bookingMetadata = booking.attributes.metadata;
  const {
    bookingRate,
    lineItems,
    paymentMethodType,
    senderListingTitle,
    bookingNumber,
    bookingSchedule = [],
    startDate,
    endDate,
    type: scheduleType,
    exceptions = {
      addedDays: [],
      removedDays: [],
      changedDays: [],
    },
  } = bookingMetadata;
  const allExceptions = useMemo(() => {
    return Object.values(exceptions)
      .flat()
      .sort(sortExceptionsByDate);
  }, [exceptions]);

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
    onResetTransactionsInitialState();
    onFetchBookings();
    onFetchCurrentUserListing();
  };

  const customerDisplayName = (
    <UserDisplayName user={customer} intl={intl} className={css.userDisplayName} />
  );

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
  const showMenu = isActive || isAccepted || isCharged;
  const hasSameDayBooking = useMemo(
    () =>
      (scheduleType === 'oneTime'
        ? checkIsBlockedOneTime({ dates: bookingDates, listing })
        : checkIsBlockedRecurring({ bookingSchedule, startDate, endDate, exceptions, listing })) &&
      !(acceptBookingSuccess || acceptBookingInProgress),
    [bookingDates, listing, startDate, endDate, exceptions, scheduleType]
  );

  const previewTimeCount =
    scheduleType === 'recurring' ? bookingSchedule?.length : bookingTimes?.length;

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

  const TitleTag = isMobile ? 'h3' : 'h2';

  return (
    <div className={css.bookingCard}>
      <div className={css.header}>
        <div>
          {bookingNumber ? <h4 className={css.bookingNumber}>Booking #{bookingNumber}</h4> : null}
          <div className={css.bookingTitle}>
            <Avatar user={customer} className={css.avatar} />
            <div>
              <TitleTag style={{ margin: 0 }}>
                {senderListingTitle !== 'Title' ? senderListingTitle : customerDisplayName}
              </TitleTag>
            </div>
          </div>
        </div>
        {showMenu ? (
          <Menu className="h-auto mb-4">
            <MenuLabel className={css.menuLabel} isOpenClassName={css.profileMenuIsOpen}>
              <MenuIcon height={isMobile ? '1.75em' : '1.25em'} width="2.25em" />
            </MenuLabel>
            <MenuContent className={css.menuContent} style={{ right: isMobile }}>
              <MenuItem key="cancel">
                <InlineTextButton
                  rootClassName={classNames(css.menuItem, 'text-error', css.cancelMenuItem)}
                  onClick={() => handleModalOpen(setIsCancelModalOpen)}
                >
                  <span className={css.menuItemBorder} />
                  Cancel
                </InlineTextButton>
              </MenuItem>
            </MenuContent>
          </Menu>
        ) : null}
        {isRequest && (
          <Button
            className={css.changeButton}
            onClick={() => handleModalOpen(setIsRespondModalOpen)}
          >
            Respond
          </Button>
        )}
      </div>
      <div className={css.body}>
        <div className={css.dateTimesContainer}>
          <h2 className={css.datesAndTimes}>
            {scheduleType === 'recurring' ? 'Weekly Schedule' : 'Dates & Times'}
          </h2>
          {startDate ? (
            <p class="text-primary mt-0 mb-2 text-sm">
              {moment(startDate).format('ddd, MMM DD')} -{' '}
              {endDate ? moment(endDate).format('ddd, MMM DD') : 'No End Date'}
            </p>
          ) : null}
          <div className={css.dateTimes}>
            {scheduleType === 'recurring'
              ? bookingSchedule
                  ?.slice(
                    bookingTimesPage * timesToDisplay,
                    bookingTimesPage * timesToDisplay + timesToDisplay
                  )
                  .map(b => {
                    const { startTime, endTime, dayOfWeek } = b;
                    return (
                      <div className={css.bookingTime} key={uuidv4()}>
                        <h3 className={css.summaryDate}>{FULL_WEEKDAY_MAP[dayOfWeek]}</h3>
                        <span className={css.summaryTimes}>
                          {startTime} - {endTime}
                        </span>
                        <p className={css.tinyNoMargin}>
                          ({calculateBookingDayHours(startTime, endTime)} hours)
                        </p>
                      </div>
                    );
                  })
              : bookingTimes
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
            {previewTimeCount > timesToDisplay ? (
              <TablePagination
                component="div"
                count={previewTimeCount}
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
          {scheduleType === 'oneTime' ? (
            <SecondaryButton
              className={css.viewButton}
              onClick={() => handleModalOpen(setIsBookingCalendarModalOpen)}
            >
              View Calendar
            </SecondaryButton>
          ) : allExceptions.length ? (
            <CancelButton
              className={css.viewButton}
              onClick={() => handleModalOpen(setIsExceptionsModalOpen)}
            >
              Schedule Exceptions
            </CancelButton>
          ) : null}
        </div>
      </div>
      {isPaymentDetailsModalOpen && (
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
          {scheduleType === 'oneTime' ? (
            <SingleBookingSummaryCard
              className={css.summaryCard}
              bookingTimes={bookingTimes}
              bookingRate={bookingRate}
              listing={listing}
              onManageDisableScrolling={onManageDisableScrolling}
              selectedPaymentMethod={paymentMethodType}
              hideRatesButton
              hideAvatar
              hideFees
            />
          ) : (
            <>
              <p className={css.modalMessage}>
                Click any week in your booking to view the payment details for that week.
              </p>
              <WeeklyBillingDetails
                className="mt-6"
                bookingSchedule={bookingSchedule}
                exceptions={exceptions}
                startDate={startDate}
                endDate={endDate}
                currentAuthor={currentUser}
                bookingRate={bookingRate}
                listing={listing}
                onManageDisableScrolling={onManageDisableScrolling}
                selectedPaymentMethodType={paymentMethodType}
                hideFees
                isPayment
              />
            </>
          )}
        </Modal>
      )}
      {isBookingCalendarModalOpen && (
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
          <BookingCalendar
            bookingDates={bookingDates}
            bookingSchedule={bookingSchedule}
            startDate={startDate}
            endDate={endDate}
            noDisabled
          />
        </Modal>
      )}
      {isCancelModalOpen && (
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
      )}
      {isRespondModalOpen && (
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
          {allExceptions.length ? (
            <p className={classNames(css.modalMessage, 'text-error')}>
              This schedule contains exceptions. Please review the full schedule and exceptions
              before accepting.
            </p>
          ) : null}
          {/* <BookingSummaryCard
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
          /> */}
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
              <h3 className="text-error text-md">
                You have an existing booking with dates that conflict with this request. Please
                decline this booking request.
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
      )}
      {isExceptionsModalOpen && (
        <Modal
          title="Booking Exceptions"
          id="BookingExceptionsModal"
          isOpen={isExceptionsModalOpen}
          onClose={() => handleModalClose(setIsExceptionsModalOpen)}
          onManageDisableScrolling={onManageDisableScrolling}
          usePortal
          containerClassName={css.modalContainer}
        >
          <p className={css.modalTitle}>Booking Exceptions</p>
          <p className={css.modalMessage}>
            Listed below are days that are different from the regular booking schedule.
          </p>
          <div className={css.exceptions}>
            {allExceptions.map(exception => {
              return (
                <BookingException {...exception} key={exception.date} className={css.exception} />
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default compose(injectIntl)(CaregiverBookingCard);
