import React from 'react';

import { Modal } from '../../..';
import { manageDisableScrolling } from '../../../../ducks/UI.duck';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { updateBookingMetadata } from '../../../../containers/BookingsPage/BookingsPage.duck';
import ModifyScheduleRecurringForm from './ModifyScheduleRecurringForm';
import { injectIntl } from '../../../../util/reactIntl';
import WarningIcon from '@mui/icons-material/Warning';

import css from '../BookingCardModals.module.css';

const sortChargedLineItems = chargedLineItems => {
  return chargedLineItems
    .map(c => c.lineItems)
    .flat()
    .sort((a, b) => {
      return moment(a.date).isBefore(moment(b.date)) ? -1 : 1;
    });
};

const findChangeAppliedDay = chargedLineItems => {
  const sortedChargedLineItems = sortChargedLineItems(chargedLineItems);
  const lastChargedDate = sortedChargedLineItems[sortedChargedLineItems.length - 1].date;

  const startOfNextWeek = moment(lastChargedDate)
    .add(1, 'week')
    .startOf('week');
  return null;
};

const ModifyScheduleRecurringModal = props => {
  const {
    isOpen,
    onClose,
    onManageDisableScrolling,
    booking,
    updateBookingMetadataInProgress,
    updateBookingMetadataError,
    updateBookingMetadataSuccess,
    onUpdateBooking,
    onGoBack,
    intl,
  } = props;

  // TODO: Update
  const onFormSubmit = values => {
    onUpdateBooking(booking, values);
  };

  const { bookingSchedule } = booking.attributes.metadata;

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
      <p className={css.modalTitle}>Modify Booking Schedule</p>
      <p className={css.modalMessage}>
        Days with the <WarningIcon color="warning" /> icon are already booked by another booking.
        You will not be able to book these days.
      </p>
      <ModifyScheduleRecurringForm
        onSubmit={onFormSubmit}
        initialValues={{ ...initialBookingSchedule }}
        onGoBack={onGoBack}
        booking={booking}
        updateBookingMetadataInProgress={updateBookingMetadataInProgress}
        updateBookingMetadataError={updateBookingMetadataError}
        updateBookingMetadataSuccess={updateBookingMetadataSuccess}
        intl={intl}
      />
      <p className={css.modalMessage}>
        Days with the <WarningIcon color="warning" /> icon are already booked by another booking.
        You will not be able to book these days.
      </p>
    </Modal>
  ) : null;
};

const mapStateToProps = state => {
  const {
    updateBookingMetadataInProgress,
    updateBookingMetadataError,
    updateBookingMetadataSuccess,
  } = state.BookingsPage;

  return {
    updateBookingMetadataInProgress,
    updateBookingMetadataError,
    updateBookingMetadataSuccess,
  };
};

const mapDispatchToProps = {
  onManageDisableScrolling: manageDisableScrolling,
  onUpdateBooking: updateBookingMetadata,
};

export default compose(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(ModifyScheduleRecurringModal);
