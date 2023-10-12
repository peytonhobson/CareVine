import React, { useMemo, useEffect, useState } from 'react';

import { BookingException, CancelButton, CancelBookingModal } from '../../../components';
import { makeStyles } from '@material-ui/core/styles';
import { sortExceptionsByDate } from '../../../util/bookings';
import moment from 'moment';
import classNames from 'classnames';
import { EMPLOYER, FULL_WEEKDAY_MAP } from '../../../util/constants';
import Card from '@material-ui/core/Card';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { CANCELED_TRANSITIONS } from '../../../util/transaction';
import { fetchTransaction } from '../../../ducks/transactions.duck';

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

  const isCanceled = CANCELED_TRANSITIONS.includes(currentTransaction?.attributes.lastTransition);

  return (
    <div className={css.root}>
      <Card className={classes.card}>
        <h1 className={css.title}>Booking Modification {isAccepted ? 'Accepted' : 'Declined'}</h1>
        <p className={classNames(css.message, '!my-8')}>
          {providerDisplayName} has {isAccepted ? 'accepted' : 'declined'} your modification to
          booking #{bookingNumber}.
        </p>
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
            <h2 className="text-center">New Booking</h2>
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
        {isAccepted ? null : (
          <div className="mt-10 flex flex-col items-center">
            <p className="text-primary">
              If you want to cancel this booking, click the button below.
            </p>
            {fetchTransactionError ? (
              <p className={css.modalError}>
                There was an error fetching the transaction. Please try refreshing the page.
              </p>
            ) : null}
            <CancelButton
              className="max-w-[15rem]"
              onClick={() => setShowCancelModal(true)}
              disabled={fetchTransactionInProgress || fetchTransactionError || !currentTransaction}
            >
              Cancel
            </CancelButton>
          </div>
        )}
        {isCanceled ? (
          <div className="mt-10 flex flex-col items-center">
            <h2 className="text-success">This booking has been canceled.</h2>
          </div>
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
