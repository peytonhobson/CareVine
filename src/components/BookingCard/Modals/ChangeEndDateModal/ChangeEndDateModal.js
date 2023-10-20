import React from 'react';

import { Modal } from '../../..';
import { manageDisableScrolling } from '../../../../ducks/UI.duck';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from '../../../../util/reactIntl';
import { updateBookingEndDate } from '../../../../ducks/transactions.duck';
import ChangeEndDateForm from './ChangeEndDateForm';
import classNames from 'classnames';

import css from '../BookingCardModals.module.css';

const ChangeEndDateModal = props => {
  const {
    isOpen,
    onClose,
    onManageDisableScrolling,
    booking,
    onUpdateBookingEndDate,
    ...rest
  } = props;

  const onFormSubmit = values => {
    if (!values.endDate?.date) {
      setShowInvalidError(true);
      return;
    }

    onUpdateBookingEndDate(booking.id.uuid, values.endDate.date);
  };

  return isOpen ? (
    <Modal
      title="Change End Date"
      id="ChangeEndDateModal"
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
      containerClassName={css.modalContainer}
    >
      <p className={classNames(css.modalTitle, 'text-center md:text-left')}>Change End Date</p>
      <ChangeEndDateForm onSubmit={onFormSubmit} booking={booking} {...rest} />
    </Modal>
  ) : null;
};

const mapStateToProps = state => {
  const {
    updateBookingEndDateInProgress,
    updateBookingEndDateError,
    updateBookingEndDateSuccess,
  } = state.transactions;

  return {
    updateBookingEndDateInProgress,
    updateBookingEndDateError,
    updateBookingEndDateSuccess,
  };
};

const mapDispatchToProps = {
  onManageDisableScrolling: manageDisableScrolling,
  onUpdateBookingEndDate: updateBookingEndDate,
};

export default compose(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(ChangeEndDateModal);
