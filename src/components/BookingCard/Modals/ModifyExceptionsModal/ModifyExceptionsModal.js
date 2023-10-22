import React, { useMemo } from 'react';

import { Modal } from '../../..';
import { manageDisableScrolling } from '../../../../ducks/UI.duck';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from '../../../../util/reactIntl';
import classNames from 'classnames';
import ModifyExceptionsForm from './ModifyExceptionsForm';
import { updateBookingExceptions } from '../../../../ducks/transactions.duck';
import moment from 'moment';

import css from '../BookingCardModals.module.css';

const reduceUnchargedExceptions = (exceptions, chargedLineItems) => {
  const lastChargedDate = chargedLineItems
    .map(cl => cl.lineItems)
    .flat()
    .sort((a, b) => moment(b.date).diff(a.date))?.[0]?.date;

  const unchargedExceptions = Object.keys(exceptions).reduce((acc, curr) => {
    const newExceptions = exceptions[curr].filter(e => moment(e.date).isAfter(lastChargedDate));

    return {
      ...acc,
      [curr]: newExceptions,
    };
  }, {});

  return { unchargedExceptions, lastChargedDate };
};

const ModifyExceptionsModal = props => {
  const {
    isOpen,
    onClose,
    onManageDisableScrolling,
    booking,
    onGoBack,
    intl,
    updateBookingExceptionsInProgress,
    updateBookingExceptionsError,
    updateBookingExceptionsSuccess,
    onUpdateExceptions,
  } = props;

  const onFormSubmit = values => {
    const modification = {
      exceptions: values.exceptions,
    };

    onUpdateExceptions(booking.id.uuid, modification);
  };

  const {
    exceptions = {
      addedDays: [],
      changedDays: [],
      removedDays: [],
    },
    chargedLineItems = [],
  } = booking.attributes.metadata;

  const { unchargedExceptions, lastChargedDate } = useMemo(
    () => reduceUnchargedExceptions(exceptions, chargedLineItems),
    [exceptions, chargedLineItems]
  );

  const initialValues = {
    exceptions: unchargedExceptions,
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
        updateBookingExceptionsInProgress={updateBookingExceptionsInProgress}
        updateBookingExceptionsError={updateBookingExceptionsError}
        updateBookingExceptionsSuccess={updateBookingExceptionsSuccess}
        bookingExceptions={unchargedExceptions}
        lastChargedDate={lastChargedDate}
      />
    </Modal>
  ) : null;
};

const mapStateToProps = state => {
  const {
    updateBookingExceptionsInProgress,
    updateBookingExceptionsError,
    updateBookingExceptionsSuccess,
  } = state.transactions;

  return {
    updateBookingExceptionsInProgress,
    updateBookingExceptionsError,
    updateBookingExceptionsSuccess,
  };
};

const mapDispatchToProps = {
  onManageDisableScrolling: manageDisableScrolling,
  onUpdateExceptions: updateBookingExceptions,
};

export default compose(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(ModifyExceptionsModal);
