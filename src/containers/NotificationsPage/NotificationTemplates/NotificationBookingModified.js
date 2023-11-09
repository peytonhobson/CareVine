import React, { useMemo } from 'react';

import { BookingException, CancelButton, PrimaryButton, NamedLink } from '../../../components';
import { makeStyles } from '@material-ui/core/styles';
import { sortExceptionsByDate } from '../../../util/bookings';
import moment from 'moment';
import classNames from 'classnames';
import { FULL_WEEKDAY_MAP } from '../../../util/constants';
import Card from '@material-ui/core/Card';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { acceptBookingModification, declineBookingModification } from '../NotificationsPage.duck';
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

const NotificationBookingModified = props => {
  const {
    notification,
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

  const classes = useStyles();

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

  const isExpired =
    moment(expiration).isBefore(moment()) ||
    moment(createdAt)
      .add(3, 'days')
      .isBefore();

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
        <h1 className={css.title}>Booking Modification {isRequest ? 'Request' : ''}</h1>
        {isRequest ? (
          <p className={classNames(css.message, '!my-8')}>
            {customerDisplayName} has requested a modification to booking {bookingNumberLink}.
          </p>
        ) : (
          <p className={classNames(css.message, '!my-8')}>
            {customerDisplayName} has modified booking {bookingNumberLink}.
          </p>
        )}
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
            <h2 className="text-center">{isRequest ? 'Requested ' : ''}Change</h2>
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

              {newSchedule.exceptions.flat().length > 0 ? (
                <div
                  className={classNames(css.exceptions, differentExceptions && '!border-success')}
                >
                  {newSchedule.exceptions.flat().map(exception => {
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
        {isRequest ? (
          <>
            {declineBookingModificationError ? (
              <p className="text-error text-center">Failed to decline.</p>
            ) : null}
            {acceptBookingModificationError ? (
              <p className="text-error text-center">Failed to accept.</p>
            ) : null}
            {!isExpired && !accepted && !declined ? (
              <div className="flex mt-16 justify-evenly gap-4">
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
    </div>
  );
};

const mapStateToProps = state => {
  const {
    acceptBookingModificationInProgress,
    acceptBookingModificationError,
    declineBookingModificationInProgress,
    declineBookingModificationError,
  } = state.NotificationsPage;

  return {
    acceptBookingModificationInProgress,
    acceptBookingModificationError,
    declineBookingModificationInProgress,
    declineBookingModificationError,
  };
};

const mapDispatchToProps = {
  onAccept: acceptBookingModification,
  onDecline: declineBookingModification,
};

export default compose(connect(mapStateToProps, mapDispatchToProps))(NotificationBookingModified);
