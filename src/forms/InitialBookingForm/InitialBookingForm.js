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
  getAvailableStartDates,
  getAvailableEndDates,
} from '../../util/dates';
import classNames from 'classnames';

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

      const { startDate, endDate, scheduleType } = values;

      const onDeleteEndDate = () => {
        form.change('endDate', null);
      };

      const { minPrice, maxPrice, availabilityPlan } = listing.attributes.publicData;
      const timezone = availabilityPlan.timezone;
      const middleRate = Number.parseFloat((minPrice + maxPrice) / 200).toFixed(0);
      const bookedDates = listing.attributes.metadata.bookedDates ?? [];
      const classes = classNames(css.root, className);

      const submitInProgress = updateInProgress;
      const submitReady = updated || ready;
      const noBookingDates =
        scheduleType === 'oneTime'
          ? !values.bookingDates || values.bookingDates?.length === 0
          : false;
      const noDateRange = scheduleType === 'recurring' ? !startDate : false;
      const submitDisabled =
        invalid || disabled || submitInProgress || noBookingDates || noDateRange;

      const startDay = startDate?.date;
      const endDay = endDate?.date;

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
              initialSelect="oneTime"
            />
          </div>
          <div className={css.fieldContainer}>
            {values.scheduleType === 'oneTime' ? (
              <>
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
              </>
            ) : (
              <>
                <h2>When do you need this care?</h2>
                <div className={css.dateInputContainer}>
                  <FieldDateInput
                    className={css.fieldDateInput}
                    name="startDate"
                    id="startDate"
                    label="Start Date"
                    placeholderText={intl.formatDate(TODAY, dateFormattingOptions)}
                    format={formatFieldDateInput(timezone)}
                    parse={parseFieldDateInput(timezone)}
                    isDayBlocked={getAvailableStartDates(endDay)}
                    useMobileMargins
                    showErrorMessage={false}
                  />
                  <div className={css.endDateContainer}>
                    <FieldDateInput
                      name="endDate"
                      id="endDate"
                      className={css.fieldDateInput}
                      label="End Date • optional"
                      placeholderText={intl.formatDate(TODAY, dateFormattingOptions)}
                      format={formatFieldDateInput(timezone)}
                      parse={parseFieldDateInput(timezone)}
                      isDayBlocked={getAvailableEndDates(startDay, timezone)}
                      useMobileMargins
                      showErrorMessage={false}
                      disabled={!startDate || !startDate.date}
                    />
                    <button
                      className={css.removeExceptionButton}
                      onClick={() => onDeleteEndDate()}
                      type="button"
                    >
                      <IconClose size="normal" className={css.removeIcon} />
                    </button>
                  </div>
                </div>
              </>
            )}
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
