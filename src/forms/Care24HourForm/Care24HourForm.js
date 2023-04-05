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

const ADD_SELECTED_WEEKDAY = 'ADD_SELECTED_WEEKDAY';
const DELETE_SELECTED_WEEKDAY = 'DELETE_SELECTED_WEEKDAY';
const ADD_AVAILABILITY_EXCEPTION = 'ADD_AVAILABILITY_EXCEPTION';
const DELETE_AVAILABILITY_EXCEPTION = 'DELETE_AVAILABILITY_EXCEPTION';
const CHANGE_LIVE_IN = 'SET_LIVE_IN';
const SET_HOURS_PER_DAY = 'SET_HOURS_PER_DAY';
const SET_START_DATE = 'SET_START_DATE';
const SET_END_DATE = 'SET_END_DATE';

const init = initialState => {
  return {
    availableDays: initialState.availabilityPlan?.availableDays || [],
    availabilityExceptions: initialState.availabilityPlan?.availabilityExceptions || [],
    liveIn: initialState.availabilityPlan?.liveIn,
    hoursPerDay: initialState.availabilityPlan?.hoursPerDay || 8,
    startDate: initialState.savedStartDate,
    endDate: initialState.savedEndDate,
  };
};

const reducer = (state, action) => {
  switch (action.type) {
    case ADD_SELECTED_WEEKDAY:
      return {
        ...state,
        availableDays: [...state.availableDays, action.payload],
      };
    case DELETE_SELECTED_WEEKDAY:
      return {
        ...state,
        availableDays: state.availableDays.filter(day => day !== action.payload),
      };
    case CHANGE_LIVE_IN:
      return {
        ...state,
        liveIn: !state.liveIn,
      };
    case ADD_AVAILABILITY_EXCEPTION:
      return {
        ...state,
        availabilityExceptions: [...state.availabilityExceptions, action.payload],
      };
    case DELETE_AVAILABILITY_EXCEPTION:
      return {
        ...state,
        availabilityExceptions: state.availabilityExceptions.filter(
          exception => exception !== action.payload
        ),
      };
    case SET_HOURS_PER_DAY:
      return {
        ...state,
        hoursPerDay: action.payload,
      };
    case SET_START_DATE:
      const startDate = action.payload?.date?.getTime();
      return {
        ...state,
        startDate,
      };
    case SET_END_DATE:
      const endDate = action.payload?.date?.getTime();
      return {
        ...state,
        endDate,
      };
    default:
      return state;
  }
};

const Care24HourFormComponent = props => {
  const {
    availabilityPlan,
    userAvailabilityPlan,
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

  const timezone = zipcodeToTimezone.lookup(
    currentListing.attributes.publicData?.location?.zipcode
  );

  useEffect(() => {
    onChange({
      type: AVAILABILITY_PLAN_TYPE_24HOUR,
      timezone,
      ...state,
    });
  }, [state]);

  const liveInCheckboxLabel = intl.formatMessage({ id: 'Care24HourForm.liveInCheckboxLabel' });

  const submitInProgress = updateInProgress;
  const submitReady = (updated || ready) && availabilityPlan.type === AVAILABILITY_PLAN_TYPE_24HOUR;
  const submitDisabled =
    (state.availableDays === userAvailabilityPlan?.availableDays &&
      state.startDate === userAvailabilityPlan?.startDate &&
      state.endDate === userAvailabilityPlan?.endDate &&
      state.liveIn === userAvailabilityPlan?.liveIn &&
      state.availabilityExceptions === userAvailabilityPlan?.availabilityExceptions &&
      state.hoursPerDay === userAvailabilityPlan?.hoursPerDay) ||
    state.availableDays?.length === 0;

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
    if (state.availableDays.includes(day)) {
      dispatch({ type: DELETE_SELECTED_WEEKDAY, payload: day });
    } else {
      dispatch({ type: ADD_SELECTED_WEEKDAY, payload: day });
    }
  };

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit({
      ...state,
    });
  };

  const handleSaveAvailabilityException = exception => {
    dispatch({ type: ADD_AVAILABILITY_EXCEPTION, payload: exception });
  };

  const handleDeleteException = start => {
    dispatch({ type: DELETE_AVAILABILITY_EXCEPTION, payload: start });
  };

  const onStartDateChange = date => {
    dispatch({ type: SET_START_DATE, payload: date });
  };

  const onEndDateChange = date => {
    dispatch({ type: SET_END_DATE, payload: date });
  };

  const handleSetHoursPerDay = hoursPerDay => {
    dispatch({ type: SET_HOURS_PER_DAY, payload: hoursPerDay });
  };

  const handleSetLiveIn = () => {
    dispatch({ type: CHANGE_LIVE_IN });
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
                    state.availableDays.includes(button.day)
                      ? css.selectedButton
                      : css.weekdayButton
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
                    state.availableDays.includes(button.day)
                      ? css.selectedButton
                      : css.weekdayButton
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
        checked={state.liveIn}
        value={state.liveIn}
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
                startingCount={state.hoursPerDay}
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
          availabilityExceptions={state.availabilityExceptions}
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
