import React, { useMemo } from 'react';

import { Modal } from '../../..';
import { manageDisableScrolling } from '../../../../ducks/UI.duck';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from '../../../../util/reactIntl';
import classNames from 'classnames';
import ModifyExceptionsForm from './ModifyExceptionsForm';
import {
  updateBookingExceptions,
  updateRequestedBooking,
} from '../../../../ducks/transactions.duck';
import moment from 'moment';

import css from '../BookingCardModals.module.css';
import { txIsRequest } from '../../../../util/transaction';

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
    onUpdateExceptions,
    onUpdateRequest,
    ...rest
  } = props;

  const onFormSubmit = values => {
    const modification = {
      exceptions: values.exceptions,
    };

    if (txIsRequest(booking)) {
      onUpdateRequest(booking.id.uuid, modification);
    } else {
      onUpdateExceptions(booking.id.uuid, modification);
    }
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
        onSubmit={onFormSubmit}
        booking={booking}
        onManageDisableScrolling={onManageDisableScrolling}
        initialValues={initialValues}
        bookingExceptions={unchargedExceptions}
        lastChargedDate={lastChargedDate}
        initialValuesEqual={() => true}
        onClose={onClose}
        {...rest}
      />
    </Modal>
  ) : null;
};

const mapStateToProps = state => {
  const {
    updateBookingExceptionsInProgress,
    updateBookingExceptionsError,
    updateBookingExceptionsSuccess,
    updateRequestedBookingInProgress,
    updateRequestedBookingError,
    updateRequestedBookingSuccess,
  } = state.transactions;

  return {
    updateBookingExceptionsInProgress,
    updateBookingExceptionsError,
    updateBookingExceptionsSuccess,
    updateRequestedBookingInProgress,
    updateRequestedBookingError,
    updateRequestedBookingSuccess,
  };
};

const mapDispatchToProps = {
  onManageDisableScrolling: manageDisableScrolling,
  onUpdateExceptions: updateBookingExceptions,
  onUpdateRequest: updateRequestedBooking,
};

export default compose(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(ModifyExceptionsModal);
