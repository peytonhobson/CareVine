import React, { useMemo, useState } from 'react';

import { Modal, Button, Form, PrimaryButton, FieldDateInput } from '../..';
import moment from 'moment';
import RefundBookingSummaryCard from '../../BookingSummaryCard/Refund/RefundBookingSummaryCard';
import { manageDisableScrolling } from '../../../ducks/UI.duck';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { formatFieldDateInput, parseFieldDateInput } from '../../../util/dates';
import { injectIntl } from '../../../util/reactIntl';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import { useCheckMobileScreen } from '../../../util/hooks';
import { ISO_OFFSET_FORMAT, WEEKDAYS } from '../../../util/constants';
import { updateBookingEndDate } from '../../../ducks/transactions.duck';

import css from './BookingCardModals.module.css';
import { checkIsBlockedDay } from '../../../util/bookings';

const checkIsDateInBookingSchedule = (date, bookingSchedule, exceptions) => {
  const isInRegularDays = bookingSchedule.some(
    d => d.dayOfWeek === WEEKDAYS[moment(date).weekday()]
  );
  const isAddedDay = exceptions?.addedDays?.find(d => moment(d).isSame(date, 'day'));
  const isRemovedDay = exceptions?.removedDays?.find(d => moment(d).isSame(date, 'day'));

  return (isInRegularDays && !isRemovedDay) || isAddedDay;
};

const filterAvailableBookingEndDates = ({
  bookingSchedule,
  exceptions,
  bookedDates,
  bookedDays,
  oldEndDate,
  chargedDates,
}) => date => {
  // If current end date is in charged line items, all end dates after should be unavailable.
  // This ensures if a user extends the end date that we don't have to deal with the additional
  // charges that finish out their charged line items.
  const isCharged =
    chargedDates.some(d => moment(d).isSame(oldEndDate, 'day')) &&
    moment(date).isAfter(oldEndDate, 'day');
  const isDayBlocked = checkIsBlockedDay({ date, bookedDays, bookedDates });
  const isInScheduledDays = checkIsDateInBookingSchedule(date, bookingSchedule, exceptions);
  const isInPast = moment(date).isBefore(TODAY, 'day');
  const isCurrentEndDate = moment(date).isSame(oldEndDate, 'day');

  return isDayBlocked || !isInScheduledDays || isInPast || isCurrentEndDate || isCharged;
};

const TODAY = new Date();
// Date formatting used for placeholder texts:
const dateFormattingOptions = { month: 'short', day: 'numeric', weekday: 'short' };

const renderDayContents = ({
  isMobile,
  bookingSchedule,
  exceptions,
  bookedDates,
  bookedDays,
  oldEndDate,
  chargedDates,
}) => (date, classes) => {
  const isCharged =
    chargedDates.some(d => moment(d).isSame(oldEndDate, 'day')) &&
    moment(date).isAfter(oldEndDate, 'day');
  const isInBookingSchedule = checkIsDateInBookingSchedule(date, bookingSchedule, exceptions);
  const isInPast = moment(date).isBefore(TODAY, 'day');
  const isDayBlocked = checkIsBlockedDay({ date, bookedDays, bookedDates });
  const isCurrentEndDate = moment(date).isSame(oldEndDate, 'day');

  if (classes.has('selected') && isMobile) {
    return <div className={css.mobileSelectedDay}>{date.format('D')}</div>;
  }

  const available =
    isInBookingSchedule && !isInPast && !isDayBlocked && !isCurrentEndDate && !isCharged;

  return (
    <span
      className={
        available ? 'text-light cursor-pointer hover:bg-light hover:text-primary px-3 py-1' : null
      }
    >
      {date.format('D')}
    </span>
  );
};

const ChangeEndDateModal = props => {
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [showInvalidError, setShowInvalidError] = useState(false);

  const { isOpen, onClose, onManageDisableScrolling, booking, onUpdateBookingEndDate } = props;

  const {
    chargedLineItems = [],
    endDate: oldEndDate = moment()
      .add(10, 'years')
      .format(ISO_OFFSET_FORMAT),
    bookingSchedule,
    exceptions,
  } = booking.attributes.metadata;
  const txId = booking.id.uuid;

  const { bookedDates = [], bookedDays = [] } = booking.listing.attributes.metadata;

  const filteredBookedDays = useMemo(() => bookedDays.filter(d => d.txId !== txId), [bookedDays]);

  const onFormSubmit = values => {
    if (!values.endDate?.date) {
      setShowInvalidError(true);
      return;
    }

    onUpdateBookingEndDate(booking, values.endDate.date);
  };

  const onFormChange = ({ values }) => {
    const endDate = values.endDate?.date;
    const timeZoneDate = endDate ? moment(endDate).format(ISO_OFFSET_FORMAT) : null;
    setSelectedEndDate(timeZoneDate);
    setShowInvalidError(false);
  };

  const hasRefund = useMemo(
    () =>
      selectedEndDate
        ? chargedLineItems.some(item =>
            item.lineItems?.some(i => moment(i.date).isAfter(moment(selectedEndDate)))
          )
        : false,
    [selectedEndDate, chargedLineItems]
  );

  // Any charged dates after old end date
  const chargedDates = useMemo(
    () =>
      chargedLineItems
        .map(item => item.lineItems?.map(i => i.date))
        .flat()
        .filter(d => (oldEndDate ? moment(d).isAfter(oldEndDate, 'day') : true)),
    [chargedLineItems, oldEndDate]
  );

  // Used to determine if the user can select future end dates to change to
  const endDateCharged = useMemo(() =>
    selectedEndDate
      ? chargedDates.some(d => moment(d).isSame(selectedEndDate, 'day'))
      : false[(chargedLineItems, oldEndDate)]
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
        render={formRenderProps => {
          const {
            handleSubmit,
            intl,
            booking,
            updateBookingEndDateInProgress,
            updateBookingEndDateError,
            updateBookingEndDateSuccess,
            onGoBack,
            invalid,
          } = formRenderProps;

          const { listing } = booking;

          const timezone = listing.attributes.publicData.availabilityPlan?.timezone;

          const isMobile = useCheckMobileScreen();

          const submitInProgress = updateBookingEndDateInProgress;
          const submitDisabled =
            updateBookingEndDateInProgress || updateBookingEndDateSuccess || invalid;
          const submitReady = updateBookingEndDateSuccess;

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
                isDayBlocked={filterAvailableBookingEndDates({
                  bookingSchedule,
                  exceptions,
                  bookedDates,
                  bookedDays: filteredBookedDays,
                  oldEndDate,
                  chargedDates,
                })}
                useMobileMargins
                showErrorMessage={false}
                renderDayContents={renderDayContents({
                  isMobile,
                  bookingSchedule,
                  exceptions,
                  bookedDates,
                  bookedDays: filteredBookedDays,
                  oldEndDate,
                  chargedDates,
                })}
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
                        Once your booking is complete, you will be refunded according to the table
                        below:
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
              {updateBookingEndDateError ? (
                <p className="text-error">Failed to update booking schedule. Please try again.</p>
              ) : null}
              {showInvalidError ? (
                <p className="text-error text-center">Please select a date.</p>
              ) : null}
              {endDateCharged ? (
                <p className="text-error text-center text-xs">
                  *Please Note: You cannot change the end date of your booking to a future date
                  after the current end date has been charged.
                </p>
              ) : null}
              <div className={css.modalButtonContainer}>
                <Button onClick={onGoBack} className={css.modalButton} type="button">
                  Back
                </Button>
                <PrimaryButton
                  inProgress={submitInProgress}
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
    updateBookingEndDateInProgress,
    updateBookingEndDateError,
    updateBookingEndDateSuccess,
  } = state.transactions;

  return {
    updateBookingEndDateInProgress,
    updateBookingEndDateError,
    updateBookingEndDateSuccess,
  };
};

const mapDispatchToProps = {
  onManageDisableScrolling: manageDisableScrolling,
  onUpdateBookingEndDate: updateBookingEndDate,
};

export default compose(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(ChangeEndDateModal);
