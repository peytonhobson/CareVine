import React, { useState } from 'react';

import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';

import { Button, Form, FieldRangeSlider, FieldDatePicker, InfoTooltip } from '../../components';
import { FormattedMessage, injectIntl } from '../../util/reactIntl';
import classNames from 'classnames';

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
        className,
      } = formRenderProps;

      const { minPrice, maxPrice, availabilityPlan } = listing.attributes.publicData;
      const middleRate = Number.parseFloat((minPrice + maxPrice) / 200).toFixed(0);
      const bookedDates = listing.attributes.metadata.bookedDates ?? [];
      const classes = classNames(css.root, className);

      const submitInProgress = updateInProgress;
      const submitReady = updated || ready;
      const submitDisabled =
        invalid || disabled || !values.bookingDates || values.bookingDates?.length === 0;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <div className={css.fieldContainer}>
            <h2 className={css.fieldLabel}>Choose an hourly rate:</h2>
            <h1 className={css.fieldLabel} style={{ marginBlock: 0 }}>
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
            <div className={css.selectDatesContainer}>
              <h2>Select your dates:</h2>
              <InfoTooltip
                className={css.infoTooltip}
                title="You can book up to two weeks at a time."
              />
            </div>
            <FieldDatePicker bookedDates={bookedDates} name="bookingDates" id="bookingDates">
              <p className={css.bookingTimeText}>
                Caregivers can only be booked within a two-week period
              </p>
            </FieldDatePicker>
          </div>

          <Button
            className={css.submitButton}
            disabled={submitDisabled}
            type="submit"
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
