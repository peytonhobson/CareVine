import React from 'react';

import { Modal } from '../../..';
import { manageDisableScrolling } from '../../../../ducks/UI.duck';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from '../../../../util/reactIntl';
import moment from 'moment';
import { updateRequestedBooking } from '../../../../ducks/transactions.duck';
import ModifyScheduleSingleForm from './ModifyScheduleSingleForm';

import css from '../BookingCardModals.module.css';

const ModifyScheduleSingleModal = props => {
  const { isOpen, onClose, onManageDisableScrolling, booking, onUpdateBooking, ...rest } = props;

  const { lineItems } = booking.attributes.metadata;

  const onFormSubmit = values => {
    onUpdateBooking(booking.id.uuid, values);
  };

  const dateTimes = lineItems.reduce((acc, curr) => {
    const key = moment(curr.date).format('MM/DD');

    return {
      ...acc,
      [key]: {
        startTime: curr.startTime,
        endTime: curr.endTime,
      },
    };
  }, {});
  const bookingDates = lineItems.map(lineItem => lineItem.date);
  const initialValues = {
    bookingDates,
    dateTimes,
  };

  return isOpen ? (
    <Modal
      title="Modify Booking Single"
      id="ModifyScheduleSingleModal"
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
    >
      <p className={css.modalTitle}>Modify Your Booking</p>
      <ModifyScheduleSingleForm
        onSubmit={onFormSubmit}
        initialValues={initialValues}
        booking={booking}
        initialValuesEqual={() => true}
        onClose={onClose}
        {...rest}
      />
    </Modal>
  ) : null;
};

const mapStateToProps = state => {
  const {
    updateRequestedBookingInProgress,
    updateRequestedBookingError,
    updateRequestedBookingSuccess,
  } = state.transactions;

  return {
    updateRequestedBookingInProgress,
    updateRequestedBookingError,
    updateRequestedBookingSuccess,
  };
};

const mapDispatchToProps = {
  onManageDisableScrolling: manageDisableScrolling,
  onUpdateBooking: updateRequestedBooking,
};

export default compose(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(ModifyScheduleSingleModal);
