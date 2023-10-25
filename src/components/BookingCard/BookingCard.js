import React, { useReducer, useMemo, createContext, useContext } from 'react';

import {
  Avatar,
  UserDisplayName,
  Button,
  SecondaryButton,
  CancelButton,
  CancelBookingModal,
} from '..';
import {
  TRANSITION_REQUEST_BOOKING,
  CANCELABLE_TRANSITIONS,
  FINAL_TRANSITIONS,
  MODIFIABLE_TRANSITIONS,
  TRANSITION_REQUEST_UPDATE_START,
} from '../../util/transaction';
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
  ChangePaymentMethodModal,
  ActionsModal,
  ChangeEndDateModal,
  ModifyScheduleRecurringModal,
  ModifyExceptionsModal,
  ModifyScheduleSingleModal,
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
    onResetInitialState,
    userType,
    onManageDisableScrolling,
    children,
    intl,
    onFetchCurrentUserListing,
    onResetTransactionsInitialState,
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
    onFetchBooking(txId);
    dispatch({ type: SET_OPEN_MODAL_TYPE, payload: modalType });
  };

  const handleModalClose = modalType => {
    dispatch({ type: CLOSE_MODAL });

    onResetInitialState();
    onResetTransactionsInitialState();
    onFetchBooking(txId);
    onFetchCurrentUserListing();
  };

  const handleGoBackToActions = displayState => {
    handleModalOpen(MODAL_TYPES.ACTIONS);
    onResetInitialState();
    onResetTransactionsInitialState();

    if (displayState) {
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
    bookingLedger[bookingLedger.length - 1].end &&
    moment()
      .subtract(2, 'days')
      .isBefore(bookingLedger[bookingLedger.length - 1].end) &&
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
    availableActions,
  };

  let openModal;
  switch (state.openModalType) {
    case MODAL_TYPES.RESPOND:
      openModal = (
        <ResponseModal
          isOpen={state.openModalType === MODAL_TYPES.RESPOND}
          onClose={() => handleModalClose(MODAL_TYPES.RESPOND)}
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
          onClose={() => handleModalClose(MODAL_TYPES.PAYMENT_DETAILS)}
          onManageDisableScrolling={onManageDisableScrolling}
          booking={booking}
        />
      );
      break;
    case MODAL_TYPES.CANCEL:
      openModal = (
        <CancelBookingModal
          isOpen={state.openModalType === MODAL_TYPES.CANCEL}
          onClose={() => handleModalClose(MODAL_TYPES.CANCEL)}
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
          onClose={() => handleModalClose(MODAL_TYPES.EXCEPTIONS)}
          onManageDisableScrolling={onManageDisableScrolling}
          exceptions={allExceptions}
        />
      );
      break;
    case MODAL_TYPES.CALENDAR:
      openModal = (
        <BookingCalendarModal
          isOpen={state.openModalType === MODAL_TYPES.CALENDAR}
          onClose={() => handleModalClose(MODAL_TYPES.CALENDAR)}
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
          onClose={() => handleModalClose(MODAL_TYPES.DISPUTE)}
        />
      );
      break;
    case MODAL_TYPES.ACTIONS:
      openModal = (
        <ActionsModal
          isOpen={state.openModalType === MODAL_TYPES.ACTIONS}
          onClose={() => handleModalClose(MODAL_TYPES.ACTIONS)}
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
          onClose={() => handleModalClose(MODAL_TYPES.CHANGE_END_DATE)}
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
          onClose={() => handleModalClose(MODAL_TYPES.MODIFY_SCHEDULE_RECURRING)}
          booking={booking}
          onGoBack={handleGoBackToActions}
        />
      );
      break;
    case MODAL_TYPES.MODIFY_SCHEDULE_ONE_TIME:
      openModal = (
        <ModifyScheduleSingleModal
          isOpen={state.openModalType === MODAL_TYPES.MODIFY_SCHEDULE_ONE_TIME}
          onClose={() => handleModalClose(MODAL_TYPES.MODIFY_SCHEDULE_ONE_TIME)}
          booking={booking}
          onGoBack={handleGoBackToActions}
        />
      );
      break;
    case MODAL_TYPES.MODIFY_EXCEPTIONS:
      openModal = (
        <ModifyExceptionsModal
          isOpen={state.openModalType === MODAL_TYPES.MODIFY_EXCEPTIONS}
          onClose={() => handleModalClose(MODAL_TYPES.MODIFY_EXCEPTIONS)}
          booking={booking}
          onGoBack={handleGoBackToActions}
        />
      );
      break;
    case MODAL_TYPES.CHANGE_PAYMENT_METHOD:
      openModal = (
        <ChangePaymentMethodModal
          isOpen={state.openModalType === MODAL_TYPES.CHANGE_PAYMENT_METHOD}
          onClose={() => handleModalClose(MODAL_TYPES.CHANGE_PAYMENT_METHOD)}
          booking={booking}
          onGoBack={handleGoBackToActions}
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
  const { booking, userType, handleModalOpen, availableActions } = useBookingCard();

  const lastTransition = booking.attributes.lastTransition;
  const showRespond =
    (lastTransition === TRANSITION_REQUEST_BOOKING ||
      lastTransition === TRANSITION_REQUEST_UPDATE_START) &&
    userType === CAREGIVER;

  const showActions = Object.values(availableActions).some(action => action);

  return (
    <>
      {showRespond ? (
        <Button className={css.changeButton} onClick={() => handleModalOpen(MODAL_TYPES.RESPOND)}>
          Respond
        </Button>
      ) : showActions ? (
        <Button className={css.changeButton} onClick={() => handleModalOpen(MODAL_TYPES.ACTIONS)}>
          Actions
        </Button>
      ) : null}
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
      {startDate && scheduleType === 'recurring' ? (
        <div className="mb-4">
          <p className="text-primary my-0 text-lg">
            Start Date: {moment(startDate).format('dddd, MMM DD')}{' '}
          </p>
          {endDate ? (
            <p className="text-primary my-0 text-lg">
              End Date: {moment(endDate).format('dddd, MMM DD')}
            </p>
          ) : null}
        </div>
      ) : null}
      <h2 className="mt-0">{scheduleType === 'recurring' ? 'Weekly' : null} Schedule</h2>
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

export const BookingCardDetailsButtons = () => {
  const { booking, handleModalOpen } = useBookingCard();

  const { type: scheduleType, exceptions = {} } = booking.attributes.metadata;

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
          onClick={() => handleModalOpen(MODAL_TYPES.CALENDAR)}
        >
          View Calendar
        </SecondaryButton>
      ) : allExceptions.length ? (
        <CancelButton
          className={css.viewButton}
          onClick={() => handleModalOpen(MODAL_TYPES.EXCEPTIONS)}
        >
          Schedule Exceptions
        </CancelButton>
      ) : null}
    </div>
  );
};
