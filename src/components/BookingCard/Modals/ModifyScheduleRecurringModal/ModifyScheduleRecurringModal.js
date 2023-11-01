import React from 'react';

import { Modal } from '../../..';
import { manageDisableScrolling } from '../../../../ducks/UI.duck';
import { compose } from 'redux';
import { connect } from 'react-redux';
import ModifyScheduleRecurringForm from './ModifyScheduleRecurringForm';
import { injectIntl } from '../../../../util/reactIntl';
import moment from 'moment';
import {
  requestBookingScheduleChange,
  updateRequestedBooking,
} from '../../../../ducks/transactions.duck';
import {
  TRANSITION_REQUEST_BOOKING,
  TRANSITION_REQUEST_UPDATE_START,
} from '../../../../util/transaction';
import { mapWeekdays } from '../../../../util/bookings';
import classNames from 'classnames';
import { ISO_OFFSET_FORMAT } from '../../../../util/constants';

import css from '../BookingCardModals.module.css';

const filterUnapplicableExceptions = (unapplicableExceptions, exceptions) =>
  Object.keys(exceptions).reduce((acc, curr) => {
    const newExceptions = exceptions[curr].filter(
      e => !unapplicableExceptions.some(ue => moment(ue.date).isSame(e.date, 'day'))
    );

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
    onRequestBookingScheduleChange,
    onUpdateBookingSchedule,
    ...rest
  } = props;

  const { bookingSchedule, exceptions, endDate: oldEndDate } = booking.attributes.metadata;
  const lastTransition = booking.attributes.lastTransition;
  const isRequest =
    lastTransition === TRANSITION_REQUEST_BOOKING ||
    lastTransition === TRANSITION_REQUEST_UPDATE_START;

  const onFormSubmit = values => {
    const bookingSchedule = mapWeekdays(values);
    const newExceptions = filterUnapplicableExceptions(values.unapplicableExceptions, exceptions);
    const modification = {
      bookingSchedule,
      exceptions: newExceptions,
      endDate: values.endDate?.date
        ? moment(values.endDate?.date).format(ISO_OFFSET_FORMAT)
        : oldEndDate,
      type: 'bookingSchedule',
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
      containerClassName={css.modalContainer}
    >
      <p className={classNames(css.modalTitle, 'mt-16 md:mt-0')}>Modify Your Booking Schedule</p>
      <ModifyScheduleRecurringForm
        onSubmit={onFormSubmit}
        initialValues={{ ...initialBookingSchedule }}
        booking={booking}
        initialValuesEqual={() => true}
        onManageDisableScrolling={onManageDisableScrolling}
        onCloseFully={onClose}
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
    requestBookingScheduleChangeInProgress,
    requestBookingScheduleChangeError,
    requestBookingScheduleChangeSuccess,
  } = state.transactions;

  return {
    updateRequestedBookingInProgress,
    updateRequestedBookingError,
    updateRequestedBookingSuccess,
    requestBookingScheduleChangeInProgress,
    requestBookingScheduleChangeError,
    requestBookingScheduleChangeSuccess,
  };
};

const mapDispatchToProps = {
  onManageDisableScrolling: manageDisableScrolling,
  onRequestBookingScheduleChange: requestBookingScheduleChange,
  onUpdateBookingSchedule: updateRequestedBooking,
};

export default compose(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(ModifyScheduleRecurringModal);
