import React, { useReducer, useMemo, createContext, useContext } from 'react';

import { Avatar, UserDisplayName, Button, SecondaryButton, CancelButton } from '..';
import { CANCELABLE_TRANSITIONS, TRANSITION_REQUEST_BOOKING } from '../../util/transaction';
import MuiTablePagination from '@mui/material/TablePagination';
import { useCheckMobileScreen } from '../../util/hooks';
import { styled } from '@mui/material/styles';
import { compose } from 'redux';
import { injectIntl } from 'react-intl';
import { CAREGIVER, EMPLOYER, FULL_WEEKDAY_MAP } from '../../util/constants';
import moment from 'moment';
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
import ActionsModal from './Modals/ActionsModal';
import CancelWeekEndModal from './Modals/CancelWeekEndModal';

const MODAL_TYPES = {
  RESPOND: 'respond',
  PAYMENT_DETAILS: 'paymentDetails',
  CANCEL: 'cancel',
  DISPUTE: 'dispute',
  CALENDAR: 'calendar',
  EXCEPTIONS: 'exceptions',
  ACTIONS: 'actions',
  MODIFY_SCHEDULE: 'modifySchedule',
  CANCEL_WEEK_END: 'cancelWeekEnd',
  CHANGE_PAYMENT_METHOD: 'changePaymentMethod',
};

const BookingCardContext = createContext(null);

const useBookingCard = () => {
  const context = useContext(BookingCardContext);
  if (!context) {
    throw new Error('Toggle compound components must be rendered within the Toggle component');
  }
  return context;
};

const SET_OPEN_MODAL_TYPE = 'SET_OPEN_MODAL_TYPE';
const CLOSE_MODAL = 'CLOSE_MODAL';
const SET_BOOKING_TIMES_PAGE = 'SET_BOOKING_TIMES_PAGE';

const reducer = (state, action) => {
  switch (action.type) {
    case SET_OPEN_MODAL_TYPE:
      return { ...state, openModalType: action.payload };
    case CLOSE_MODAL:
      return { ...state, openModalType: null };
    case SET_BOOKING_TIMES_PAGE:
      return { ...state, bookingTimesPage: action.payload };
    default:
      return state;
  }
};

const BookingCardComponent = props => {
  const initialState = {
    openModalType: null,
    bookingTimesPage: 0,
  };

  const [state, dispatch] = useReducer(reducer, initialState);

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
    exceptions = {
      addedDays: [],
      removedDays: [],
      changedDays: [],
    },
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

    dispatch({ type: SET_OPEN_MODAL_TYPE, payload: modalType });
  };

  const handleModalClose = modalType => {
    dispatch({ type: CLOSE_MODAL });

    onResetInitialState();
    onResetTransactionsInitialState();
    onFetchBookings();
    onFetchCurrentUserListing();
  };

  const setBookingTimesPage = page => dispatch({ type: SET_BOOKING_TIMES_PAGE, payload: page });

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
    bookingTimesPage: state.bookingTimesPage,
    setBookingTimesPage,
    handleModalOpen,
    handleModalClose,
    otherUser,
    otherUserDisplayName,
    bookingTimes,
  };

  return (
    <BookingCardContext.Provider value={contextValue}>
      <div className={css.bookingCard}>{children}</div>
      <ResponseModal
        isOpen={state.openModalType === MODAL_TYPES.RESPOND}
        onClose={() => handleModalClose(MODAL_TYPES.RESPOND)}
        customerDisplayName={otherUserDisplayName}
        booking={booking}
        bookingDates={bookingDates}
        allExceptions={allExceptions}
      />
      <PaymentDetailsModal
        isOpen={state.openModalType === MODAL_TYPES.PAYMENT_DETAILS}
        onClose={() => handleModalClose(MODAL_TYPES.PAYMENT_DETAILS)}
        onManageDisableScrolling={onManageDisableScrolling}
        booking={booking}
      />
      <CancelModal
        isOpen={state.openModalType === MODAL_TYPES.CANCEL}
        onClose={() => handleModalClose(MODAL_TYPES.CANCEL)}
        lastTransition={lastTransition}
        otherUserDisplayName={otherUserDisplayName}
        userType={userType}
        booking={booking}
      />
      <ExceptionsModal
        isOpen={state.openModalType === MODAL_TYPES.EXCEPTIONS}
        onClose={() => handleModalClose(MODAL_TYPES.EXCEPTIONS)}
        onManageDisableScrolling={onManageDisableScrolling}
        exceptions={allExceptions}
      />
      <BookingCalendarModal
        isOpen={state.openModalType === MODAL_TYPES.CALENDAR}
        onClose={() => handleModalClose(MODAL_TYPES.CALENDAR)}
        onManageDisableScrolling={onManageDisableScrolling}
        bookingDates={bookingDates}
        booking={booking}
      />
      <DisputeModal
        isOpen={state.openModalType === MODAL_TYPES.DISPUTE}
        onClose={() => handleModalClose(MODAL_TYPES.DISPUTE)}
      />
      <ActionsModal
        isOpen={state.openModalType === MODAL_TYPES.ACTIONS}
        onClose={() => handleModalClose(MODAL_TYPES.ACTIONS)}
        booking={booking}
        onModalOpen={handleModalOpen}
        onManageDisableScrolling={onManageDisableScrolling}
        userType={userType}
        modalTypes={MODAL_TYPES}
      />
      <CancelWeekEndModal
        isOpen={state.openModalType === MODAL_TYPES.CANCEL_WEEK_END}
        onClose={() => handleModalClose(MODAL_TYPES.CANCEL_WEEK_END)}
        otherUserDisplayName={otherUserDisplayName}
        booking={booking}
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
  const { booking, userType, handleModalOpen } = useBookingCard();

  const showRespond =
    booking.attributes.lastTransition === TRANSITION_REQUEST_BOOKING && userType === CAREGIVER;

  return (
    <>
      {showRespond ? (
        <Button className={css.changeButton} onClick={() => handleModalOpen(MODAL_TYPES.RESPOND)}>
          Respond
        </Button>
      ) : (
        <Button className={css.changeButton} onClick={() => handleModalOpen(MODAL_TYPES.ACTIONS)}>
          Actions
        </Button>
      )}
    </>
  );
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
