import React, { useMemo, useEffect } from 'react';

import { IconSpinner, BookingException, CancelButton, PrimaryButton } from '../../../components';
import { makeStyles } from '@material-ui/core/styles';
import { sortExceptionsByDate } from '../../../util/bookings';
import moment from 'moment';
import classNames from 'classnames';
import { FULL_WEEKDAY_MAP } from '../../../util/constants';
import Card from '@material-ui/core/Card';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { fetchTransaction } from '../../../ducks/transactions.duck';
import { acceptBookingModification, declineBookingModification } from '../NotificationsPage.duck';

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
  },
}));

const filterExceptionsForFuture = exception => {
  return moment(exception.date).isAfter();
};

const NotificationBookingModified = props => {
  const {
    notification,
    currentTransaction,
    fetchTransactionError,
    fetchTransactionInProgress,
    onFetchTransaction,
    acceptBookingModificationInProgress,
    acceptBookingModificationError,
    onAccept,
    declineBookingModificationInProgress,
    declineBookingModificationError,
    onDecline,
  } = props;

  const createdAt = moment(notification.createdAt);
  const {
    customerDisplayName,
    txId,
    isRequest,
    bookingNumber,
    modification = {},
    expiration,
    accepted,
    declined,
    previousMetadata = {},
  } = notification.metadata;

  useEffect(() => {
    if (txId) {
      onFetchTransaction(txId);
    }
  }, [txId, notification.metadata]);

  const classes = useStyles();

  const modificationType = Object.keys(modification)[0];

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

  const newSchedule = {
    ...previousMetadata,
    exceptions: sortedPreviousExceptions,
    ...modification,
  };

  const isExpired =
    moment(expiration).isBefore(moment()) ||
    moment(createdAt)
      .add(3, 'days')
      .isBefore();

  return (
    <div className={css.root}>
      {fetchTransactionInProgress ? (
        <div className={css.fullContainer}>
          <IconSpinner className={css.bookingRequestSpinner} />
        </div>
      ) : null}
      {currentTransaction?.id.uuid === txId ? (
        <Card className={classes.card}>
          <h1 className={css.title}>Booking Modification {isRequest ? 'Request' : ''}</h1>
          {isRequest ? (
            <p className={classNames(css.message, '!my-8')}>
              {customerDisplayName} has requested a modification to booking #{bookingNumber}.
            </p>
          ) : (
            <p className={classNames(css.message, '!my-8')}>
              {customerDisplayName} has modified booking #{bookingNumber}.
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Card className={classes.innerCard}>
              <h2 className="text-center">Original</h2>
              <div>
                <h3 className="underline">Days</h3>
                {previousMetadata?.bookingSchedule?.map((day, index) => {
                  const { dayOfWeek, startTime, endTime } = day;

                  return (
                    <div
                      key={dayOfWeek}
                      className={modificationType === 'bookingSchedule' ? 'text-error' : null}
                    >
                      <p className="my-0 leading-6">
                        {FULL_WEEKDAY_MAP[dayOfWeek]}: {startTime} - {endTime}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div>
                <h3 className="underline">End Date</h3>
                <p className={modificationType === 'endDate' ? 'text-error' : null}>
                  {previousMetadata?.endDate
                    ? moment(previousMetadata.endDate).format('ddd, MMM DD')
                    : 'No End Date'}
                </p>
              </div>
              <div className={modificationType === 'exceptions' ? 'text-error' : null}>
                <h3 className="underline">Exceptions</h3>
                {sortedPreviousExceptions.length > 0 ? (
                  sortedPreviousExceptions.map(exception => {
                    return (
                      <BookingException
                        {...exception}
                        key={exception.date}
                        className={css.exception}
                      />
                    );
                  })
                ) : (
                  <p>No Exceptions</p>
                )}
              </div>
            </Card>
            <Card className={classes.innerCard}>
              <h2 className="text-center">{isRequest ? 'Requested ' : ''}Change</h2>
              <div>
                <h3 className="underline">Days</h3>
                {newSchedule.bookingSchedule?.map(day => {
                  const { dayOfWeek, startTime, endTime } = day;

                  return (
                    <div
                      key={dayOfWeek}
                      className={modificationType === 'bookingSchedule' ? 'text-success' : null}
                    >
                      <p className="my-0 leading-6">
                        {FULL_WEEKDAY_MAP[dayOfWeek]}: {startTime} - {endTime}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div>
                <h3 className="underline">End Date</h3>
                <p className={modificationType === 'endDate' ? 'text-success' : null}>
                  {newSchedule.endDate
                    ? moment(newSchedule.endDate).format('ddd, MMM DD')
                    : 'No End Date'}
                </p>
              </div>
              <div className={modificationType === 'exceptions' ? 'text-success' : null}>
                <h3 className="underline">Exceptions</h3>
                {newSchedule.exceptions.length > 0 ? (
                  newSchedule.exceptions.map(exception => {
                    return (
                      <BookingException
                        {...exception}
                        key={exception.date}
                        className={css.exception}
                      />
                    );
                  })
                ) : (
                  <p>No Exceptions</p>
                )}
              </div>
            </Card>
          </div>
          {isRequest ? (
            <>
              {declineBookingModificationError ? (
                <p className="text-error text-center">Failed to decline.</p>
              ) : null}
              {acceptBookingModificationError ? (
                <p className="text-error text-center">Failed to accept.</p>
              ) : null}
              {!isExpired && !accepted && !declined ? (
                <div className="flex mt-16 justify-evenly">
                  <CancelButton
                    className="max-w-[15rem]"
                    onClick={() => onDecline(notification)}
                    inProgress={declineBookingModificationInProgress}
                    disabled={
                      declineBookingModificationInProgress || acceptBookingModificationInProgress
                    }
                  >
                    Decline
                  </CancelButton>
                  <PrimaryButton
                    className="max-w-[15rem]"
                    onClick={() => onAccept(notification)}
                    inProgress={acceptBookingModificationInProgress}
                    disabled={
                      acceptBookingModificationInProgress || declineBookingModificationInProgress
                    }
                  >
                    Accept
                  </PrimaryButton>
                </div>
              ) : null}
              {isExpired ? (
                <h2 className="text-error text-center">This request is expired.</h2>
              ) : null}
              {accepted ? (
                <h2 className="text-success text-center">You accepted this request.</h2>
              ) : null}
              {declined ? (
                <h2 className="text-error text-center">You declined this request.</h2>
              ) : null}
            </>
          ) : null}
        </Card>
      ) : null}
      {fetchTransactionError ? (
        <div className={css.fullContainer}>
          <p className={css.errorText}>Error fetching notification.</p>
        </div>
      ) : null}
    </div>
  );
};

const mapStateToProps = state => {
  const {
    currentTransaction,
    fetchTransactionError,
    fetchTransactionInProgress,
  } = state.transactions;

  const {
    acceptBookingModificationInProgress,
    acceptBookingModificationError,
    declineBookingModificationInProgress,
    declineBookingModificationError,
  } = state.NotificationsPage;

  return {
    currentTransaction,
    fetchTransactionError,
    fetchTransactionInProgress,
    acceptBookingModificationInProgress,
    acceptBookingModificationError,
    declineBookingModificationInProgress,
    declineBookingModificationError,
  };
};

const mapDispatchToProps = {
  onFetchTransaction: fetchTransaction,
  onAccept: acceptBookingModification,
  onDecline: declineBookingModification,
};

export default compose(connect(mapStateToProps, mapDispatchToProps))(NotificationBookingModified);
