import React, { useEffect } from 'react';

import classNames from 'classnames';
import { BookingException } from '../../..';
import { checkIsDateInBookingSchedule } from '../../../../util/bookings';
import moment from 'moment';

import css from '../BookingCardModals.module.css';

const findUnapplicableExceptions = (exceptions, weekdays, endDate, appliedDate) =>
  Object.values(exceptions)
    .flat()
    .filter(e => {
      const isDateInBookingSchedule = checkIsDateInBookingSchedule(e.date, weekdays);
      const isAfterEndDate = endDate ? moment(e.date).isAfter(endDate, 'day') : false;
      const isAfterAppliedDate = appliedDate ? moment(e.date).isAfter(appliedDate, 'day') : false;

      if (e.type === 'removeDate' || e.type === 'changeDate') {
        return (!isDateInBookingSchedule || isAfterEndDate) && isAfterAppliedDate;
      }

      if (e.type === 'addDate') {
        return (isDateInBookingSchedule || isAfterEndDate) && isAfterAppliedDate;
      }

      return false;
    });

const UnapplicableExceptions = props => {
  const { weekdays, exceptions, form, endDate, appliedDate } = props;

  const unapplicableExceptions = findUnapplicableExceptions(
    exceptions,
    weekdays,
    endDate,
    appliedDate
  );

  useEffect(() => {
    form.change('unapplicableExceptions', unapplicableExceptions);
  }, [JSON.stringify(unapplicableExceptions)]);

  return unapplicableExceptions.length && weekdays.length ? (
    <div className={css.dropAnimation}>
      <p className="text-sm">
        Based on your new schedule, the following exceptions are no longer applicable and will be
        removed from the booking:
      </p>
      <div className={classNames(css.exceptions, 'border-error')}>
        {unapplicableExceptions.map(exception => {
          return (
            <BookingException
              {...exception}
              key={exception.date}
              className={classNames(css.exception, '!border-error')}
            />
          );
        })}
      </div>
    </div>
  ) : null;
};

export default UnapplicableExceptions;
