import React, { useState } from 'react';

import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';

import {
  Button,
  Form,
  FieldRangeSlider,
  FieldDatePicker,
  InfoTooltip,
  FieldButtonGroup,
  FieldDateInput,
  IconClose,
} from '../../components';
import { FormattedMessage, injectIntl } from '../../util/reactIntl';
import {
  formatFieldDateInput,
  parseFieldDateInput,
  filterAvailableBookingEndDates,
  filterAvailableBookingStartDates,
} from '../../util/dates';
import classNames from 'classnames';
import { WEEKDAY_MAP } from '../../util/constants';

import css from './InitialBookingForm.module.css';

const TODAY = new Date();

// Date formatting used for placeholder texts:
const dateFormattingOptions = { month: 'short', day: 'numeric', weekday: 'short' };

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
        form,
      } = formRenderProps;

      const { scheduleType } = values;

      const { minPrice, maxPrice } = listing.attributes.publicData;
      const middleRate = Number.parseFloat((minPrice + maxPrice) / 200).toFixed(0);
      const classes = classNames(css.root, className);

      const submitInProgress = updateInProgress;
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
            <h2 className={css.fieldLabel}>How often do you need care?</h2>
            <FieldButtonGroup
              id="scheduleType"
              name="scheduleType"
              buttonRootClassName={css.scheduleType}
              options={buttonGroupOptions}
            />
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
