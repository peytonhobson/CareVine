import React, { useState, useEffect } from 'react';

import { compose } from 'redux';
import classNames from 'classnames';
import { Form as FinalForm, Field } from 'react-final-form';

import { Checkbox, Button, Form, CareScheduleExceptions } from '../../components';
import { FormattedMessage, injectIntl } from '../../util/reactIntl';

import css from './Care24HourForm.module.css';

const AVAILABILITY_PLAN_TYPE_24HOUR = 'availability-plan/24hour';
const AVAILABLE_DAYS = 'availableDays';
const weekdayButtons = [
  { day: 'monday', label: 'Monday' },
  { day: 'tuesday', label: 'Tuesday' },
  { day: 'wednesday', label: 'Wednesday' },
  { day: 'thursday', label: 'Thursday' },
  { day: 'friday', label: 'Friday' },
  { day: 'saturday', label: 'Saturday' },
  { day: 'sunday', label: 'Sunday' },
];

const Care24HourFormComponent = props => {
  const {
    availabilityExceptions,
    availabilityPlan,
    currentListing,
    disabled,
    fetchErrors,
    fetchExceptionsInProgress,
    intl,
    onAddAvailabilityException,
    onDeleteAvailabilityException,
    onManageDisableScrolling,
    onSubmit,
    ready,
    showErrors,
    submitButtonText,
    updated,
    updateInProgress,
    useDefaultPlan,
  } = props;

  const [selectedWeekdays, setSelectedWeekdays] = useState(
    availabilityPlan && availabilityPlan.availableDays
  );
  const [liveIn, setLiveIn] = useState(availabilityPlan && !!availabilityPlan.liveIn);

  const liveInCheckboxLabel = intl.formatMessage({ id: 'Care24HourForm.liveInCheckboxLabel' });

  const submitInProgress = updateInProgress;
  const submitReady = (updated || ready) && availabilityPlan.type === AVAILABILITY_PLAN_TYPE_24HOUR;
  const submitDisabled = selectedWeekdays.length === 0;

  const handleButtonClick = day => {
    setSelectedWeekdays(prevState => {
      if (prevState.includes(day)) {
        return prevState.filter(prevDay => prevDay !== day);
      } else {
        return [...prevState, day];
      }
    });
  };

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit({ availableDays: selectedWeekdays, liveIn });
  };

  return (
    <Form className={css.root} onSubmit={handleSubmit}>
      <h2>
        <FormattedMessage id="Care24HourForm.whichCareDays" />
      </h2>
      <div className={css.buttonContainer}>
        <div className={css.buttonRowContainer}>
          {weekdayButtons.map((button, index) => {
            if (index < 4) {
              return (
                <Button
                  key={index}
                  className={
                    selectedWeekdays.includes(button.day) ? css.selectedButton : css.weekdayButton
                  }
                  type="button"
                  onClick={e => {
                    e.preventDefault();
                    handleButtonClick(button.day);
                  }}
                >
                  {button.label}
                </Button>
              );
            }
          })}
        </div>
        <div className={css.buttonRowContainer}>
          {weekdayButtons.map((button, index) => {
            if (index >= 4) {
              return (
                <Button
                  key={index}
                  className={
                    selectedWeekdays.includes(button.day) ? css.selectedButton : css.weekdayButton
                  }
                  type="button"
                  onClick={e => {
                    e.preventDefault();
                    handleButtonClick(button.day);
                  }}
                >
                  {button.label}
                </Button>
              );
            }
          })}
        </div>
      </div>
      <Checkbox
        className={css.checkbox}
        id="liveIn"
        name="liveIn"
        label={liveInCheckboxLabel}
        checked={liveIn}
        value={liveIn}
        onClick={() => setLiveIn(prevLiveIn => !prevLiveIn)}
      />
      <div className={css.children}>
        <CareScheduleExceptions
          fetchExceptionsInProgress={fetchExceptionsInProgress}
          availabilityExceptions={availabilityExceptions}
          onDeleteAvailabilityException={onDeleteAvailabilityException}
          onAddAvailabilityException={onAddAvailabilityException}
          onManageDisableScrolling={onManageDisableScrolling}
          availabilityPlan={availabilityPlan}
          updateInProgress={updateInProgress}
          errors={fetchErrors}
          disabled={disabled}
          ready={ready}
          listing={currentListing}
          useDefaultPlan={useDefaultPlan}
        />
      </div>
      {fetchErrors.updateListingError && showErrors ? (
        <p className={css.error}>
          <FormattedMessage id="Care24HourForm.updateFailed" />
        </p>
      ) : null}
      <div className={css.submitButtonContainer}>
        <Button
          className={css.submitButton}
          disabled={submitDisabled}
          type="submit"
          inProgress={submitInProgress}
          ready={submitReady}
        >
          {submitButtonText}
        </Button>
      </div>
    </Form>
  );
};

const Care24HourForm = compose(injectIntl)(Care24HourFormComponent);

export default Care24HourForm;
