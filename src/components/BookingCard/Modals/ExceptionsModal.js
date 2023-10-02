import React from 'react';

import { Modal, BookingException } from '../..';

import css from './BookingCardModals.module.css';

const ExceptionsModal = props => {
  const { isOpen, onClose, onManageDisableScrolling, exceptions } = props;

  return isOpen ? (
    <Modal
      title="Booking Exceptions"
      id="BookingExceptionsModal"
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
      containerClassName={css.modalContainer}
    >
      <p className={css.modalTitle}>Booking Exceptions</p>
      <p className={css.modalMessage}>
        Listed below are days that are different from the regular booking schedule.
      </p>
      <div className={css.exceptions}>
        {exceptions.map(exception => {
          return <BookingException {...exception} key={exception.date} className={css.exception} />;
        })}
      </div>
    </Modal>
  ) : null;
};

export default ExceptionsModal;
