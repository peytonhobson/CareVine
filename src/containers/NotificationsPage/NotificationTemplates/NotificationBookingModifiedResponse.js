import React, { useMemo, useEffect, useState } from 'react';

import { BookingException, CancelButton, CancelBookingModal, NamedLink } from '../../../components';
import { makeStyles } from '@material-ui/core/styles';
import { sortExceptionsByDate } from '../../../util/bookings';
import moment from 'moment';
import classNames from 'classnames';
import { EMPLOYER, FULL_WEEKDAY_MAP } from '../../../util/constants';
import Card from '@material-ui/core/Card';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { CANCELED_TRANSITIONS, CANCELABLE_TRANSITIONS } from '../../../util/transaction';
import { fetchTransaction } from '../../../ducks/transactions.duck';
import { isEqual } from 'lodash';

import css from './NotificationTemplates.module.css';

const useStyles = makeStyles(theme => ({
  card: {
    borderRadius: 'var(--borderRadius)',
    transition: 'all 0.2s ease-in 0s !important',
    padding: '3rem',
  },
  innerCard: {
    borderRadius: 'var(--borderRadius)',
    backgroundColor: 'var(--marketplaceColor)',
    color: 'var(--matterColorLight)',
    paddingInline: '2rem',
    minWidth: '20rem',
    maxWidth: 'calc(50% - 0.5rem)',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,

    [theme.breakpoints.down('md')]: {
      maxWidth: '100%',
      minWidth: 'auto',
    },
  },
}));

const filterExceptionsForFuture = exception => {
  return moment(exception.date).isAfter();
};

const NotificationBookingModifiedResponse = props => {
  const [showCancelModal, setShowCancelModal] = useState(false);

  const {
    notification,
    fetchTransactionError,
    fetchTransactionInProgress,
    currentTransaction,
    onFetchTransaction,
  } = props;

  const {
    providerDisplayName,
    txId,
    bookingNumber,
    modification = {},
    isAccepted,
    previousMetadata = {},
  } = notification.metadata;

  useEffect(() => {
    if (txId) {
      onFetchTransaction(txId);
    }
  }, [txId]);

  const handleCloseModal = () => {
    setShowCancelModal(false);
    onFetchTransaction(txId);
  };
  const classes = useStyles();
  const modificationTypes = Object.keys(modification);
  const sortedPreviousExceptions = useMemo(
    () =>
      previousMetadata?.exceptions
        ? Object.values(previousMetadata.exceptions)
            .flat()
            .sort(sortExceptionsByDate)
            .filter(filterExceptionsForFuture)
        : [],
    [previousMetadata]
  );
  const allNewExceptions = useMemo(
    () =>
      modification?.exceptions
        ? Object.values(modification.exceptions)
            .flat()
            .sort(sortExceptionsByDate)
            .filter(filterExceptionsForFuture)
        : [],
    [modification]
  );

  const newSchedule = {
    ...previousMetadata,
    ...modification,
    exceptions: allNewExceptions || sortedPreviousExceptions,
  };

  const isCancelable = CANCELABLE_TRANSITIONS.includes(
    currentTransaction?.attributes.lastTransition
  );
  const isCanceled = CANCELED_TRANSITIONS.includes(currentTransaction?.attributes.lastTransition);

  const bookingNumberLink = (
    <NamedLink
      name="BookingsPageWithTab"
      params={{ tab: 'bookings', search: `?bookingId=${txId}` }}
    >
      #{bookingNumber}
    </NamedLink>
  );

  const differentSchedule = !isEqual(previousMetadata.bookingSchedule, newSchedule.bookingSchedule);
  const differentEndDate = !isEqual(previousMetadata.endDate, newSchedule.endDate);
  const differentExceptions = !isEqual(previousMetadata.exceptions, modification.exceptions);

  return (
    <div className={css.root}>
      <Card className={classes.card}>
        <h1 className={css.title}>Booking Modification {isAccepted ? 'Accepted' : 'Declined'}</h1>
        <p className={classNames(css.message, '!my-8')}>
          {providerDisplayName} has {isAccepted ? 'accepted' : 'declined'} your modification to
          booking {bookingNumberLink}.
        </p>
        <div className="flex flex-col gap-10 justify-center lg:flex-row lg:flex-wrap lg:gap-4">
          <Card className={classes.innerCard}>
            <h2 className="text-center">Original</h2>
            <div>
              <h3 className="underline">Days</h3>
              {previousMetadata?.bookingSchedule?.map((day, index) => {
                const { dayOfWeek, startTime, endTime } = day;

                return (
                  <div key={dayOfWeek}>
                    <p className="my-0 leading-6">
                      {FULL_WEEKDAY_MAP[dayOfWeek]}:{' '}
                      <span className="whitespace-nowrap">
                        {startTime} - {endTime}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
            <div>
              <h3 className="underline">End Date</h3>
              <p>
                {previousMetadata?.endDate
                  ? moment(previousMetadata.endDate).format('ddd, MMM DD')
                  : 'No End Date'}
              </p>
            </div>
            <div>
              <h3 className="underline">Exceptions</h3>
              {sortedPreviousExceptions.length > 0 ? (
                <div className={css.exceptions}>
                  {sortedPreviousExceptions.map(exception => {
                    return (
                      <BookingException
                        {...exception}
                        key={exception.date}
                        className={css.exception}
                      />
                    );
                  })}
                </div>
              ) : (
                <p>No Exceptions</p>
              )}
            </div>
          </Card>
          <Card className={classes.innerCard}>
            <h2 className="text-center">New Booking</h2>
            <div>
              <h3 className="underline">Days</h3>
              {newSchedule.bookingSchedule?.map(day => {
                const { dayOfWeek, startTime, endTime } = day;

                return (
                  <div key={dayOfWeek} className={differentSchedule ? 'text-success' : null}>
                    <p className="my-0 leading-6">
                      {FULL_WEEKDAY_MAP[dayOfWeek]}:{' '}
                      <span className="whitespace-nowrap">
                        {startTime} - {endTime}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
            <div>
              <h3 className="underline">End Date</h3>
              <p className={differentEndDate ? 'text-success' : null}>
                {newSchedule.endDate
                  ? moment(newSchedule.endDate).format('ddd, MMM DD')
                  : 'No End Date'}
              </p>
            </div>
            <div>
              <h3 className="underline">Exceptions</h3>
              {newSchedule.exceptions.length > 0 ? (
                <div
                  className={classNames(css.exceptions, differentExceptions && '!border-success')}
                >
                  {newSchedule.exceptions.map(exception => {
                    return (
                      <BookingException
                        {...exception}
                        key={exception.date}
                        className={classNames(
                          css.exception,
                          differentExceptions && '!border-success'
                        )}
                      />
                    );
                  })}
                </div>
              ) : (
                <p>No Exceptions</p>
              )}
            </div>
          </Card>
        </div>
        {!isAccepted && isCancelable ? (
          <div className="mt-10 flex flex-col items-center">
            <p className="text-primary text-center">
              If you want to cancel this booking, click the button below.
            </p>
            {fetchTransactionError ? (
              <p className={css.modalError}>
                There was an error fetching the transaction. Please try refreshing the page.
              </p>
            ) : null}
            <CancelButton
              className="max-w-[15rem]"
              onClick={() => {
                setShowCancelModal(true);
                window.scrollTo(0, 0);
              }}
              disabled={fetchTransactionInProgress || fetchTransactionError || !currentTransaction}
            >
              Cancel
            </CancelButton>
          </div>
        ) : null}
        {isCanceled ? (
          <h2 className="text-success text-center">This booking has been canceled.</h2>
        ) : null}
      </Card>
      {showCancelModal ? (
        <CancelBookingModal
          isOpen={showCancelModal}
          onClose={handleCloseModal}
          otherUserDisplayName={providerDisplayName}
          userType={EMPLOYER}
          booking={currentTransaction}
          onGoBack={handleCloseModal}
        />
      ) : null}
    </div>
  );
};

const mapStateToProps = state => {
  const {
    fetchTransactionError,
    fetchTransactionInProgress,
    currentTransaction,
  } = state.transactions;

  return {
    fetchTransactionError,
    fetchTransactionInProgress,
    currentTransaction,
  };
};

const mapDispatchToProps = {
  onFetchTransaction: fetchTransaction,
};

export default compose(connect(mapStateToProps, mapDispatchToProps))(
  NotificationBookingModifiedResponse
);
