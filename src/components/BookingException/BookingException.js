import React from 'react';

import moment from 'moment';
import { IconClose } from '../Icons';
import classNames from 'classnames';

import css from './BookingException.module.css';

const ADD_DATE = 'addDate';
const REMOVE_DATE = 'removeDate';
const CHANGE_DATE = 'changeDate';

const BookingException = props => {
  const { date, startTime, endTime, type, onRemoveException, className } = props;

  return (
    <div className={className || css.exception}>
      <div className={css.exceptionHeader}>
        <div className={css.exceptionAvailability}>
          <div
            className={classNames(css.exceptionAvailabilityDot, {
              [css.isAvailable]: type === ADD_DATE,
              [css.isChanged]: type === CHANGE_DATE,
            })}
          />
          <div className={css.exceptionAvailabilityStatus}>
            {type === ADD_DATE && 'Add Day'}
            {type === REMOVE_DATE && 'Remove Day'}
            {type === CHANGE_DATE && 'Change Day'}
          </div>
        </div>
        {onRemoveException ? (
          <button className={css.removeExceptionButton} onClick={onRemoveException}>
            <IconClose size="normal" className={css.removeIcon} />
          </button>
        ) : null}
      </div>
      <p className={css.timeRange}>
        {moment(date).format('dddd, MMM DD')}
        {type !== REMOVE_DATE ? (
          <span>
            ,{' '}
            <span className="whitespace-nowrap">
              {startTime} - {endTime}
            </span>
          </span>
        ) : (
          ''
        )}
      </p>
    </div>
  );
};

export default BookingException;
