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
} from '../../components';
import { convertTimeFrom12to24 } from '../../util/data';
import { required } from '../../util/validators';

import css from './EditBookingForm.module.css';

const checkBookingTimes = (bookingTimes, bookingDates) => {
  if (!bookingTimes || !bookingDates) return false;

  const sameLength = Object.keys(bookingTimes).length === bookingDates.length;
  const hasStartAndEndTimes = Object.keys(bookingTimes).every(
    bookingTime => bookingTimes[bookingTime].startTime && bookingTimes[bookingTime].endTime
  );

  return sameLength && hasStartAndEndTimes;
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
        saveActionMsg,
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
        hasDefaultPaymentMethod,
      } = formRenderProps;

      const [isEditBookingDatesModalOpen, setIsEditBookingDatesModalOpen] = useState(false);

      useEffect(() => {
        form.change('bookingDates', bookingDates);
      }, [JSON.stringify(bookingDates)]);

      const handleCloseEditBookingDatesModal = () => {
        setIsEditBookingDatesModalOpen(false);
      };

      const handleSaveBookingDates = () => {
        onSetState({ bookingDates: values.bookingDates });
        setIsEditBookingDatesModalOpen(false);
      };

      const classes = classNames(css.root, className);
      const submitInProgress = updateInProgress;
      const submitReady = (updated && pristine) || ready;
      const submitDisabled =
        invalid || disabled || !checkBookingTimes(values.dateTimes, bookingDates);

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <FormSpy onChange={onChange} />
          <h2 style={{ display: 'inline' }}>Pick your Times</h2>
          <Button
            className={css.changeDatesButton}
            onClick={() => setIsEditBookingDatesModalOpen(true)}
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
                        <option disabled>8:00am</option>
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
                        <option disabled>5:00pm</option>
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
          <h2>Send a Message (Optional)</h2>
          <FieldTextInput
            id="message"
            name="message"
            type="textarea"
            label="Message"
            placeholder={`Hello ${authorDisplayName}! I'm looking forward to…`}
            className={css.message}
          />
          <p className={css.paymentInfo}>
            You will not be charged until the caregiver accepts the booking
          </p>
          <Button className={css.submitButton} disabled={submitDisabled}>
            Request to Book
          </Button>
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
              monthlyTimeSlots={monthlyTimeSlots}
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
