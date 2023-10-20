import React, { useMemo } from 'react';

import { Modal, CancelButton, Button, RefundBookingSummaryCard, NamedLink } from '..';
import { cancelBooking } from '../../containers/BookingsPage/BookingsPage.duck';
import { manageDisableScrolling } from '../../ducks/UI.duck';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { CAREGIVER } from '../../util/constants';

import css from './CancelBookingModal.module.css';
import { addTimeToStartOfDay } from '../../util/dates';

const nonPaidTransitions = ['transition/request-booking', 'transition/accept'];

const CancelBookingModal = props => {
  const {
    isOpen,
    onClose,
    otherUserDisplayName,
    onManageDisableScrolling,
    onCancelBooking,
    cancelBookingInProgress,
    cancelBookingError,
    cancelBookingSuccess,
    booking,
    userType,
    onGoBack,
  } = props;

  const { chargedLineItems = [] } = booking.attributes.metadata;
  const lastTransition = booking.attributes.lastTransition;
  const showCancellationPolicy = !nonPaidTransitions.includes(lastTransition);

  const isCaregiver = userType === CAREGIVER;

  const hasRefund = useMemo(
    () =>
      chargedLineItems.some(cl =>
        cl.lineItems.some(l => moment(addTimeToStartOfDay(l.date, l.startTime)).isAfter())
      ),
    [chargedLineItems]
  );

  let policy;
  if (isCaregiver) {
    policy = (
      <p className={css.modalMessage}>
        If you cancel the booking now, {otherUserDisplayName} will be fully refunded for any booking
        times not completed. Your search ranking may also be affected.
      </p>
    );
  } else {
    policy = showCancellationPolicy ? (
      <>
        <p className={css.modalMessage}>
          For more information about our cancellation policy, click{' '}
          <NamedLink
            name="TermsOfServicePage"
            target="_blank"
            to={{ hash: '#cancellation-policy' }}
          >
            here
          </NamedLink>
          .
        </p>
        {hasRefund ? (
          <RefundBookingSummaryCard
            booking={booking}
            className="mt-6 rounded-[var(--borderRadius)] border-anti pt-8 border"
            hideAvatar
            subHeading="Refund Summary"
          />
        ) : (
          <p className={css.modalMessage}>
            You have not been charged for any future booking times and will therefore not receive a
            refund.
          </p>
        )}
      </>
    ) : (
      <p className={css.modalMessage}>
        You have not been charged for this booking and will therefore not receive a refund.
      </p>
    );
  }

  return isOpen ? (
    <Modal
      title="Cancel Booking"
      id="CancelBookingModal"
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
      containerClassName={css.modalContainer}
    >
      <p className={css.modalTitle}>
        Cancel Booking with <span className="whitespace-nowrap">{otherUserDisplayName}</span>
      </p>
      {policy}
      {cancelBookingError ? (
        <p className={css.modalError}>
          There was an error cancelling your booking. Please try again.
        </p>
      ) : null}
      <div className={css.modalButtonContainer}>
        <Button onClick={onGoBack} className={css.modalButton}>
          Back
        </Button>
        <CancelButton
          inProgress={cancelBookingInProgress}
          onClick={() => onCancelBooking(booking)}
          className={css.modalButton}
          ready={cancelBookingSuccess}
          disabled={cancelBookingSuccess || cancelBookingInProgress}
        >
          Cancel
        </CancelButton>
      </div>
    </Modal>
  ) : null;
};

const mapStateToProps = state => {
  const { cancelBookingInProgress, cancelBookingError, cancelBookingSuccess } = state.BookingsPage;

  return {
    cancelBookingInProgress,
    cancelBookingError,
    cancelBookingSuccess,
  };
};

const mapDispatchToProps = {
  onManageDisableScrolling: manageDisableScrolling,
  onCancelBooking: cancelBooking,
};

export default compose(connect(mapStateToProps, mapDispatchToProps))(CancelBookingModal);
