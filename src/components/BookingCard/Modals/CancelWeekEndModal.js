import React, { useMemo } from 'react';

import { Modal, CancelButton, Button } from '../..';
import moment from 'moment';
import RefundBookingSummaryCard from '../../BookingSummaryCard/Refund/RefundBookingSummaryCard';
import { manageDisableScrolling } from '../../../ducks/UI.duck';
import { compose } from 'redux';
import { connect } from 'react-redux';

import css from './BookingCardModals.module.css';
import { updateBookingMetadata } from '../../../containers/BookingsPage/BookingsPage.duck';

const findEndDate = lineItems =>
  lineItems.reduce(
    (acc, curr) => (moment(curr.date).isAfter(acc) ? curr.date : acc),
    lineItems?.[0]?.date
  );

const CancelWeekEndModal = props => {
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
  } = props;

  const { chargedLineItems = [], lineItems = [] } = booking.attributes.metadata;

  const lastDayOfWeek = findEndDate(lineItems);

  const nextWeekLineItems = useMemo(
    () =>
      chargedLineItems
        .map(c => {
          const newLineItems = c.lineItems.filter(l =>
            moment(l.date).isAfter(moment().endOf('week'))
          );
          return {
            ...c,
            lineItems: newLineItems,
          };
        })
        .filter(c => c.lineItems.length > 0),
    [chargedLineItems]
  );

  const nextWeekBooking = {
    ...booking,
    attributes: {
      ...booking.attributes,
      metadata: {
        ...booking.attributes.metadata,
        chargedLineItems: nextWeekLineItems,
      },
    },
  };

  return isOpen ? (
    <Modal
      title="Cancel Booking at Week End"
      id="CancelWeekEndModal"
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
      containerClassName={css.modalContainer}
    >
      <p className={css.modalTitle}>End Booking with {otherUserDisplayName}</p>
      {/* TODO: If someone cancels and already charged for next week, then refund? */}
      <p className={css.modalMessage}>
        By clicking the button below, you will end your booking with {otherUserDisplayName} on{' '}
        <span className="whitespace-nowrap">{moment(lastDayOfWeek).format('dddd MMM, Do')}</span>.
        You will not be charged for any time after this date.
      </p>
      {/* TODO: Check this with charged next week */}
      {nextWeekLineItems.length ? (
        <>
          <p className={css.modalMessageRefund}>Cancellation Policy</p>
          <ul className={css.refundList}>
            <li className={css.refundListItem}>
              100% refund for booked times canceled more than 48 hours in advance
            </li>
            <li className={css.refundListItem}>
              50% refund for booked times canceled less than 48 hours in advance
            </li>
            <li className={css.refundListItem}>
              Service fees will be refunded in proportion to the refunded base booking amount.
              Processing fees are non-refundable under all circumstances.
            </li>
          </ul>
          <RefundBookingSummaryCard
            booking={nextWeekBooking}
            className="mt-6 rounded-[var(--borderRadius)] border-anti pt-8 border"
            hideAvatar
            subHeading="Refund Summary"
          />
        </>
      ) : null}
      {updateBookingMetadataError ? (
        <p className={css.modalError}>
          There was an error cancelling your booking. Please try again.
        </p>
      ) : null}
      <div className={css.modalButtonContainer}>
        <Button onClick={onClose} className={css.modalButton}>
          Back
        </Button>
        <CancelButton
          inProgress={updateBookingMetadataInProgress}
          onClick={() =>
            onUpdateBooking(booking, { cancelAtPeriodEnd: true, endDate: lastDayOfWeek })
          } // Update booking metadata to cancel at period end
          className={css.modalButton}
          ready={updateBookingMetadataSuccess}
          disabled={updateBookingMetadataSuccess || updateBookingMetadataInProgress}
        >
          Cancel
        </CancelButton>
      </div>
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

export default compose(connect(mapStateToProps, mapDispatchToProps))(CancelWeekEndModal);
