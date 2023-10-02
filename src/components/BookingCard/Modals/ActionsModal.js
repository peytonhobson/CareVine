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

const MODAL_TYPES = {
  RESPOND: 'respond',
  PAYMENT_DETAILS: 'paymentDetails',
  CANCEL: 'cancel',
  DISPUTE: 'dispute',
  CALENDAR: 'calendar',
  EXCEPTIONS: 'exceptions',
  ACTIONS: 'actions',
  MODIFY: 'modify',
};

const ActionsModal = props => {
  const { isOpen, onClose, onManageDisableScrolling, onModalOpen, booking, userType } = props;

  const lastTransition = booking.attributes.lastTransition;

  const isRequest = lastTransition === TRANSITION_REQUEST_BOOKING;
  const isCancelable = CANCELABLE_TRANSITIONS.includes(lastTransition);
  const isModifiable = MODIFIABLE_TRANSITIONS.includes(lastTransition) && userType === EMPLOYER;

  const { ledger: bookingLedger = [], type: bookingType } = booking.attributes.metadata;

  const hasCurrentDispute =
    bookingLedger.length > 0 && bookingLedger[bookingLedger.length - 1].dispute;
  const isDisputable =
    bookingLedger.length > 0 &&
    bookingLedger[bookingLedger.length - 1].end &&
    moment(bookingLedger[bookingLedger.length - 1].end).isAfter(moment().subtract(2, 'days')) &&
    !hasCurrentDispute &&
    userType === EMPLOYER;

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
          <CancelButton
            onClick={() => onModalOpen(MODAL_TYPES.CANCEL)}
            className="w-auto py-2 px-4 mt-4"
          >
            Cancel {isRequest ? 'Request' : 'Booking'}
          </CancelButton>
        ) : null}
        {isCancelable && bookingType === 'recurring' ? (
          <CancelButton
            onClick={() => onModalOpen(MODAL_TYPES.CANCEL)}
            className="w-auto py-2 px-4 mt-4"
          >
            Cancel at Week End
          </CancelButton>
        ) : null}
        {isModifiable ? (
          <Button onClick={() => onModalOpen(MODAL_TYPES.MODIFY)} className="w-auto py-2 px-4 mt-4">
            Modify Schedule
          </Button>
        ) : null}
        {isDisputable ? (
          <PrimaryButton
            onClick={() => onModalOpen(MODAL_TYPES.DISPUTE)}
            className="w-auto py-2 px-4 mt-4"
          >
            Submit Dispute
          </PrimaryButton>
        ) : null}
      </div>
    </Modal>
  ) : null;
};

export default ActionsModal;
