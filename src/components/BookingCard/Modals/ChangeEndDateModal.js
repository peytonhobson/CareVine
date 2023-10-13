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
import classNames from 'classnames';

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
  endDateCharged,
}) => date => {
  // If current end date is in charged line items, all dates after should be unavailable.
  // This ensures if a user extends the end date that we don't have to deal with the additional
  // charges that finish out their charged line items.
  const isCharged = endDateCharged && moment(date).isAfter(oldEndDate, 'day');
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
  endDateCharged,
}) => (date, classes) => {
  const isCharged = endDateCharged && moment(date).isAfter(oldEndDate, 'day');
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
      className={classNames(
        available ? 'text-light cursor-pointer hover:bg-light hover:text-primary px-3 py-1' : null,
        isCurrentEndDate ? 'text-success' : null
      )}
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

  const providerDisplayName = booking?.provider?.attributes?.profile?.displayName;

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

  // Used to determine if the user can select future end dates to change to
  const endDateCharged = useMemo(() =>
    oldEndDate
      ? chargedLineItems
          .map(item => item.lineItems?.map(i => i.date))
          .flat()
          .some(d => moment(d).isSame(oldEndDate, 'day'))
      : false[(chargedLineItems, oldEndDate)]
  );

  const startOfSelectedDay = moment(selectedEndDate).startOf('day');
  const threeDaysFromNow = moment().add(3, 'days');
  const expiration = moment(startOfSelectedDay).isAfter(threeDaysFromNow)
    ? threeDaysFromNow.format('MMMM Do')
    : startOfSelectedDay.format('MMMM Do');
  const expirationTime = moment(startOfSelectedDay).isAfter(threeDaysFromNow)
    ? threeDaysFromNow.format('h:mm a')
    : startOfSelectedDay.format('h:mm a');
  const futureDateSelected = selectedEndDate && moment(selectedEndDate).isAfter(oldEndDate, 'day');

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

          const formattedEndDate = moment(selectedEndDate).format('MMMM Do');

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
                  endDateCharged,
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
                  endDateCharged,
                })}
                withPortal={isMobile}
              />
              {selectedEndDate ? (
                <>
                  {futureDateSelected ? (
                    <p className={classNames(css.modalMessage, 'text-primary')}>
                      When you click 'Submit', a request to change your booking end date to{' '}
                      {formattedEndDate} will be sent to {providerDisplayName}. They have until{' '}
                      {expiration} at {expirationTime} to accept or decline. If they respond or the
                      request expires, you will be notified.
                    </p>
                  ) : (
                    <p className={classNames(css.modalMessage, 'text-primary')}>
                      By clicking 'Submit', the end date of your booking will be changed to{' '}
                      {formattedEndDate}. You will not be charged for any time after this date.
                    </p>
                  )}
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
                  *Please Note: You cannot select a future date because your current end date has
                  already been charged.
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
