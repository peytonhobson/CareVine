import React, { useMemo, useEffect } from 'react';

import { IconSpinner, BookingException } from '../../../components';
import { makeStyles } from '@material-ui/core/styles';
import { sortExceptionsByDate } from '../../../util/bookings';
import moment from 'moment';

import Card from '@material-ui/core/Card';

import css from './NotificationTemplates.module.css';

const useStyles = makeStyles(theme => ({
  card: {
    borderRadius: 'var(--borderRadius)',
    transition: 'all 0.2s ease-in 0s !important',
    padding: '3rem',
  },
}));

// TODO: Make it so you can't accept if request is more than 72 hours or end Date or exceptions are in past

const NotificationBookingModified = props => {
  const {
    notification,
    currentTransaction,
    fetchTransactionError,
    fetchTransactionInProgress,
    onFetchTransaction,
  } = props;

  const { bookingSchedule = [], endDate, exceptions = {} } =
    currentTransaction?.attributes.metadata ?? {};

  const {
    customerDisplayName,
    txId,
    isRequest,
    bookingNumber,
    modification,
  } = notification.metadata;
  const sortedExceptions = useMemo(
    () =>
      Object.values(exceptions)
        .flat()
        .sort(sortExceptionsByDate) ?? [],
    [exceptions]
  );

  useEffect(() => {
    if (txId) {
      onFetchTransaction(txId);
    }
  }, [txId]);

  const classes = useStyles();

  const modificationType = Object.keys(modification)[0];

  const newSchedule = {
    bookingSchedule,
    endDate,
    exceptions: sortedExceptions,
    ...modification,
  };

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
          <p className={css.message}>
            {customerDisplayName} has requested a modification to booking #{bookingNumber}.
          </p>
          <p className={css.message}>Below are the requested change(s):</p>
          <div className="grid grid-cols-2">
            <div>
              <h2>Original</h2>
              <div className={modificationType === 'bookingSchedule' ? 'text-error' : null}>
                <h3>Days</h3>
                {bookingSchedule.map((day, index) => {
                  const { dayOfWeek, startTime, endTime } = day;

                  return (
                    <div key={dayOfWeek}>
                      <p>
                        {dayOfWeek}: {startTime} - {endTime}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className={modificationType === 'endDate' ? 'text-error' : null}>
                <h3>End Date</h3>
                <p>{endDate ? moment(endDate).format('ddd, MMM DD') : 'No End Date'}</p>
              </div>
              <div className={modificationType === 'exceptions' ? 'text-error' : null}>
                <h3>Exceptions</h3>
                {sortedExceptions.length > 0 ? (
                  sortedExceptions.map(exception => {
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
            </div>
            <div>
              <h2>Requested Change</h2>
              <div className={modificationType === 'bookingSchedule' ? 'text-success' : null}>
                <h3>Days</h3>
                {newSchedule.bookingSchedule.map(day => {
                  const { dayOfWeek, startTime, endTime } = day;

                  return (
                    <div key={dayOfWeek}>
                      <p>
                        {dayOfWeek}: {startTime} - {endTime}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className={modificationType === 'endDate' ? 'text-success' : null}>
                <h3>End Date</h3>
                <p>
                  {newSchedule.endDate
                    ? moment(newSchedule.endDate).format('ddd, MMM DD')
                    : 'No End Date'}
                </p>
              </div>
              <div className={modificationType === 'exceptions' ? 'text-success' : null}>
                <h3>Exceptions</h3>
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
            </div>
          </div>
        </Card>
      ) : null}
      {fetchTransactionError ? (
        <div className={css.fullContainer}>
          <p className={css.errorText}>Error fetchin notification.</p>
        </div>
      ) : null}
    </div>
  );
};

export default NotificationBookingModified;
