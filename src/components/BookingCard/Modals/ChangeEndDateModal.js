import React, { useMemo, useState } from 'react';

import { Modal, Button, Form, PrimaryButton, FieldDateInput } from '../..';
import moment from 'moment';
import RefundBookingSummaryCard from '../../BookingSummaryCard/Refund/RefundBookingSummaryCard';
import { manageDisableScrolling } from '../../../ducks/UI.duck';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { formatFieldDateInput, parseFieldDateInput } from '../../../util/dates';
import { injectIntl } from '../../../util/reactIntl';
import { checkIsDateWithinBookingWindow } from '../../../util/bookings';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import { useCheckMobileScreen } from '../../../util/hooks';
import { ISO_OFFSET_FORMAT, WEEKDAYS } from '../../../util/constants';

import css from './BookingCardModals.module.css';

const checkIsDateInBookingSchedule = (date, bookingSchedule, exceptions) => {
  const isInRegularDays = bookingSchedule.some(
    d => d.dayOfWeek === WEEKDAYS[moment(date).weekday()]
  );
  const isAddedDay = exceptions?.addedDays?.find(d => moment(d).isSame(date, 'day'));
  const isRemovedDay = exceptions?.removedDays?.find(d => moment(d).isSame(date, 'day'));

  return (isInRegularDays && !isRemovedDay) || isAddedDay;
};

const filterAvailableBookingEndDates = (
  startDate,
  bookingSchedule,
  endDate,
  exceptions
) => date => {
  const isWithinBookingWindow = checkIsDateWithinBookingWindow({
    date,
    endDate,
    startDate,
  });
  const isInScheduledDays = checkIsDateInBookingSchedule(date, bookingSchedule, exceptions);

  return !isWithinBookingWindow || !isInScheduledDays;
};

const TODAY = new Date();
// Date formatting used for placeholder texts:
const dateFormattingOptions = { month: 'short', day: 'numeric', weekday: 'short' };

const renderDayContents = (isMobile, bookingSchedule, exceptions) => (date, classes) => {
  const isInBookingSchedule = checkIsDateInBookingSchedule(date, bookingSchedule, exceptions);

  if (classes.has('selected') && isMobile) {
    return <div className={css.mobileSelectedDay}>{date.format('D')}</div>;
  }

  return (
    <span
      className={
        isInBookingSchedule
          ? 'text-light cursor-pointer hover:bg-light hover:text-primary px-3 py-1'
          : null
      }
    >
      {date.format('D')}
    </span>
  );
};

const ChangeEndDateModal = props => {
  const [selectedEndDate, setSelectedEndDate] = useState(null);

  const { isOpen, onClose, onManageDisableScrolling, booking } = props;

  const {
    chargedLineItems = [],
    endDate,
    bookingSchedule,
    exceptions,
  } = booking.attributes.metadata;

  const onFormSubmit = values => {};

  const onFormChange = ({ values }) => {
    const timeZoneDate = moment(values.endDate?.date).format(ISO_OFFSET_FORMAT);
    setSelectedEndDate(timeZoneDate);
  };

  const hasRefund = useMemo(
    () =>
      selectedEndDate &&
      chargedLineItems.some(item =>
        item.lineItems?.some(i => moment(i.date).isAfter(moment(selectedEndDate)))
      ),
    [selectedEndDate, chargedLineItems]
  );

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
      <FinalForm
        {...props}
        onSubmit={onFormSubmit}
        mutators={{ ...arrayMutators }}
        initialValues={{ endDate: endDate ? { date: new Date(endDate) } : null }}
        initialValuesEqual={() => true}
        render={formRenderProps => {
          const {
            handleSubmit,
            intl,
            booking,
            updateBookingMetadataInProgress,
            updateBookingMetadataError,
            updateBookingMetadataSuccess,
            onGoBack,
          } = formRenderProps;

          const { listing } = booking;

          const timezone = listing.attributes.publicData.availabilityPlan?.timezone;

          const isMobile = useCheckMobileScreen();

          const submitInProgress = updateBookingMetadataInProgress;
          const submitDisabled = updateBookingMetadataInProgress || updateBookingMetadataSuccess;
          const submitReady = updateBookingMetadataSuccess;

          return (
            <Form onSubmit={handleSubmit}>
              <FormSpy subscription={{ values: true }} onChange={onFormChange} />
              <FieldDateInput
                name="endDate"
                id="endDate"
                className={css.fieldDateInput}
                label="New End Date"
                placeholderText={intl.formatDate(TODAY, dateFormattingOptions)}
                format={formatFieldDateInput(timezone)}
                parse={parseFieldDateInput(timezone)}
                isDayBlocked={filterAvailableBookingEndDates(
                  moment(),
                  bookingSchedule,
                  endDate,
                  exceptions
                )}
                useMobileMargins
                showErrorMessage={false}
                renderDayContents={renderDayContents(isMobile, bookingSchedule, exceptions)}
                withPortal={isMobile}
              />
              {selectedEndDate ? (
                <>
                  <p className={css.modalMessage}>
                    By clicking 'Submit', the end date of your booking will be changed to{' '}
                    {moment(selectedEndDate).format('MMMM Do')}. You will not be charged for any
                    time after this date.
                  </p>
                  {hasRefund ? (
                    <>
                      <p className={css.modalMessage}>
                        You will be refunded according to the table below:
                      </p>
                      <RefundBookingSummaryCard
                        booking={booking}
                        className="mt-6 rounded-[var(--borderRadius)] border-anti pt-8 border"
                        hideAvatar
                        subHeading="Refund Summary"
                        cancelDate={selectedEndDate}
                      />
                    </>
                  ) : null}
                </>
              ) : null}
              {updateBookingMetadataError ? (
                <p className="text-error">Failed to update booking schedule. Please try again.</p>
              ) : null}
              <div className={css.modalButtonContainer}>
                <Button onClick={onGoBack} className={css.modalButton} type="button">
                  Back
                </Button>
                <PrimaryButton
                  inProgress={submitInProgress}
                  onClick={() => onCancelBooking(booking)}
                  className="w-auto ml-4 px-6 min-w-[10rem]"
                  ready={submitReady}
                  disabled={submitDisabled}
                  type="submit"
                >
                  Submit
                </PrimaryButton>
              </div>
            </Form>
          );
        }}
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
};

export default compose(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(ChangeEndDateModal);
