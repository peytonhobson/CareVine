import React from 'react';

import { Modal, CancelButton, Button, PrimaryButton } from '../..';
import {
  CANCELABLE_TRANSITIONS,
  TRANSITION_REQUEST_BOOKING,
  MODIFIABLE_TRANSITIONS,
} from '../../../util/transaction';
import { EMPLOYER } from '../../../util/constants';
import moment from 'moment';

import css from './BookingCardModals.module.css';

const ActionsModal = props => {
  const {
    isOpen,
    onClose,
    onManageDisableScrolling,
    onModalOpen,
    booking,
    userType,
    modalTypes,
  } = props;

  const lastTransition = booking.attributes.lastTransition;
  const { ledger: bookingLedger = [], type: bookingType } = booking.attributes.metadata;

  const isRequest = lastTransition === TRANSITION_REQUEST_BOOKING;
  const isCancelable = CANCELABLE_TRANSITIONS.includes(lastTransition);
  const isModifiable = MODIFIABLE_TRANSITIONS.includes(lastTransition) && userType === EMPLOYER;
  const canChangePaymentMethod = bookingType === 'recurring' && userType === EMPLOYER;

  const hasCurrentDispute =
    bookingLedger.length > 0 && bookingLedger[bookingLedger.length - 1].dispute;
  const isDisputable =
    bookingLedger.length > 0 &&
    bookingLedger[bookingLedger.length - 1].end &&
    moment(bookingLedger[bookingLedger.length - 1].end).isAfter(moment().subtract(2, 'days')) &&
    !hasCurrentDispute &&
    userType === EMPLOYER;

  const buttonClass = 'w-auto py-2 px-4 mt-4';

  return isOpen ? (
    <Modal
      title="Dispute Booking"
      id="DisputeBookingModal"
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
    >
      <p className={css.modalTitle}>What would you like to do?</p>
      <div className="grid grid-flow-row grid-cols-2 gap-4 pt-6">
        {isCancelable ? (
          <CancelButton onClick={() => onModalOpen(modalTypes.CANCEL)} className={buttonClass}>
            Cancel Now
          </CancelButton>
        ) : null}
        {isModifiable && bookingType === 'recurring' ? (
          <Button onClick={() => onModalOpen(modalTypes.CHANGE_END_DATE)} className={buttonClass}>
            Change End Date
          </Button>
        ) : null}
        {isModifiable ? (
          <Button onClick={() => onModalOpen(modalTypes.MODIFY_SCHEDULE)} className={buttonClass}>
            Modify Schedule
          </Button>
        ) : null}
        {canChangePaymentMethod ? (
          <Button
            onClick={() => onModalOpen(modalTypes.CHANGE_PAYMENT_METHOD)}
            className={buttonClass}
          >
            Change Payment Method
          </Button>
        ) : null}
        {isDisputable ? (
          <PrimaryButton onClick={() => onModalOpen(modalTypes.DISPUTE)} className={buttonClass}>
            Submit Dispute
          </PrimaryButton>
        ) : null}
      </div>
    </Modal>
  ) : null;
};

export default ActionsModal;
