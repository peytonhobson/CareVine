import React, { useState } from 'react';

import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';

import {
  Button,
  Form,
  FieldRangeSlider,
  FieldButtonGroup,
  FieldDateInput,
  FieldDatePicker,
} from '../../components';
import { FormattedMessage, injectIntl } from '../../util/reactIntl';
import {
  resetToStartOfDay,
  timeOfDayFromLocalToTimeZone,
  timeOfDayFromTimeZoneToLocal,
  dateIsAfter,
  monthIdStringInTimeZone,
  getMonthStartInTimeZone,
  nextMonthFn,
  prevMonthFn,
} from '../../util/dates';
import { bookingDateRequired } from '../../util/validators';

import css from './InitialBookingForm.module.css';

const TODAY = new Date();

const InitialBookingFormComponent = props => (
  <FinalForm
    {...props}
    render={formRenderProps => {
      const {
        careSchedule,
        disabled,
        invalid,
        intl,
        listing,
        handleSubmit,
        ready,
        updated,
        updateInProgress,
        values,
        monthlyTimeSlots,
      } = formRenderProps;

      const { minPrice, maxPrice, availabilityPlan } = listing.attributes.publicData;
      const middleRate = Number.parseFloat((minPrice + maxPrice) / 2).toFixed(0) / 100;

      const timeZone = availabilityPlan.timezone;
      const [currentMonth, setCurrentMonth] = useState(getMonthStartInTimeZone(TODAY, timeZone));

      const submitInProgress = updateInProgress;
      const submitReady = (updated || ready) && careSchedule.type === AVAILABILITY_PLAN_TYPE_24HOUR;
      const submitDisabled = false;

      return (
        <Form className={css.root} onSubmit={handleSubmit}>
          <div className={css.fieldContainer}>
            <h2 className={css.fieldLabel}>Choose an hourly rate:</h2>
            <h1 className={css.fieldLabel} style={{ marginBottom: 0 }}>
              ${values.rate}
            </h1>
            <div className={css.availableRatesContainer}>
              <p>${minPrice / 100}</p>
              <p>$50</p>
            </div>
            <FieldRangeSlider
              id="rate"
              name="rate"
              className={css.priceRange}
              trackClass={css.track}
              min={minPrice / 100}
              max={50}
              step={1}
              handles={[middleRate]}
              noHandleLabels
            />
          </div>
          <div className={css.fieldContainer}>
            <h2 className={css.fieldLabel}>Select your dates:</h2>
            <FieldDatePicker
              monthlyTimeSlots={monthlyTimeSlots}
              name="bookingDates"
              id="bookingDates"
            />
          </div>

          <Button
            className={css.submitButton}
            disabled={submitDisabled}
            // type={submitButtonType || 'submit'}
            // onClick={submitButtonType === 'button' ? handleSubmit : null}
            inProgress={submitInProgress}
            ready={submitReady}
          >
            Continue to Booking
          </Button>
        </Form>
      );
    }}
  />
);

const InitialBookingForm = compose(injectIntl)(InitialBookingFormComponent);

export default InitialBookingForm;
