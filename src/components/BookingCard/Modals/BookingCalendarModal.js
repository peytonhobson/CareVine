import React from 'react';

import { Modal, BookingCalendar } from '../..';

import css from './BookingCardModals.module.css';

const BookingCalendarModal = props => {
  const { isOpen, onClose, onManageDisableScrolling, bookingDates, booking } = props;

  const { bookingSchedule, startDate, endDate } = booking;

  return isOpen ? (
    <Modal
      title="Booking Calendar"
      id="BookingCalendarModal"
      isOpen={isOpen}
      onClose={onClose}
      containerClassName={css.modalContainer}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
    >
      <p className={css.modalTitle} style={{ marginBottom: '1.5rem' }}>
        Booking Calendar
      </p>
      <BookingCalendar
        bookingDates={bookingDates}
        bookingSchedule={bookingSchedule}
        startDate={startDate}
        endDate={endDate}
        noDisabled
      />
    </Modal>
  ) : null;
};

export default BookingCalendarModal;
