import React, { useMemo } from 'react';

import { Modal } from '../../..';
import { manageDisableScrolling } from '../../../../ducks/UI.duck';
import { compose } from 'redux';
import { connect } from 'react-redux';
import ModifyScheduleRecurringForm from './ModifyScheduleRecurringForm';
import { injectIntl } from '../../../../util/reactIntl';
import moment from 'moment';
import {
  requestBookingScheduleChange,
  updateBookingSchedule,
} from '../../../../ducks/transactions.duck';
import { TRANSITION_REQUEST_BOOKING } from '../../../../util/transaction';
import { mapWeekdays } from '../../../../util/bookings';

import css from '../BookingCardModals.module.css';
import { ISO_OFFSET_FORMAT } from '../../../../util/constants';

const filterUnapplicableExceptions = (unapplicableExceptions, exceptions) =>
  Object.keys(exceptions).reduce((acc, curr) => {
    const newExceptions = exceptions[curr].filter(e => {
      !unapplicableExceptions.some(ue => moment(ue.date).isSame(e.date, 'day'));
    });

    return {
      ...acc,
      [curr]: newExceptions,
    };
  }, {});

const ModifyScheduleRecurringModal = props => {
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

  const { bookingSchedule, exceptions } = booking.attributes.metadata;
  const lastTransition = booking.attributes.lastTransition;
  const isRequest = lastTransition === TRANSITION_REQUEST_BOOKING;

  const onFormSubmit = values => {
    const bookingSchedule = mapWeekdays(values);
    const newExceptions = filterUnapplicableExceptions(values.unapplicableExceptions, exceptions);
    const modification = {
      bookingSchedule,
      exceptions: newExceptions,
      endDate: moment(values.endDate?.date).format(ISO_OFFSET_FORMAT),
    };

    if (isRequest) {
      onUpdateBookingSchedule(booking.id.uuid, modification);
    } else {
      onRequestBookingScheduleChange(booking.id.uuid, modification);
    }
  };

  const initialBookingSchedule =
    bookingSchedule?.reduce((acc, curr) => {
      return {
        ...acc,
        [curr.dayOfWeek]: [
          {
            startTime: curr.startTime,
            endTime: curr.endTime,
          },
        ],
      };
    }, {}) || {};

  return isOpen ? (
    <Modal
      title="Modify Booking Schedule Days"
      id="ModifyScheduleRecurringModal"
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
    >
      <p className={css.modalTitle}>Modify Your Booking Schedule</p>
      <ModifyScheduleRecurringForm
        onSubmit={onFormSubmit}
        initialValues={{ ...initialBookingSchedule }}
        onGoBack={onGoBack}
        booking={booking}
        intl={intl}
        initialValuesEqual={() => true}
        onManageDisableScrolling={onManageDisableScrolling}
        updateBookingScheduleInProgress={updateBookingScheduleInProgress}
        updateBookingScheduleError={updateBookingScheduleError}
        updateBookingScheduleSuccess={updateBookingScheduleSuccess}
        requestBookingScheduleChangeInProgress={requestBookingScheduleChangeInProgress}
        requestBookingScheduleChangeError={requestBookingScheduleChangeError}
        requestBookingScheduleChangeSuccess={requestBookingScheduleChangeSuccess}
      />
    </Modal>
  ) : null;
};

const mapStateToProps = state => {
  const {
    updateBookingScheduleInProgress,
    updateBookingScheduleError,
    updateBookingScheduleSuccess,
    requestBookingScheduleChangeInProgress,
    requestBookingScheduleChangeError,
    requestBookingScheduleChangeSuccess,
  } = state.transactions;

  return {
    updateBookingScheduleInProgress,
    updateBookingScheduleError,
    updateBookingScheduleSuccess,
    requestBookingScheduleChangeInProgress,
    requestBookingScheduleChangeError,
    requestBookingScheduleChangeSuccess,
  };
};

const mapDispatchToProps = {
  onManageDisableScrolling: manageDisableScrolling,
  onRequestBookingScheduleChange: requestBookingScheduleChange,
  onUpdateBookingSchedule: updateBookingSchedule,
};

export default compose(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(ModifyScheduleRecurringModal);
