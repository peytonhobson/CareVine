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
  FieldRangeSlider,
} from '../../components';
import { convertTimeFrom12to24 } from '../../util/data';

import css from './ModifyBookingScheduleForm.module.css';
import { SectionOneTime, SectionRecurring } from '../EditBookingForm/sections';

const checkValidBookingTimes = (bookingTimes, bookingDates) => {
  if (!bookingTimes || !bookingDates || bookingDates.length === 0) return false;

  const sameLength = Object.keys(bookingTimes).length === bookingDates.length;
  const hasStartAndEndTimes = Object.keys(bookingTimes).every(
    bookingTime => bookingTimes[bookingTime].startTime && bookingTimes[bookingTime].endTime
  );

  return sameLength && hasStartAndEndTimes;
};

const ModifyBookingScheduleForm = props => (
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
        values,
        form,
        booking,
        onManageDisableScrolling,
        bookedDates,
      } = formRenderProps;

      const { type: bookingType } = booking.attributes.metadata;

      const { listing } = booking;

      const onDeleteEndDate = () => {
        form.change('endDate', null);
      };

      return (
        <Form>
          {bookingType === 'recurring' ? (
            <SectionRecurring
              values={values}
              intl={intl}
              onManageDisableScrolling={onManageDisableScrolling}
              listing={listing}
              onDeleteEndDate={onDeleteEndDate}
              form={form}
              unavailableDates={unavailableDates}
            />
          ) : (
            <SectionOneTime
              bookedDates={bookedDates}
              values={values}
              listing={listing}
              form={form}
            />
          )}
        </Form>
      );
    }}
  />
);

export default compose(injectIntl)(ModifyBookingScheduleForm);
