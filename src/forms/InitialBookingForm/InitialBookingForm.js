import React, { useState } from 'react';

import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';

import { Button, Form, FieldRangeSlider, FieldButtonGroup, FieldDateInput } from '../../components';
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

const defaultTimeZone = () =>
  typeof window !== 'undefined' ? getDefaultTimeZoneOnBrowser() : 'Etc/UTC';

// Format form's value for the react-dates input: convert timeOfDay to the local time
const formatFieldDateInput = timeZone => v =>
  v && v.date ? { date: timeOfDayFromTimeZoneToLocal(v.date, timeZone) } : { date: v };

// Parse react-dates input's value: convert timeOfDay to the given time zone
const parseFieldDateInput = timeZone => v =>
  v && v.date ? { date: timeOfDayFromLocalToTimeZone(v.date, timeZone) } : v;

const getAvailabileEndDates = startDate => day => {
  if (day >= startDate) {
    return false;
  }
  return true;
};

const getAvailabileStartDates = endDate => day => {
  if (!endDate || day <= endDate) {
    return false;
  }
  return true;
};

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
          <div>
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
          <div>
            <h2 className={css.fieldLabel}>Select your dates:</h2>
          </div>

          <Button
            className={css.submitButton}
            disabled={submitDisabled}
            // type={submitButtonType || 'submit'}
            // onClick={submitButtonType === 'button' ? handleSubmit : null}
            inProgress={submitInProgress}
            ready={submitReady}
          >
            Continue to Book
          </Button>
        </Form>
      );
    }}
  />
);

const InitialBookingForm = compose(injectIntl)(InitialBookingFormComponent);

export default InitialBookingForm;
