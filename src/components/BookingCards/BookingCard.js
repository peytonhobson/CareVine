import React, { useState, useMemo, createContext, useContext } from 'react';

import {
  Avatar,
  UserDisplayName,
  Menu,
  MenuLabel,
  MenuContent,
  MenuItem,
  InlineTextButton,
  Button,
  SecondaryButton,
  CancelButton,
} from '..';
import { CANCELABLE_TRANSITIONS } from '../../util/transaction';
import MuiTablePagination from '@mui/material/TablePagination';
import { useCheckMobileScreen } from '../../util/hooks';
import { styled } from '@mui/material/styles';
import { compose } from 'redux';
import { injectIntl } from 'react-intl';
import { EMPLOYER, FULL_WEEKDAY_MAP } from '../../util/constants';
import moment from 'moment';
import MenuIcon from '../ManageListingCard/MenuIcon';
import classNames from 'classnames';
import { sortExceptionsByDate } from '../../util/bookings';
import {
  ExceptionsModal,
  ResponseModal,
  PaymentDetailsModal,
  BookingCalendarModal,
  DisputeModal,
  CancelModal,
} from './Modals';
import { calculateTimeBetween } from '../../util/dates';

import css from './BookingCards.module.css';

const MODAL_TYPES = {
  RESPOND: 'respond',
  PAYMENT_DETAILS: 'paymentDetails',
  CANCEL: 'cancel',
  DISPUTE: 'dispute',
  CALENDAR: 'calendar',
  EXCEPTIONS: 'exceptions',
};

const BookingCardContext = createContext(null);

const useBookingCard = () => {
  const context = useContext(BookingCardContext);
  if (!context) {
    throw new Error('Toggle compound components must be rendered within the Toggle component');
  }
  return context;
};

const BookingCardComponent = props => {
  // TODO: useReducer
  const [bookingTimesPage, setBookingTimesPage] = useState(0);
  const [isPaymentDetailsModalOpen, setIsPaymentDetailsModalOpen] = useState(false);
  const [isBookingCalendarModalOpen, setIsBookingCalendarModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [isExceptionsModalOpen, setIsExceptionsModalOpen] = useState(false);
  const [isRespondModalOpen, setIsRespondModalOpen] = useState(false);

  const {
    booking,
    onFetchBookings,
    onResetInitialState,
    userType,
    onManageDisableScrolling,
    children,
    intl,
    onFetchCurrentUserListing,
    onResetTransactionsInitialState,
  } = props;

  const bookingMetadata = booking.attributes.metadata;
  const lastTransition = booking.attributes.lastTransition;
  const {
    lineItems,
    bookingSchedule,
    startDate,
    endDate,
    type: scheduleType,
    exceptions = {
      addedDays: [],
      removedDays: [],
      changedDays: [],
    },
    bookingRate,
    paymentMethodType,
  } = bookingMetadata;

  const { customer, provider, listing } = booking;
  const otherUser = userType === EMPLOYER ? provider : customer;
  const otherUserDisplayName = (
    <UserDisplayName user={otherUser} intl={intl} className={css.userDisplayName} />
  );

  const allExceptions = useMemo(() => {
    return Object.values(exceptions)
      .flat()
      .sort(sortExceptionsByDate);
  }, [exceptions]);

  const handleModalOpen = modalType => {
    onFetchBookings();

    switch (modalType) {
      case MODAL_TYPES.RESPOND:
        setIsRespondModalOpen(true);
        break;
      case MODAL_TYPES.PAYMENT_DETAILS:
        setIsPaymentDetailsModalOpen(true);
        break;
      case MODAL_TYPES.CANCEL:
        setIsCancelModalOpen(true);
        break;
      case MODAL_TYPES.DISPUTE:
        setIsDisputeModalOpen(true);
        break;
      case MODAL_TYPES.CALENDAR:
        setIsBookingCalendarModalOpen(true);
        break;
      case MODAL_TYPES.EXCEPTIONS:
        setIsExceptionsModalOpen(true);
        break;
      default:
        break;
    }
  };

  const handleModalClose = modalType => {
    switch (modalType) {
      case MODAL_TYPES.RESPOND:
        setIsRespondModalOpen(false);
        break;
      case MODAL_TYPES.PAYMENT_DETAILS:
        setIsPaymentDetailsModalOpen(false);
        break;
      case MODAL_TYPES.CANCEL:
        setIsCancelModalOpen(false);
        break;
      case MODAL_TYPES.DISPUTE:
        setIsDisputeModalOpen(false);
        break;
      case MODAL_TYPES.CALENDAR:
        setIsBookingCalendarModalOpen(false);
        break;
      case MODAL_TYPES.EXCEPTIONS:
        setIsExceptionsModalOpen(false);
        break;
      default:
        break;
    }

    onResetInitialState();
    onResetTransactionsInitialState();
    onFetchBookings();
    onFetchCurrentUserListing();
  };

  const bookingDates = useMemo(() => {
    return lineItems?.map(li => new Date(li.date)) ?? [];
  }, [lineItems]);
  const bookingTimes = useMemo(() => {
    return (
      lineItems
        ?.filter(l => l.code === 'line-item/booking')
        .map(l => ({
          date: `${new Date(l.date).getMonth() + 1}/${new Date(l.date).getDate()}`,
          startTime: l.startTime,
          endTime: l.endTime,
        })) ?? []
    );
  }, [lineItems]);

  const isMobile = useCheckMobileScreen();

  const contextValue = {
    userType,
    booking,
    isMobile,
    bookingTimesPage,
    bookingTimes,
    setBookingTimesPage,
    handleModalOpen,
    handleModalClose,
    otherUser,
    otherUserDisplayName,
  };

  return (
    <BookingCardContext.Provider value={contextValue}>
      <div className={css.bookingCard}>{children}</div>
      <ResponseModal
        isOpen={isRespondModalOpen}
        onClose={() => handleModalClose(MODAL_TYPES.RESPOND)}
        exceptions={allExceptions}
        customerDisplayName={otherUserDisplayName}
        booking={booking}
        bookingDates={bookingDates}
      />
      <PaymentDetailsModal
        isOpen={isPaymentDetailsModalOpen}
        onClose={() => handleModalClose(MODAL_TYPES.PAYMENT_DETAILS)}
        bookingTimes={bookingTimes}
        bookingRate={bookingRate}
        listing={listing}
        onManageDisableScrolling={onManageDisableScrolling}
        paymentMethodType={paymentMethodType}
        scheduleType={scheduleType}
        bookingSchedule={bookingSchedule}
        exceptions={exceptions}
        startDate={startDate}
        endDate={endDate}
        provider={provider}
      />
      <CancelModal
        isOpen={isCancelModalOpen}
        onClose={() => handleModalClose(MODAL_TYPES.CANCEL)}
        lastTransition={lastTransition}
        otherUserDisplayName={otherUserDisplayName}
        isCaregiver
        booking={booking}
      />
      <ExceptionsModal
        isOpen={isExceptionsModalOpen}
        onClose={() => handleModalClose(MODAL_TYPES.EXCEPTIONS)}
        onManageDisableScrolling={onManageDisableScrolling}
        exceptions={allExceptions}
      />
      <BookingCalendarModal
        isOpen={isBookingCalendarModalOpen}
        onClose={() => handleModalClose(MODAL_TYPES.CALENDAR)}
        onManageDisableScrolling={onManageDisableScrolling}
        bookingDates={bookingDates}
        bookingSchedule={bookingSchedule}
        startDate={startDate}
        endDate={endDate}
      />
      <DisputeModal
        isOpen={isDisputeModalOpen}
        onClose={() => handleModalClose(MODAL_TYPES.DISPUTE)}
      />
    </BookingCardContext.Provider>
  );
};

export const BookingCard = compose(injectIntl)(BookingCardComponent);

export const BookingCardTitle = () => {
  const { isMobile, otherUser, userType, booking, otherUserDisplayName } = useBookingCard();

  const { listing } = booking;
  const { bookingNumber, senderListingTitle } = booking.attributes.metadata;

  const TitleTag = isMobile ? 'h3' : 'h2';
  const isCaregiver = userType === EMPLOYER;

  return (
    <div>
      {bookingNumber ? <h4 className={css.bookingNumber}>Booking #{bookingNumber}</h4> : null}
      <div className={css.bookingTitle}>
        <Avatar
          user={otherUser}
          listing={userType === EMPLOYER ? listing : null}
          className={css.avatar}
        />
        {isCaregiver ? (
          <TitleTag style={{ margin: 0 }}>
            {senderListingTitle !== 'Title' ? senderListingTitle : otherUserDisplayName}
          </TitleTag>
        ) : (
          <h2 className={css.title}>
            Booking with <span className="whitespace-nowrap">{otherUserDisplayName}</span>
          </h2>
        )}
      </div>
    </div>
  );
};

export const BookingCardMenu = () => {
  const { booking, isMobile, userType, handleModalOpen } = useBookingCard();

  const bookingLedger = booking.attributes.metadata.ledger ?? [];
  const lastTransition = booking.attributes.lastTransition;

  const hasCurrentDispute =
    bookingLedger.length > 0 && bookingLedger[bookingLedger.length - 1].dispute;
  const isDisputable =
    bookingLedger.length > 0 &&
    bookingLedger[bookingLedger.length - 1].end &&
    moment(bookingLedger[bookingLedger.length - 1].end).isAfter(moment().subtract(2, 'days')) &&
    !hasCurrentDispute &&
    userType === EMPLOYER;
  const isRequest = booking.attributes.lastTransition === 'transition/booking-request';

  const canCancel = CANCELABLE_TRANSITIONS.includes(lastTransition);
  const showMenu =
    ((canCancel || isDisputable) && userType === EMPLOYER) ||
    (canCancel && userType === CAREGIVER && !isRequest);

  return showMenu ? (
    <Menu className="h-auto mb-4">
      <MenuLabel className={css.menuLabel} isOpenClassName={css.profileMenuIsOpen}>
        <MenuIcon height={isMobile ? '1.75em' : '1.25em'} width="2.25em" />
      </MenuLabel>
      <MenuContent className={css.menuContent} style={{ right: isMobile }}>
        <MenuItem key="dispute">
          {isDisputable && (
            <InlineTextButton
              rootClassName={css.menuItem}
              onClick={() => handleModalOpen(MODAL_TYPES.DISPUTE)}
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
              onClick={() => handleModalOpen(MODAL_TYPES.CANCEL)}
            >
              <span className={css.menuItemBorder} />
              Cancel
            </InlineTextButton>
          )}
        </MenuItem>
      </MenuContent>
    </Menu>
  ) : null;
};

export const BookingCardHeader = ({ children }) => {
  return <div className={css.header}>{children}</div>;
};

export const BookingCardBody = ({ children }) => {
  return <div className={css.body}>{children}</div>;
};

export const BookingCardDateTimesContainer = ({ children }) => {
  const { booking } = useBookingCard();

  const { startDate, endDate, type: scheduleType } = booking.attributes.metadata;

  return (
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
      {children}
    </div>
  );
};

export const BookingCardDateTimes = () => {
  const { booking, bookingTimesPage, isMobile, bookingTimes } = useBookingCard();

  const { bookingSchedule, type: scheduleType } = booking.attributes.metadata;
  const timesToDisplay = isMobile ? 1 : 3;

  console.log(bookingTimes);

  return (
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
                <div className={css.bookingTime} key={dayOfWeek}>
                  <h3 className={css.summaryDate}>{FULL_WEEKDAY_MAP[dayOfWeek]}</h3>
                  <span className={css.summaryTimes}>
                    {startTime} - {endTime}
                  </span>
                  <p className={css.tinyNoMargin}>
                    ({calculateTimeBetween(startTime, endTime)} hours)
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
                <div className={css.bookingTime} key={date}>
                  <h3 className={css.summaryDate}>{date}</h3>
                  <span className={css.summaryTimes}>
                    {startTime} - {endTime}
                  </span>
                  <p className={css.tinyNoMargin}>
                    ({calculateTimeBetween(startTime, endTime)} hours)
                  </p>
                </div>
              );
            })}
    </div>
  );
};

export const BookingCardTablePagination = () => {
  const { isMobile, booking, bookingTimes } = useBookingCard();

  const {
    bookingSchedule,
    type: scheduleType,
    bookingTimesPage,
    setBookingTimesPage,
  } = booking.attributes.metadata;

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
    <div className={css.tablePagination}>
      {previewTimeCount > timesToDisplay ? (
        <TablePagination
          component="div"
          count={previewTimeCount}
          page={bookingTimesPage}
          onPageChange={(e, page) => setBookingTimesPage(page)}
          rowsPerPage={timesToDisplay}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}${isMobile ? '' : `-${to}`} of ${count}`
          }
          labelRowsPerPage=""
          rowsPerPageOptions={[]}
        />
      ) : null}
    </div>
  );
};

export const BookingCardDetailsButtons = () => {
  const { booking, handleModalOpen } = useBookingCard();

  const { scheduleType, exceptions = {} } = booking.attributes.metadata;

  const allExceptions = useMemo(() => {
    return Object.values(exceptions)
      .flat()
      .sort(sortExceptionsByDate);
  }, [exceptions]);

  return (
    <div className={css.viewContainer}>
      <Button
        className={css.viewButton}
        onClick={() => handleModalOpen(MODAL_TYPES.PAYMENT_DETAILS)}
      >
        Payment Details
      </Button>
      {scheduleType === 'oneTime' ? (
        <SecondaryButton
          className={css.viewButton}
          onClick={() => handleModalOpen(MODAL_TYPES.VIEW_CALENDAR)}
        >
          View Calendar
        </SecondaryButton>
      ) : allExceptions.length ? (
        <CancelButton
          className={css.viewButton}
          onClick={() => handleModalOpen(MODAL_TYPES.VIEW_EXCEPTIONS)}
        >
          Schedule Exceptions
        </CancelButton>
      ) : null}
    </div>
  );
};
