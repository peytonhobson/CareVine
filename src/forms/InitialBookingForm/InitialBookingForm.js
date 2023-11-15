import React, { useState } from 'react';

import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';

import { Button, Form, FieldRangeSlider, FieldButtonGroup } from '../../components';
import { injectIntl } from '../../util/reactIntl';
import classNames from 'classnames';

import css from './InitialBookingForm.module.css';

const buttonGroupOptions = [
  {
    key: 'oneTime',
    label: 'One Time',
  },
  {
    key: 'recurring',
    label: 'Repeat Weekly',
  },
];

const InitialBookingFormComponent = props => (
  <FinalForm
    {...props}
    render={formRenderProps => {
      const {
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
        createBookingDraftError,
        createBookingDraftInProgress,
        form,
      } = formRenderProps;

      const { scheduleType } = values;

      const { minPrice, maxPrice } = listing.attributes.publicData;
      const middleRate = Number.parseFloat((minPrice + maxPrice) / 200).toFixed(0);
      const classes = classNames(css.root, className);

      const submitInProgress = updateInProgress || createBookingDraftInProgress;
      const submitReady = updated || ready;
      const submitDisabled = invalid || disabled || submitInProgress || !scheduleType;

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
            <h2 className={css.fieldLabel}>What type of booking do you need?</h2>
            <FieldButtonGroup
              id="scheduleType"
              name="scheduleType"
              buttonRootClassName={css.scheduleType}
              options={buttonGroupOptions}
            />
          </div>
          {createBookingDraftError ? (
            <p className="text-error">
              Failed to create a booking draft. Please try again. If the issue persists, please
              contact support.
            </p>
          ) : null}
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
