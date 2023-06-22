import React, { useEffect, useState } from 'react';
import { compose } from 'redux';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import { intlShape, injectIntl, FormattedMessage } from '../../util/reactIntl';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';
import {
  Form,
  Button,
  FieldSelect,
  Modal,
  FieldDatePicker,
  FieldTextInput,
  NamedLink,
} from '../../components';
import {
  isTransactionInitiateAmountTooLowError,
  isTransactionInitiateListingNotFoundError,
  isTransactionInitiateBookingTimeNotAvailableError,
  isTransactionChargeDisabledError,
  transactionInitiateOrderStripeErrors,
} from '../../util/errors';
import { createSlug } from '../../util/urlHelpers';
import { convertTimeFrom12to24 } from '../../util/data';

import css from './EditBookingForm.module.css';

const BANK_ACCOUNT = 'Bank Account';
const CREDIT_CARD = 'Payment Card';

const checkValidBookingTimes = (bookingTimes, bookingDates) => {
  if (!bookingTimes || !bookingDates) return false;

  const sameLength = Object.keys(bookingTimes).length === bookingDates.length;
  const hasStartAndEndTimes = Object.keys(bookingTimes).every(
    bookingTime => bookingTimes[bookingTime].startTime && bookingTimes[bookingTime].endTime
  );

  return sameLength && hasStartAndEndTimes;
};

const checkValidPaymentMethod = (paymentMethod, defaultPaymentMethods) => {
  if (!paymentMethod || !defaultPaymentMethods) return false;

  if (paymentMethod === BANK_ACCOUNT) {
    return !!defaultPaymentMethods.bankAccount?.id;
  }

  if (paymentMethod === CREDIT_CARD) {
    return !!defaultPaymentMethods.card?.id;
  }

  return false;
};

const EditBookingFormComponent = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={formRenderProps => {
      const {
        className,
        disabled,
        ready,
        handleSubmit,
        intl,
        invalid,
        pristine,
        updated,
        updateInProgress,
        monthYearBookingDates,
        onChange,
        values,
        monthlyTimeSlots,
        form,
        onManageDisableScrolling,
        bookingDates,
        onSetState,
        children,
        authorDisplayName,
        defaultPaymentMethods,
        selectedPaymentMethod,
        initiateOrderInProgress,
        initiateOrderError,
        transaction,
        currentListing,
        listingTitle,
      } = formRenderProps;

      const listingNotFound = isTransactionInitiateListingNotFoundError(initiateOrderError);
      const isChargeDisabledError = isTransactionChargeDisabledError(initiateOrderError);
      const isBookingTimeNotAvailableError = isTransactionInitiateBookingTimeNotAvailableError(
        initiateOrderError
      );
      const stripeErrors = transactionInitiateOrderStripeErrors(initiateOrderError);

      const listingLink = (
        <NamedLink
          name="ListingPage"
          params={{ id: currentListing.id.uuid, slug: createSlug(listingTitle) }}
        >
          <FormattedMessage id="CheckoutPage.errorlistingLinkText" />
        </NamedLink>
      );

      let initiateOrderErrorMessage = null;
      let listingNotFoundErrorMessage = null;

      if (listingNotFound) {
        listingNotFoundErrorMessage = (
          <p className={css.error}>
            <FormattedMessage id="CheckoutPage.listingNotFoundError" />
          </p>
        );
      } else if (isBookingTimeNotAvailableError) {
        initiateOrderErrorMessage = (
          <p className={css.error}>
            <FormattedMessage
              id="CheckoutPage.bookingTimeNotAvailableMessage"
              values={{ listingLink }}
            />
          </p>
        );
      } else if (isChargeDisabledError) {
        initiateOrderErrorMessage = (
          <p className={css.error}>
            <FormattedMessage id="CheckoutPage.chargeDisabledMessage" />
          </p>
        );
      } else if (stripeErrors && stripeErrors.length > 0) {
        // NOTE: Error messages from Stripes are not part of translations.
        // By default they are in English.
        const stripeErrorsAsString = stripeErrors.join(', ');
        initiateOrderErrorMessage = (
          <p className={css.error}>
            <FormattedMessage
              id="CheckoutPage.initiateOrderStripeError"
              values={{ stripeErrors: stripeErrorsAsString }}
            />
          </p>
        );
      } else if (initiateOrderError) {
        // Generic initiate order error
        initiateOrderErrorMessage = (
          <p className={css.error}>
            <FormattedMessage id="CheckoutPage.initiateOrderError" values={{ listingLink }} />
          </p>
        );
      }

      const [isEditBookingDatesModalOpen, setIsEditBookingDatesModalOpen] = useState(false);

      useEffect(() => {
        form.change('bookingDates', bookingDates);
      }, [JSON.stringify(bookingDates)]);

      const handleCloseEditBookingDatesModal = () => {
        setIsEditBookingDatesModalOpen(false);
      };

      const handleSaveBookingDates = () => {
        onSetState({ bookingDates: values.bookingDates });
        const newMonthYearBookingDates = values.bookingDates.map(
          bookingDate =>
            `${new Date(bookingDate).getMonth() + 1}/${new Date(bookingDate).getDate()}`
        );

        const newDateTimes = values.dateTimes
          ? Object.keys(values.dateTimes)?.reduce((acc, monthYear) => {
              if (newMonthYearBookingDates.includes(monthYear)) {
                acc[monthYear] = values.dateTimes[monthYear];
              }
              return acc;
            }, {})
          : {};

        form.change('dateTimes', newDateTimes);
        setIsEditBookingDatesModalOpen(false);
      };

      const bookedDates = currentListing.attributes.metadata.bookedDates;

      const classes = classNames(css.root, className);
      const submitInProgress = updateInProgress;
      const submitReady = (updated && pristine) || ready;
      const submitDisabled =
        invalid ||
        disabled ||
        !checkValidBookingTimes(values.dateTimes, bookingDates) ||
        !checkValidPaymentMethod(selectedPaymentMethod, defaultPaymentMethods);

      const onSubmit = e => {
        e.preventDefault();
        if (submitDisabled) {
          return;
        }
        handleSubmit(e);
      };

      return (
        <Form className={classes} onSubmit={onSubmit}>
          <FormSpy onChange={onChange} />
          <h2 className={css.pickYourTimes}>Pick your Times</h2>
          <Button
            className={css.changeDatesButton}
            onClick={() => setIsEditBookingDatesModalOpen(true)}
            type="button"
          >
            Change Dates
          </Button>
          <div className={css.datesContainer}>
            {monthYearBookingDates.map(monthYearBookingDate => {
              const startTimeValue = values.dateTimes?.[monthYearBookingDate]?.startTime;
              const endTimeValue = values.dateTimes?.[monthYearBookingDate]?.endTime;
              const integerStartTimeVal = startTimeValue
                ? Number.parseInt(convertTimeFrom12to24(startTimeValue).split(':')[0])
                : null;
              const integerEndTimeVal = endTimeValue
                ? Number.parseInt(convertTimeFrom12to24(endTimeValue).split(':')[0])
                : 0;

              return (
                <div className={css.dateContainer} key={monthYearBookingDate}>
                  <h3 className={css.date}>{monthYearBookingDate}</h3>
                  <div className={css.formRow}>
                    <div className={css.field}>
                      <FieldSelect
                        id={`dateTimes.${monthYearBookingDate}.startTime`}
                        name={`dateTimes.${monthYearBookingDate}.startTime`}
                        selectClassName={css.timeSelect}
                        initialValueSelected={monthYearBookingDate.startTime}
                      >
                        <option disabled value="">
                          8:00am
                        </option>
                        {Array.from(
                          { length: integerEndTimeVal ? integerEndTimeVal : 24 },
                          (v, i) => i
                        ).map(i => {
                          const hour = i % 12 || 12;
                          const ampm = i < 12 ? 'am' : 'pm';
                          const time = `${hour}:00${ampm}`;
                          return (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          );
                        })}
                      </FieldSelect>
                    </div>
                    <span className={css.dashBetweenTimes}>-</span>
                    <div className={css.field}>
                      <FieldSelect
                        id={`dateTimes.${monthYearBookingDate}.endTime`}
                        name={`dateTimes.${monthYearBookingDate}.endTime`}
                        selectClassName={css.timeSelect}
                      >
                        <option disabled value="">
                          5:00pm
                        </option>
                        {Array.from({ length: 24 - integerStartTimeVal }, (v, i) => i).map(i => {
                          const hour = (i + integerStartTimeVal + 1) % 12 || 12;
                          const ampm =
                            i + integerStartTimeVal + 1 < 12 || i + integerStartTimeVal === 23
                              ? 'am'
                              : 'pm';
                          const time = `${hour}:00${ampm}`;
                          return (
                            <option key={i + 25} value={time}>
                              {time}
                            </option>
                          );
                        })}
                      </FieldSelect>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {children}
          <div className={css.sendAMessage}>
            <h2>Send a Message (Optional)</h2>
            <FieldTextInput
              id="message"
              name="message"
              type="textarea"
              label="Message"
              placeholder={`Hello ${authorDisplayName}! I'm looking forward to…`}
              className={css.message}
            />
          </div>
          <div>
            {listingNotFoundErrorMessage}
            {initiateOrderErrorMessage}
            <p className={css.paymentInfo}>
              You will not be charged until the caregiver accepts the booking
            </p>
            <Button
              className={css.submitButton}
              disabled={submitDisabled}
              inProgress={initiateOrderInProgress}
              ready={transaction}
              type="submit"
            >
              Request to Book
            </Button>
          </div>
          <Modal
            id="EditBookingDatesModal"
            isOpen={isEditBookingDatesModalOpen}
            onClose={handleCloseEditBookingDatesModal}
            onManageDisableScrolling={onManageDisableScrolling}
            containerClassName={css.modalContainer}
            className={css.modalContent}
          >
            <FieldDatePicker
              className={css.datePicker}
              bookedDates={bookedDates}
              name="bookingDates"
              id="bookingDates"
            >
              <p className={css.bookingTimeText}>Caregivers can be booked for 1-14 days</p>
            </FieldDatePicker>
            <Button
              onClick={handleSaveBookingDates}
              type="button"
              disabled={!values.bookingDates || values.bookingDates?.length === 0}
            >
              Save Dates
            </Button>
          </Modal>
        </Form>
      );
    }}
  />
);

export default compose(injectIntl)(EditBookingFormComponent);
