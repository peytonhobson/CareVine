import React, { useMemo, useState } from 'react';

import { Modal } from '../../..';
import moment from 'moment';
import { manageDisableScrolling } from '../../../../ducks/UI.duck';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from '../../../../util/reactIntl';
import { ISO_OFFSET_FORMAT, WEEKDAYS } from '../../../../util/constants';
import { updateBookingEndDate } from '../../../../ducks/transactions.duck';
import classNames from 'classnames';
import { checkIsBlockedDay } from '../../../../util/bookings';
import ChangeEndDateForm from './ChangeEndDateForm';

import css from '../BookingCardModals.module.css';

const ChangeEndDateModal = props => {
  const [selectedEndDate, setSelectedEndDate] = useState(null);

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

    onUpdateBookingEndDate(booking, values.endDate.date);
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
      <p className={css.modalTitle}>Change End Date</p>
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
