import React from 'react';

import { Modal, BookingException } from '../..';
import { FULL_WEEKDAY_MAP } from '../../../util/constants';
import { calculateTimeBetween } from '../../../util/dates';
import moment from 'moment';

import css from './BookingCardModals.module.css';

const FullWeeklyScheduleModal = props => {
  const { isOpen, onClose, onManageDisableScrolling, booking, allExceptions } = props;

  const { bookingSchedule, startDate, endDate } = booking.attributes.metadata;

  return isOpen ? (
    <Modal
      title="Full Weekly Schedule"
      id="FullWeeklyScheduleModal"
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
      containerClassName={css.modalContainer}
    >
      <p className={css.modalTitle}>Booking Schedule</p>
      <div className="mb-4 mt-10">
        <h2 className="text-primary my-0 text- whitespace-nowrap text-center">
          Start Date: {moment(startDate).format('MMM DD')}{' '}
        </h2>
        {endDate ? (
          <h2 className="text-primary my-0 text-xl whitespace-nowrap text-center">
            End Date: {moment(endDate).format('MMM DD')}
          </h2>
        ) : null}
      </div>
      <div className="flex justify-center">
        <div className={'flex flex-wrap gap-x-2 gap-y-4 mt-6 flex-grow-0 justify-center'}>
          {bookingSchedule.map(b => {
            const { startTime, endTime, dayOfWeek } = b;
            return (
              <div
                className="border-negative border-solid border py-2 px-4 whitespace-nowrap flex flex-col justify-center"
                key={dayOfWeek}
              >
                <h3 className="text-xl my-0">{FULL_WEEKDAY_MAP[dayOfWeek]}</h3>
                <span className="text-md">
                  {startTime} - {endTime}
                </span>
                <p className="text-sm my-0">({calculateTimeBetween(startTime, endTime)} hours)</p>
              </div>
            );
          })}
        </div>
      </div>
      {allExceptions.length ? (
        <>
          <h2 className="underline mt-10">Exceptions</h2>
          <div className={css.exceptions}>
            {allExceptions.map(exception => {
              return (
                <BookingException {...exception} key={exception.date} className={css.exception} />
              );
            })}
          </div>
        </>
      ) : null}
    </Modal>
  ) : null;
};

export default FullWeeklyScheduleModal;
