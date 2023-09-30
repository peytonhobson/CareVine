import React, { useState, useMemo } from 'react';

import {
  Avatar,
  SecondaryButton,
  Modal,
  CancelButton,
  Button,
  UserDisplayName,
  Menu,
  MenuLabel,
  MenuContent,
  MenuItem,
  InlineTextButton,
  WeeklyBillingDetails,
} from '..';
import {
  TRANSITION_REQUEST_BOOKING,
  TRANSITION_ACCEPT_BOOKING,
  CANCELABLE_TRANSITIONS,
} from '../../util/transaction';
import { convertTimeFrom12to24 } from '../../util/data';
import MuiTablePagination from '@mui/material/TablePagination';
import { v4 as uuidv4 } from 'uuid';
import { useCheckMobileScreen } from '../../util/hooks';
import { styled } from '@mui/material/styles';
import { compose } from 'redux';
import { injectIntl } from 'react-intl';
import { FULL_WEEKDAY_MAP } from '../../util/constants';
import moment from 'moment';
import MenuIcon from '../ManageListingCard/MenuIcon';
import classNames from 'classnames';
import { sortExceptionsByDate } from '../../util/bookings';

import css from './BookingCards.module.css';
import ExceptionsModal from './Modals/ExceptionsModal';
import BookingCalendarModal from './Modals/BookingCalendarModal';
import DisputeModal from './Modals/DisputeModal';
import CancelModal from './Modals/CancelModal';

const calculateBookingDayHours = (bookingStart, bookingEnd) => {
  if (!bookingStart || !bookingEnd) return 0;

  const start = convertTimeFrom12to24(bookingStart).split(':')[0];
  const end = bookingEnd === '12:00am' ? 24 : convertTimeFrom12to24(bookingEnd).split(':')[0];

  return end - start;
};

// Booking card from the employers view
const EmployerBookingCard = props => {
  // TODO: useReducer
  const [bookingTimesPage, setBookingTimesPage] = useState(0);
  const [isPaymentDetailsModalOpen, setIsPaymentDetailsModalOpen] = useState(false);
  const [isBookingCalendarModalOpen, setIsBookingCalendarModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [isExceptionsModalOpen, setIsExceptionsModalOpen] = useState(false);

  const { booking, onManageDisableScrolling, intl, sonFetchBookings, onResetInitialState } = props;

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
    onFetchBookings();
  };

  const providerDisplayName = (
    <UserDisplayName user={provider} intl={intl} className={css.userDisplayName} />
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
  const listing = booking?.listing;

  const bookingLedger = booking?.attributes.metadata.ledger ?? [];

  const hasCurrentDispute =
    bookingLedger.length > 0 && bookingLedger[bookingLedger.length - 1].dispute;
  const isDisputable =
    bookingLedger.length > 0 &&
    bookingLedger[bookingLedger.length - 1].end &&
    Date.now() - new Date(bookingLedger[bookingLedger.length - 1].end) < 48 * 36e5 &&
    !hasCurrentDispute;

  const isRequest = lastTransition === TRANSITION_REQUEST_BOOKING;
  const isAccepted = lastTransition === TRANSITION_ACCEPT_BOOKING;
  const canCancel = CANCELABLE_TRANSITIONS.includes(lastTransition);
  const showMenu = canCancel || isDisputable;

  const isMobile = useCheckMobileScreen();

  const timesToDisplay = isMobile ? 1 : 3;
  const previewTimeCount =
    scheduleType === 'recurring' ? bookingSchedule?.length : bookingTimes?.length;

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
        <div>
          {bookingNumber ? <h4 className={css.bookingNumber}>Booking #{bookingNumber}</h4> : null}
          <div className={css.bookingTitle}>
            <Avatar user={provider} listing={listing} className={css.avatar} />
            <h2 className={css.title}>
              Booking with <span className="whitespace-nowrap">{providerDisplayName}</span>
            </h2>
          </div>
        </div>
        {showMenu ? (
          <Menu className="h-auto mb-4">
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
                {canCancel && (
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
                currentAuthor={provider}
                bookingRate={bookingRate}
                listing={listing}
                onManageDisableScrolling={onManageDisableScrolling}
                selectedPaymentMethodType={paymentMethodType}
              />
            </>
          )}
        </Modal>
      )}
      <CancelModal
        isOpen={isCancelModalOpen}
        onClose={() => handleModalClose(setIsCancelModalOpen)}
        lastTransition={lastTransition}
        otherUserDisplayName={providerDisplayName}
      />
      <DisputeModal
        isOpen={isDisputeModalOpen}
        onClose={() => handleModalClose(setIsDisputeModalOpen)}
      />
      <ExceptionsModal
        isOpen={isExceptionsModalOpen}
        onClose={() => handleModalClose(setIsExceptionsModalOpen)}
        onManageDisableScrolling={onManageDisableScrolling}
        exceptions={allExceptions}
      />
      <BookingCalendarModal
        isOpen={isBookingCalendarModalOpen}
        onClose={() => setIsBookingCalendarModalOpen(false)}
        onManageDisableScrolling={onManageDisableScrolling}
        bookingDates={bookingDates}
        bookingSchedule={bookingSchedule}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
};

export default compose(injectIntl)(EmployerBookingCard);
