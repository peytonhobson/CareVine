import React, { useState } from 'react';

import {
  Avatar,
  SecondaryButton,
  Modal,
  BookingCalendar,
  CancelButton,
  Button,
  UserDisplayName,
  Menu,
  MenuLabel,
  MenuContent,
  MenuItem,
  InlineTextButton,
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
import { v4 as uuidv4 } from 'uuid';
import { DisputeForm } from '../../forms';
import { useCheckMobileScreen } from '../../util/hooks';
import { styled } from '@mui/material/styles';
import { compose } from 'redux';
import { injectIntl } from 'react-intl';
import { WEEKDAYS, FULL_WEEKDAY_MAP } from '../../util/constants';
import moment from 'moment';
import MenuIcon from '../ManageListingCard/MenuIcon';
import classNames from 'classnames';

import css from './BookingCards.module.css';

const CREDIT_CARD = 'Payment Card';
const BANK_ACCOUNT = 'Bank Account';
const TRANSACTION_FEE = 0.05;

const calculateBookingDayHours = (bookingStart, bookingEnd) => {
  if (!bookingStart || !bookingEnd) return 0;

  const start = convertTimeFrom12to24(bookingStart).split(':')[0];
  const end = bookingEnd === '12:00am' ? 24 : convertTimeFrom12to24(bookingEnd).split(':')[0];

  return end - start;
};

const EmployerBookingCard = props => {
  const [bookingTimesPage, setBookingTimesPage] = useState(0);
  const [isPaymentDetailsModalOpen, setIsPaymentDetailsModalOpen] = useState(false);
  const [isBookingCalendarModalOpen, setIsBookingCalendarModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);

  const {
    booking,
    onManageDisableScrolling,
    cancelBookingInProgress,
    cancelBookingError,
    cancelBookingSuccess,
    onCancelBooking,
    disputeBookingInProgress,
    disputeBookingError,
    disputeBookingSuccess,
    onDisputeBooking,
    intl,
    onFetchBookings,
    onResetInitialState,
  } = props;

  const { provider } = booking;

  const bookingMetadata = booking.attributes.metadata;
  const lastTransition = booking.attributes.lastTransition;
  const {
    bookingRate,
    lineItems,
    paymentMethodType,
    bookingNumber,
    bookingSchedule,
    startDate,
    endDate,
  } = bookingMetadata;
  const bookingScheduleKeys = bookingSchedule ? WEEKDAYS.filter(w => bookingSchedule[w]) : [];
  const scheduleType = bookingSchedule ? 'recurring' : 'oneTime';

  const handleChangeTimesPage = (e, page) => {
    setBookingTimesPage(page);
  };

  const handleDisputeBooking = values => {
    const { disputeReason } = values;
    onDisputeBooking(booking, disputeReason);
  };

  const handleModalOpen = modalOpenFunc => {
    onFetchBookings();
    modalOpenFunc(true);
  };

  const handleModalClose = modalCloseFunc => {
    modalCloseFunc(false);
    onResetInitialState();
    onFetchBookings();
  };

  const providerDisplayName = (
    <UserDisplayName user={provider} intl={intl} className={css.userDisplayName} />
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
  const listing = booking?.listing;

  const bookingLedger = booking?.attributes.metadata.ledger ?? [];

  const hasCurrentDispute =
    bookingLedger.length > 0 && bookingLedger[bookingLedger.length - 1].dispute;
  const isDisputable =
    bookingLedger.length > 0 &&
    bookingLedger[bookingLedger.length - 1].end &&
    Date.now() - new Date(bookingLedger[bookingLedger.length - 1].end) < 48 * 36e5 &&
    !hasCurrentDispute;

  const disputeInReview = lastTransition === TRANSITION_DISPUTE;
  const isRequest = lastTransition === TRANSITION_REQUEST_BOOKING;
  const isAccepted = lastTransition === TRANSITION_ACCEPT_BOOKING;
  const isCharged = lastTransition === TRANSITION_CHARGE;
  const isActive =
    lastTransition === TRANSITION_START || lastTransition === TRANSITION_START_UPDATE_TIMES;
  const showCancel = isRequest || isActive || isAccepted || isCharged;
  const showMenu = showCancel || isDisputable;

  const isMobile = useCheckMobileScreen();

  const timesToDisplay = isMobile ? 1 : 3;
  const previewTimeCount =
    bookingScheduleKeys.length > 0 ? Object.keys(bookingSchedule).length : bookingTimes?.length;

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
          <Avatar user={provider} listing={listing} className={css.avatar} />
          <h2 className={css.title}>
            Booking with <span className="whitespace-nowrap">{providerDisplayName}</span>
          </h2>
        </div>
        {showMenu ? (
          <Menu className={css.menu}>
            <MenuLabel className={css.menuLabel} isOpenClassName={css.profileMenuIsOpen}>
              <MenuIcon height={isMobile ? '1.75em' : '1.25em'} width="2.25em" />
            </MenuLabel>
            <MenuContent className={css.menuContent} style={{ right: isMobile }}>
              <MenuItem key="dispute">
                {isDisputable && (
                  <InlineTextButton
                    rootClassName={css.menuItem}
                    onClick={() => handleModalOpen(setIsDisputeModalOpen)}
                  >
                    <span className={css.menuItemBorder} />
                    Dispute
                  </InlineTextButton>
                )}
              </MenuItem>
              <MenuItem key="cancel">
                {showCancel && (
                  <InlineTextButton
                    rootClassName={classNames(css.menuItem, 'text-error', css.cancelMenuItem)}
                    onClick={() => handleModalOpen(setIsCancelModalOpen)}
                  >
                    <span className={css.menuItemBorder} />
                    Cancel
                  </InlineTextButton>
                )}
              </MenuItem>
            </MenuContent>
          </Menu>
        ) : null}
      </div>
      <div className={css.body}>
        <div className={css.dateTimesContainer}>
          <h2 className={css.datesAndTimes}>
            {bookingSchedule ? 'Weekly Schedule' : 'Dates & Times'}
          </h2>
          {startDate ? (
            <p class="text-primary mt-0 mb-2 text-sm">
              {moment(startDate).format('ddd, MMM DD')} -{' '}
              {endDate ? moment(endDate).format('ddd, MMM DD') : 'No End Date'}
            </p>
          ) : null}
          <div className={css.dateTimes}>
            {scheduleType === 'recurring'
              ? bookingScheduleKeys
                  ?.slice(
                    bookingTimesPage * timesToDisplay,
                    bookingTimesPage * timesToDisplay + timesToDisplay
                  )
                  .map(weekday => {
                    const { startTime, endTime } = bookingSchedule[weekday][0];
                    return (
                      <div className={css.bookingTime} key={uuidv4()}>
                        <h3 className={css.summaryDate}>{FULL_WEEKDAY_MAP[weekday]}</h3>
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
          <SecondaryButton
            className={css.viewButton}
            onClick={() => setIsBookingCalendarModalOpen(true)}
          >
            View Calendar
          </SecondaryButton>
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
          {/* <BookingSummaryCard
            className={css.bookingSummaryCard}
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
            refundAmount={refundAmount}
            hideRatesButton
          /> */}
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
            bookedDates={bookingDates}
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
          <p className={css.modalTitle}>Cancel Booking with {providerDisplayName}</p>
          {!isRequest && !isAccepted ? (
            <>
              <p className={css.modalMessageRefund}>Cancellation Policy</p>
              <ul className={css.refundList}>
                <li className={css.refundListItem}>
                  100% refund for booked times canceled more than 48 hours in advance
                </li>
                <li className={css.refundListItem}>
                  50% refund for booked times canceled less than 48 hours in advance
                </li>
                <li className={css.refundListItem}>
                  Service fees will be refunded in proportion to the refunded base booking amount.
                  Processing fees are non-refundable under all circumstances.
                </li>
              </ul>
              <div>
                {/* <BookingSummaryCard
                  className={css.bookingSummaryCard}
                  lineItems={lineItems}
                  onManageDisableScrolling={onManageDisableScrolling}
                /> */}
              </div>
            </>
          ) : (
            <p className={css.modalMessage}>
              You have not been charged for this booking and will therefore not receive a refund.
            </p>
          )}
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
      {isDisputeModalOpen && (
        <Modal
          title="Dispute Booking"
          id="DisputeBookingModal"
          isOpen={isDisputeModalOpen}
          onClose={() => handleModalClose(setIsDisputeModalOpen)}
          onManageDisableScrolling={onManageDisableScrolling}
          usePortal
          containerClassName={css.modalContainer}
        >
          <p className={css.modalTitle}>Submit Dispute</p>
          <p className={css.modalMessage}>
            Any dispute submitted will be reviewed by CareVine. You will be notified of the outcome
            once we have reviewed the case.
          </p>
          <DisputeForm
            onSubmit={handleDisputeBooking}
            inProgress={disputeBookingInProgress}
            disputeBookingError={disputeBookingError}
            disputeBookingSuccess={disputeBookingSuccess}
          />
        </Modal>
      )}
    </div>
  );
};

export default compose(injectIntl)(EmployerBookingCard);
