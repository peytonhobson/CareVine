import React from 'react';

import { Modal } from '../../..';
import { manageDisableScrolling } from '../../../../ducks/UI.duck';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from '../../../../util/reactIntl';
import classNames from 'classnames';
import ModifyExceptionsForm from './ModifyExceptionsForm';

import css from '../BookingCardModals.module.css';

const ModifyExceptionsModal = props => {
  const {
    isOpen,
    onClose,
    onManageDisableScrolling,
    booking,
    onGoBack,
    intl,
    updateBookingScheduleInProgress,
    updateBookingScheduleError,
    updateBookingScheduleSuccess,
    requestBookingScheduleChangeInProgress,
    requestBookingScheduleChangeError,
    requestBookingScheduleChangeSuccess,
    onRequestBookingScheduleChange,
    onUpdateBookingSchedule,
  } = props;

  const {
    exceptions = {
      addedDays: [],
      changedDays: [],
      removedDays: [],
    },
  } = booking.attributes.metadata;

  const onFormSubmit = values => {
    const modification = {
      exceptions: values.exceptions,
    };

    onUpdateExceptions(booking.id.uuid, modification);
  };

  const initialValues = {
    exceptions,
  };

  return isOpen ? (
    <Modal
      title="Modify Booking Exceptions"
      id="ModifyExceptionsModal"
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
    >
      <p className={classNames(css.modalTitle, 'mt-16 md:mt-0 mb-12')}>
        Modify Your Booking Exceptions
      </p>
      <ModifyExceptionsForm
        handleSubmit={onFormSubmit}
        onGoBack={onGoBack}
        booking={booking}
        intl={intl}
        onManageDisableScrolling={onManageDisableScrolling}
        onSubmit={onFormSubmit}
        initialValues={initialValues}
      />
    </Modal>
  ) : null;
};

const mapStateToProps = state => {
  const {} = state.transactions;

  return {};
};

const mapDispatchToProps = {
  onManageDisableScrolling: manageDisableScrolling,
};

export default compose(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(ModifyExceptionsModal);
