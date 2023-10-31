import React, { useReducer, useMemo, createContext, useContext } from 'react';

import { Avatar, UserDisplayName, Button, SecondaryButton, CancelBookingModal } from '..';
import {
  TRANSITION_REQUEST_BOOKING,
  CANCELABLE_TRANSITIONS,
  FINAL_TRANSITIONS,
  MODIFIABLE_TRANSITIONS,
  TRANSITION_REQUEST_UPDATE_START,
} from '../../util/transaction';
import MuiTablePagination from '@mui/material/TablePagination';
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
  ChangePaymentMethodModal,
  ActionsModal,
  ChangeEndDateModal,
  ModifyScheduleRecurringModal,
  ModifyExceptionsModal,
  ModifyScheduleSingleModal,
  BookingDetailsModal,
  FullWeeklyScheduleModal,
} from './Modals';
import { calculateTimeBetween } from '../../util/dates';
import { v4 as uuid } from 'uuid';

import css from './BookingCards.module.css';

const MODAL_TYPES = {
  ACTIONS: 'actions',
  CALENDAR: 'calendar',
  CANCEL: 'cancel',
  CHANGE_END_DATE: 'changeEndDate',
  CHANGE_PAYMENT_METHOD: 'changePaymentMethod',
  DISPUTE: 'dispute',
  EXCEPTIONS: 'exceptions',
  MODIFY_EXCEPTIONS: 'modifyExceptions',
  MODIFY_SCHEDULE_ONE_TIME: 'modifyScheduleOneTime',
  MODIFY_SCHEDULE_RECURRING: 'modifyScheduleRecurring',
  PAYMENT_DETAILS: 'paymentDetails',
  RESPOND: 'respond',
  BOOKING_DETAILS: 'bookingDetails',
  FULL_WEEKLY_SCHEDULE: 'fullWeeklySchedule',
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
const SET_ACTIONS_DISPLAY_STATE = 'SET_ACTIONS_DISPLAY_STATE';

const reducer = (state, action) => {
  switch (action.type) {
    case SET_OPEN_MODAL_TYPE:
      return { ...state, openModalType: action.payload };
    case CLOSE_MODAL:
      return { ...state, openModalType: null };
    case SET_BOOKING_TIMES_PAGE:
      return { ...state, bookingTimesPage: action.payload };
    case SET_ACTIONS_DISPLAY_STATE:
      return { ...state, actionsDisplayState: action.payload };
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
    onFetchBooking,
    onFetchBookings,
    onResetInitialState,
    userType,
    onManageDisableScrolling,
    children,
    intl,
    onFetchCurrentUserListing,
    onResetTransactionsInitialState,
    currentTab,
    isMobile,
  } = props;

  const txId = booking.id.uuid;
  const bookingMetadata = booking.attributes.metadata;
  const lastTransition = booking.attributes.lastTransition;
  const {
    lineItems,
    exceptions = {
      addedDays: [],
      removedDays: [],
      changedDays: [],
    },
    ledger: bookingLedger = [],
    type: bookingType,
  } = bookingMetadata;

  const { customer, provider } = booking;
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
    onFetchBooking(txId);
    dispatch({ type: SET_OPEN_MODAL_TYPE, payload: modalType });
  };

  const handleModalClose = (fetchAll = false, fetchAllTab) => {
    dispatch({ type: CLOSE_MODAL });

    onResetInitialState();
    onResetTransactionsInitialState();
    onFetchCurrentUserListing();

    // Fetch all must be equal to true to not be triggered by event
    if (fetchAll === true) {
      onFetchBookings(fetchAllTab);
    } else {
      onFetchBooking(txId);
    }
  };

  const handleGoBackToActions = displayState => {
    handleModalOpen(MODAL_TYPES.ACTIONS);
    onResetInitialState();
    onResetTransactionsInitialState();

    if (typeof displayState === 'string') {
      dispatch({ type: SET_ACTIONS_DISPLAY_STATE, payload: displayState });
    }
  };

  const setBookingTimesPage = page => dispatch({ type: SET_BOOKING_TIMES_PAGE, payload: page });

  const isCancelable = CANCELABLE_TRANSITIONS.includes(lastTransition);
  const isRequest =
    lastTransition === TRANSITION_REQUEST_BOOKING ||
    lastTransition === TRANSITION_REQUEST_UPDATE_START;
  const isModifiable =
    MODIFIABLE_TRANSITIONS.includes(lastTransition) && (isRequest || bookingType === 'recurring');
  const canChangePaymentMethod =
    bookingType === 'recurring' && !FINAL_TRANSITIONS.includes(lastTransition);

  const hasCurrentDispute =
    bookingLedger.length > 0 && bookingLedger[bookingLedger.length - 1].dispute;
  const isDisputable =
    bookingLedger.length > 0 &&
    bookingLedger[bookingLedger.length - 1].createdAt &&
    moment()
      .subtract(2, 'days')
      .isBefore(bookingLedger[bookingLedger.length - 1].createdAt) &&
    !hasCurrentDispute;

  const availableActions = {
    cancel: isCancelable,
    modifySchedule: isModifiable && userType === EMPLOYER,
    changePaymentMethod: canChangePaymentMethod && userType === EMPLOYER,
    dispute: isDisputable && userType === EMPLOYER,
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
    availableActions,
  };

  let openModal;
  switch (state.openModalType) {
    case MODAL_TYPES.RESPOND:
      openModal = (
        <ResponseModal
          isOpen={state.openModalType === MODAL_TYPES.RESPOND}
          onClose={handleModalClose}
          customerDisplayName={otherUserDisplayName}
          booking={booking}
          bookingDates={bookingDates}
          allExceptions={allExceptions}
        />
      );
      break;
    case MODAL_TYPES.PAYMENT_DETAILS:
      openModal = (
        <PaymentDetailsModal
          isOpen={state.openModalType === MODAL_TYPES.PAYMENT_DETAILS}
          onClose={handleModalClose}
          onManageDisableScrolling={onManageDisableScrolling}
          booking={booking}
        />
      );
      break;
    case MODAL_TYPES.CANCEL:
      openModal = (
        <CancelBookingModal
          isOpen={state.openModalType === MODAL_TYPES.CANCEL}
          onClose={() => handleModalClose(true, currentTab)}
          otherUserDisplayName={otherUserDisplayName}
          userType={userType}
          booking={booking}
          onGoBack={handleGoBackToActions}
        />
      );
      break;
    case MODAL_TYPES.EXCEPTIONS:
      openModal = (
        <ExceptionsModal
          isOpen={state.openModalType === MODAL_TYPES.EXCEPTIONS}
          onClose={handleModalClose}
          onManageDisableScrolling={onManageDisableScrolling}
          exceptions={allExceptions}
        />
      );
      break;
    case MODAL_TYPES.CALENDAR:
      openModal = (
        <BookingCalendarModal
          isOpen={state.openModalType === MODAL_TYPES.CALENDAR}
          onClose={handleModalClose}
          onManageDisableScrolling={onManageDisableScrolling}
          bookingDates={bookingDates}
          booking={booking}
        />
      );
      break;
    case MODAL_TYPES.DISPUTE:
      openModal = (
        <DisputeModal
          isOpen={state.openModalType === MODAL_TYPES.DISPUTE}
          onClose={handleModalClose}
          booking={booking}
        />
      );
      break;
    case MODAL_TYPES.ACTIONS:
      openModal = (
        <ActionsModal
          isOpen={state.openModalType === MODAL_TYPES.ACTIONS}
          onClose={handleModalClose}
          booking={booking}
          onModalOpen={handleModalOpen}
          onManageDisableScrolling={onManageDisableScrolling}
          userType={userType}
          modalTypes={MODAL_TYPES}
          availableActions={availableActions}
          actionsDisplayState={state.actionsDisplayState}
          onSetActionsDisplayState={displayState =>
            dispatch({ type: SET_ACTIONS_DISPLAY_STATE, payload: displayState })
          }
        />
      );
      break;
    case MODAL_TYPES.CHANGE_END_DATE:
      openModal = (
        <ChangeEndDateModal
          isOpen={state.openModalType === MODAL_TYPES.CHANGE_END_DATE}
          onClose={handleModalClose}
          otherUserDisplayName={otherUserDisplayName}
          booking={booking}
          onGoBack={handleGoBackToActions}
        />
      );
      break;
    case MODAL_TYPES.MODIFY_SCHEDULE_RECURRING:
      openModal = (
        <ModifyScheduleRecurringModal
          isOpen={state.openModalType === MODAL_TYPES.MODIFY_SCHEDULE_RECURRING}
          onClose={handleModalClose}
          booking={booking}
          onGoBack={handleGoBackToActions}
        />
      );
      break;
    case MODAL_TYPES.MODIFY_SCHEDULE_ONE_TIME:
      openModal = (
        <ModifyScheduleSingleModal
          isOpen={state.openModalType === MODAL_TYPES.MODIFY_SCHEDULE_ONE_TIME}
          onClose={handleModalClose}
          booking={booking}
          onGoBack={handleGoBackToActions}
        />
      );
      break;
    case MODAL_TYPES.MODIFY_EXCEPTIONS:
      openModal = (
        <ModifyExceptionsModal
          isOpen={state.openModalType === MODAL_TYPES.MODIFY_EXCEPTIONS}
          onClose={handleModalClose}
          booking={booking}
          onGoBack={handleGoBackToActions}
        />
      );
      break;
    case MODAL_TYPES.CHANGE_PAYMENT_METHOD:
      openModal = (
        <ChangePaymentMethodModal
          isOpen={state.openModalType === MODAL_TYPES.CHANGE_PAYMENT_METHOD}
          onClose={handleModalClose}
          booking={booking}
          onGoBack={handleGoBackToActions}
        />
      );
      break;
    case MODAL_TYPES.BOOKING_DETAILS:
      openModal = (
        <BookingDetailsModal
          isOpen={state.openModalType === MODAL_TYPES.BOOKING_DETAILS}
          onClose={handleModalClose}
          booking={booking}
          onManageDisableScrolling={onManageDisableScrolling}
          modalTypes={MODAL_TYPES}
          allExceptions={allExceptions}
          onModalOpen={handleModalOpen}
        />
      );
      break;
    case MODAL_TYPES.FULL_WEEKLY_SCHEDULE:
      openModal = (
        <FullWeeklyScheduleModal
          isOpen={state.openModalType === MODAL_TYPES.FULL_WEEKLY_SCHEDULE}
          onClose={handleModalClose}
          booking={booking}
          onManageDisableScrolling={onManageDisableScrolling}
          allExceptions={allExceptions}
        />
      );
      break;
    default:
      openModal = null;
  }

  return (
    <BookingCardContext.Provider value={contextValue}>
      <div className={css.bookingCard}>{children}</div>
      {openModal}
    </BookingCardContext.Provider>
  );
};

export const BookingCard = compose(injectIntl)(BookingCardComponent);

export const BookingCardTitle = () => {
  const { isMobile, otherUser, userType, booking, otherUserDisplayName } = useBookingCard();

  const { listing } = booking;
  const { bookingNumber, senderListingTitle } = booking.attributes.metadata;

  const TitleTag = isMobile ? 'h3' : 'h2';
  const isCaregiver = userType === CAREGIVER;

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
  const { booking, userType, handleModalOpen, availableActions } = useBookingCard();

  const lastTransition = booking.attributes.lastTransition;
  const showRespond =
    (lastTransition === TRANSITION_REQUEST_BOOKING ||
      lastTransition === TRANSITION_REQUEST_UPDATE_START) &&
    userType === CAREGIVER;

  const showActions = Object.values(availableActions).some(Boolean);

  return (
    <>
      {showRespond ? (
        <Button className="min-h-0 py-2 px-4" onClick={() => handleModalOpen(MODAL_TYPES.RESPOND)}>
          Respond
        </Button>
      ) : (
        <div className="flex w-full md:w-auto gap-4 md:flex-col">
          {showActions ? (
            <Button
              className="min-h-0 py-4 px-4 md:py-2"
              onClick={() => handleModalOpen(MODAL_TYPES.ACTIONS)}
            >
              Manage Booking
            </Button>
          ) : null}
          <SecondaryButton
            className="min-h-0 py-4 px-4 md:py-2"
            onClick={() => handleModalOpen(MODAL_TYPES.BOOKING_DETAILS)}
          >
            Booking Details
          </SecondaryButton>
        </div>
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

  const { type: scheduleType } = booking.attributes.metadata;

  return (
    <div className={css.dateTimesContainer}>
      <h2 className="mt-0 mb-3">{scheduleType === 'recurring' ? 'Weekly' : null} Schedule</h2>
      <div className="flex justify-between">{children}</div>
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
                <div className={css.bookingTime} key={uuid()}>
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
  const {
    isMobile,
    booking,
    bookingTimes,
    bookingTimesPage,
    setBookingTimesPage,
  } = useBookingCard();

  const { bookingSchedule, type: scheduleType } = booking.attributes.metadata;

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

export const BookingStartEndDates = () => {
  const { booking } = useBookingCard();

  const { startDate, endDate, type: scheduleType } = booking.attributes.metadata;

  return startDate && scheduleType === 'recurring' ? (
    <div className="mb-4">
      <p className="text-primary my-0 text-lg whitespace-nowrap">
        Start Date: {moment(startDate).format('MMM DD')}{' '}
      </p>
      {endDate ? (
        <p className="text-primary my-0 text-lg whitespace-nowrap">
          End Date: {moment(endDate).format('MMM DD')}
        </p>
      ) : null}
    </div>
  ) : null;
};

export const BookingScheduleMobile = () => {
  const { booking, bookingTimes } = useBookingCard();

  const { bookingSchedule, type: scheduleType } = booking.attributes.metadata;

  if (scheduleType === 'recurring') {
    return (
      <div className="mb-10 w-full">
        <h2 className="mt-0 mb-6 text-center underline">Weekly Schedule</h2>
        <div className="flex justify-center flex-wrap gap-4">
          {bookingSchedule.map(b => {
            const { dayOfWeek } = b;
            const formattedDayOfWeek = dayOfWeek.toUpperCase();

            return (
              <div
                className="bg-secondary h-16 w-16 text-light rounded-full flex justify-center items-center"
                key={dayOfWeek}
              >
                <h3 className="text-center">{formattedDayOfWeek}</h3>
              </div>
            );
          })}
        </div>
      </div>
    );
  } else if (scheduleType === 'oneTime') {
    return (
      <div className="mb-10 w-full">
        <h2 className="mt-0 mb-6 text-center underline">Schedule</h2>
        <div className="flex justify-center flex-wrap gap-4">
          {bookingTimes.map(time => {
            const { date } = time;
            const formattedDate = moment(date).format('MM/DD');
            return (
              <div
                className="bg-secondary h-16 w-16 text-light rounded-full flex justify-center items-center"
                key={date}
              >
                <h3>{formattedDate}</h3>
              </div>
            );
          })}
        </div>
      </div>
    );
  } else {
    return null;
  }
};
