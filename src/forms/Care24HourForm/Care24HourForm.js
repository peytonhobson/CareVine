import React, { useState, useEffect, useReducer } from 'react';

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

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

const init = initialState => {};

const reducer = (state, action) => {};

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
    onChange,
    values,
  } = props;

  const savedStartDate = availabilityPlan?.startDate;
  const savedEndDate = availabilityPlan?.endDate;
  const initialState = { savedEndDate, savedStartDate, availabilityPlan };
  const [state, dispatch] = useReducer(reducer, initialState, init);

  const [selectedWeekdays, setSelectedWeekdays] = useState(availabilityPlan?.availableDays || []);
  const [availabilityExceptions, setAvailabilityExceptions] = useState(
    availabilityPlan?.availabilityExceptions || []
  );
  const [liveIn, setLiveIn] = useState(availabilityPlan?.liveIn);
  const [hoursPerDay, setHoursPerDay] = useState(availabilityPlan?.hoursPerDay || 8);
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
    selectedWeekdays?.length === 0;

  const timezone = zipcodeToTimezone.lookup(
    currentListing.attributes.publicData?.location?.zipcode
  );

  const timelineInitialValues = {
    startDate: {
      date: savedStartDate ? timestampToDate(savedStartDate) : null,
    },
    endDate: {
      date: savedEndDate ? timestampToDate(savedEndDate) : null,
    },
  };

  const hoursPerDayLabel = (
    <h2 className={css.hoursPerDayLabel}>
      How many hours will they be working per day?<span className={css.error}>*</span>
    </h2>
  );

  const handleButtonClick = day => {
    setSelectedWeekdays(prevState => {
      let newWeekdays = null;

      if (prevState.includes(day)) {
        newWeekdays = prevState.filter(prevDay => prevDay !== day);
      } else {
        newWeekdays = [...prevState, day];
      }

      onChange({
        type: AVAILABILITY_PLAN_TYPE_24HOUR,
        timezone,
        availableDays: newWeekdays,
        liveIn,
        hoursPerDay,
        availabilityExceptions,
        startDate,
        endDate,
      });

      return newWeekdays;
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
    setAvailabilityExceptions(prevExceptions => {
      const newExceptions = prevExceptions.concat(exception);

      onChange({
        type: AVAILABILITY_PLAN_TYPE_24HOUR,
        timezone,
        availableDays: selectedWeekdays,
        liveIn,
        hoursPerDay,
        availabilityExceptions: newExceptions,
        startDate,
        endDate,
      });

      return newExceptions;
    });
  };

  const handleDeleteException = start => {
    setAvailabilityExceptions(prevExceptions => {
      const newExceptions = prevExceptions.filter(
        exception => exception.attributes.start !== start
      );

      onChange({
        type: AVAILABILITY_PLAN_TYPE_24HOUR,
        timezone,
        availableDays: selectedWeekdays,
        liveIn,
        hoursPerDay,
        availabilityExceptions: newExceptions,
        startDate,
        endDate,
      });

      return newExceptions;
    });
  };

  const onStartDateChange = date => {
    const timeDate = date?.date.getTime();
    setStartDate(timeDate);
    onChange({
      type: AVAILABILITY_PLAN_TYPE_24HOUR,
      timezone,
      availableDays: selectedWeekdays,
      liveIn,
      hoursPerDay,
      availabilityExceptions,
      startDate: timeDate,
      endDate,
    });
  };

  const onEndDateChange = date => {
    const timeDate = date?.date.getTime();
    setEndDate(timeDate);
    onChange({
      type: AVAILABILITY_PLAN_TYPE_24HOUR,
      timezone,
      availableDays: selectedWeekdays,
      liveIn,
      hoursPerDay,
      availabilityExceptions,
      startDate,
      endDate: timeDate,
    });
  };

  const handleSetHoursPerDay = hoursPerDay => {
    setHoursPerDay(hoursPerDay);
    onChange({
      type: AVAILABILITY_PLAN_TYPE_24HOUR,
      timezone,
      availableDays: selectedWeekdays,
      liveIn,
      hoursPerDay,
      availabilityExceptions,
      startDate,
      endDate,
    });
  };

  const handleSetLiveIn = () => {
    setLiveIn(prevLiveIn => {
      const newLiveIn = !prevLiveIn;

      onChange({
        type: AVAILABILITY_PLAN_TYPE_24HOUR,
        timezone,
        availableDays: selectedWeekdays,
        liveIn: newLiveIn,
        hoursPerDay,
        availabilityExceptions,
        startDate,
        endDate,
      });

      return newLiveIn;
    });
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
      <div className={css.buttonContainer}>
        <h2>
          <FormattedMessage id="Care24HourForm.whichCareDays" />
        </h2>
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
        onClick={handleSetLiveIn}
      />
      <FinalForm
        onSubmit={() => {}}
        render={() => {
          return (
            <div className={css.hoursPerDayContainer}>
              <FormSpy onChange={e => handleSetHoursPerDay(e.values.hoursPerDay)} />
              <FieldAddSubtract
                name="hoursPerDay"
                fieldClassName={css.hoursPerDayField}
                startingCount={hoursPerDay}
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
