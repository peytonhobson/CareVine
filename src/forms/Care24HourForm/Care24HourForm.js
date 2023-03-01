import React, { useState, useEffect, useRef } from 'react';

import { compose } from 'redux';
import zipcodeToTimezone from 'zipcode-to-timezone';
import { Form as FinalForm, FormSpy } from 'react-final-form';

import {
  Checkbox,
  Button,
  Form,
  CareScheduleExceptions,
  FieldTextInput,
  FieldAddSubtract,
} from '../../components';
import { FormattedMessage, injectIntl } from '../../util/reactIntl';
import { timestampToDate } from '../../util/dates';
import { TimelineForm } from '../../forms';

import css from './Care24HourForm.module.css';

const AVAILABILITY_PLAN_TYPE_24HOUR = '24hour';
const weekdayButtons = [
  { day: 'mon', label: 'Monday' },
  { day: 'tue', label: 'Tuesday' },
  { day: 'wed', label: 'Wednesday' },
  { day: 'thu', label: 'Thursday' },
  { day: 'fri', label: 'Friday' },
  { day: 'sat', label: 'Saturday' },
  { day: 'sun', label: 'Sunday' },
];

const formatHours = value => {
  // if input value is falsy eg if the user deletes the input, then just return
  if (!value) return value;

  // clean the input for any non-digit values.
  const hours = value.replace(/[^\d]/g, '');

  return hours;
};

const Care24HourFormComponent = props => {
  const {
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
    submitButtonType,
  } = props;

  const [selectedWeekdays, setSelectedWeekdays] = useState(availabilityPlan?.availableDays || []);
  const [availabilityExceptions, setAvailabilityExceptions] = useState(
    availabilityPlan?.availabilityExceptions || []
  );
  const [liveIn, setLiveIn] = useState(availabilityPlan?.liveIn);
  const [hoursPerDay, setHoursPerDay] = useState(availabilityPlan?.hoursPerDay || 8);

  const savedStartDate = availabilityPlan && availabilityPlan.startDate;
  const savedEndDate = availabilityPlan && availabilityPlan.endDate;
  const [startDate, setStartDate] = useState(savedStartDate);
  const [endDate, setEndDate] = useState(savedEndDate);

  const liveInCheckboxLabel = intl.formatMessage({ id: 'Care24HourForm.liveInCheckboxLabel' });

  const submitInProgress = updateInProgress;
  const submitReady = (updated || ready) && availabilityPlan.type === AVAILABILITY_PLAN_TYPE_24HOUR;
  const submitDisabled =
    (selectedWeekdays === availabilityPlan?.availableDays &&
      startDate === savedStartDate &&
      endDate === savedEndDate &&
      liveIn === !!availabilityPlan?.liveIn &&
      availabilityExceptions === availabilityPlan?.availabilityExceptions &&
      hoursPerDay === availabilityPlan?.hoursPerDay) ||
    selectedWeekdays.length === 0;

  const timezone = zipcodeToTimezone.lookup(currentListing.attributes.publicData.location.zipcode);

  const timelineInitialValues = {
    startDate: {
      date: savedStartDate ? timestampToDate(savedStartDate) : null,
    },
    endDate: {
      date: savedEndDate ? timestampToDate(savedEndDate) : null,
    },
  };

  const hoursPerDayLabel = (
    <h2>
      How many hours will they be working per day?<span className={css.error}>*</span>
    </h2>
  );

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
    onSubmit({
      availableDays: selectedWeekdays,
      liveIn,
      hoursPerDay,
      availabilityExceptions,
      startDate,
      endDate,
    });
  };

  const handleSaveAvailabilityException = exception => {
    setAvailabilityExceptions(prevExceptions => [...prevExceptions, exception]);
  };

  const handleDeleteException = start => {
    setAvailabilityExceptions(prevExceptions =>
      prevExceptions.filter(exception => exception.attributes.start !== start)
    );
  };

  const onStartDateChange = date => {
    setStartDate(date?.date?.getTime());
  };

  const onEndDateChange = date => {
    setEndDate(date?.date?.getTime());
  };

  return (
    <Form className={css.root} onSubmit={handleSubmit}>
      <TimelineForm
        className={css.timelineForm}
        rootClassName={css.timelineForm}
        formId="TimelineForm"
        initialValues={timelineInitialValues}
        intl={intl}
        timeZone={timezone}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
        onSubmit={() => {}}
        keepDirtyOnReinitialize
      />
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
      <FinalForm
        onSubmit={() => {}}
        render={() => {
          return (
            <div className={css.hoursPerDayContainer}>
              <FormSpy onChange={e => setHoursPerDay(e.values.hoursPerDay)} />
              <FieldAddSubtract
                name="hoursPerDay"
                fieldClassName={css.hoursPerDayField}
                startingCount={8}
                max={24}
                min={1}
                label={hoursPerDayLabel}
                countLabel="hours"
              />
            </div>
          );
        }}
      />
      <div className={css.exceptionsContainer}>
        <h2 className={css.exceptionsTitle}>Are there any exceptions to this schedule?</h2>
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
          onDelete={handleDeleteException}
          onSave={handleSaveAvailabilityException}
        />
      </div>
      {fetchErrors?.updateListingError && showErrors ? (
        <p className={css.error}>
          <FormattedMessage id="Care24HourForm.updateFailed" />
        </p>
      ) : null}
      <Button
        className={css.submitButton}
        disabled={submitDisabled}
        type={submitButtonType || 'submit'}
        onClick={submitButtonType === 'button' ? handleSubmit : null}
        inProgress={submitInProgress}
        ready={submitReady}
      >
        {submitButtonText}
      </Button>
    </Form>
  );
};

const Care24HourForm = compose(injectIntl)(Care24HourFormComponent);

export default Care24HourForm;
