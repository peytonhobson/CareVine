import React from 'react';

import { Modal } from '../..';
import moment from 'moment';
import { manageDisableScrolling } from '../../../ducks/UI.duck';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { updateBookingMetadata } from '../../../containers/BookingsPage/BookingsPage.duck';
import { ModifyBookingScheduleForm } from '../../../forms';

import css from './BookingCardModals.module.css';

const findEndDate = lineItems =>
  lineItems.reduce(
    (acc, curr) => (moment(curr.date).isAfter(acc) ? curr.date : acc),
    lineItems?.[0]?.date
  );

const ModifyScheduleModal = props => {
  const {
    isOpen,
    onClose,
    otherUserDisplayName,
    onManageDisableScrolling,
    booking,
    updateBookingMetadataInProgress,
    updateBookingMetadataError,
    updateBookingMetadataSuccess,
    onUpdateBooking,
    onGoBack,
  } = props;

  const {
    chargedLineItems = [],
    lineItems = [],
    startDate,
    endDate,
    bookingSchedule,
    exceptions,
    bookingRate,
  } = booking.attributes.metadata;

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

  const dateTimes = lineItems.map(lineItem => ({
    date: moment(lineItem.date).format('MM/DD'),
    startTime: lineItem.startTime,
    endTime: lineItem.endTime,
  }));

  const bookingDates = lineItems.map(lineItem => lineItem.date);

  const initialValues = {
    startDate: startDate ? { date: new Date(startDate) } : null,
    endDate: endDate ? { date: new Date(endDate) } : null,
    ...initialBookingSchedule,
    dateTimes,
    exceptions,
    bookingDates,
    bookingRate,
  };

  return isOpen ? (
    <Modal
      title="Modify Booking Schedule"
      id="ModifyScheduleModal"
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
    >
      <p className={css.modalTitle}>Modify Booking Schedule</p>
      <ModifyBookingScheduleForm
        booking={booking}
        onManageDisableScrolling={onManageDisableScrolling}
        onSubmit={() => {}}
        initialValues={initialValues}
        updateBookingMetadataInProgress={updateBookingMetadataInProgress}
        updateBookingMetadataError={updateBookingMetadataError}
        updateBookingMetadataSuccess={updateBookingMetadataSuccess}
        onGoBack={onGoBack}
      />
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

export default compose(connect(mapStateToProps, mapDispatchToProps))(ModifyScheduleModal);
