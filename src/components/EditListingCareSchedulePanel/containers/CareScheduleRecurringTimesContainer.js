import React, { useReducer, useEffect } from 'react';

import zipcodeToTimezone from 'zipcode-to-timezone';
import { compose } from 'redux';

import { FormattedMessage, injectIntl } from '../../../util/reactIntl';
import {
  InlineTextButton,
  IconEdit,
  Modal,
  CareScheduleExceptions,
  Button,
  WeekPanel,
} from '../..';
import Weekday from '../Weekday';
import { createCareSchedule, createInitialValues } from '../EditListingCareSchedule.helpers';
import { EditListingAvailabilityPlanForm, TimelineForm } from '../../../forms';
import { timestampToDate } from '../../../util/dates';
import { WEEKDAYS } from '../../../util/constants';

import css from './containers.module.css';

const REPEAT = 'repeat';

const SET_IS_EDIT_PLAN_MODAL_OPEN = 'SET_IS_EDIT_PLAN_MODAL_OPEN';
const SET_AVAILABILITY_PLAN = 'SET_AVAILABILITY_PLAN';
const ADD_AVAILABILITY_EXCEPTION = 'SET_AVAILABILITY_EXCEPTION';
const DELETE_AVAILABILITY_EXCEPTION = 'DELETE_AVAILABILITY_EXCEPTION';
const SET_START_DATE = 'SET_START_DATE';
const SET_END_DATE = 'SET_END_DATE';

const init = initialState => {
  return {
    ...initialState,
    careSchedule: initialState.savedCareSchedule,
    startDate: initialState.savedStartDate,
    endDate: initialState.savedEndDate,
    availabilityExceptions: initialState.savedCareSchedule?.availabilityExceptions || [],
  };
};

const reducer = (state, action) => {
  switch (action.type) {
    case SET_IS_EDIT_PLAN_MODAL_OPEN:
      return { ...state, isEditPlanModalOpen: action.payload };
    case SET_AVAILABILITY_PLAN:
      return { ...state, careSchedule: action.payload };
    case ADD_AVAILABILITY_EXCEPTION:
      return {
        ...state,
        availabilityExceptions: [...state.availabilityExceptions, action.payload],
      };
    case DELETE_AVAILABILITY_EXCEPTION:
      return {
        ...state,
        availabilityExceptions: state.availabilityExceptions.filter(
          e => e.attributes.start !== action.payload
        ),
      };
    case SET_START_DATE:
      const startDate = action.payload?.date?.getTime();
      return { ...state, startDate };
    case SET_END_DATE:
      const endDate = action.payload?.date?.getTime();
      return { ...state, endDate };
    default:
      return state;
  }
};

const CareScheduleRecurringTimesContainerComponent = props => {
  const {
    careSchedule: savedCareSchedule,
    userCareSchedule,
    currentListing,
    disabled,
    errors,
    isPublished,
    onManageDisableScrolling,
    onNextTab,
    onSubmit,
    ready,
    submitButtonText,
    updateInProgress,
    showErrors,
    panelUpdated,
    intl,
    isBooking,
    onChange,
  } = props;

  const savedStartDate = savedCareSchedule?.startDate;
  const savedEndDate = savedCareSchedule?.endDate;

  const initialState = {
    savedStartDate,
    savedEndDate,
    savedCareSchedule,
    isEditPlanModalOpen: false,
  };

  const [state, dispatch] = useReducer(reducer, initialState, init);

  useEffect(() => {
    onChange({
      ...state.careSchedule,
      availabilityExceptions: state.availabilityExceptions,
      startDate: state.startDate,
      endDate: state.endDate,
    });
  }, [state]);

  const handleCareScheduleSubmit = values => {
    const newCareSchedule = createCareSchedule(values, currentListing);

    dispatch({ type: SET_AVAILABILITY_PLAN, payload: newCareSchedule });
    dispatch({ type: SET_IS_EDIT_PLAN_MODAL_OPEN, payload: false });
  };

  const handleSubmit = () => {
    // Final Form can wait for Promises to return.

    if (isBooking) {
      return onSubmit({
        ...state.careSchedule,
        availabilityExceptions: state.availabilityExceptions,
        startDate: state.startDate,
        endDate: state.endDate,
      });
    }

    return onSubmit({
      publicData: {
        scheduleType: REPEAT,
        careSchedule: {
          ...state.careSchedule,
          availabilityExceptions: state.availabilityExceptions,
          startDate: state.startDate,
          endDate: state.endDate,
        },
      },
    })
      .then(() => {
        if (!isPublished) {
          onNextTab();
        }
      })
      .catch(e => {
        // Don't close modal if there was an error
      });
  };

  const initialValues = createInitialValues(state.careSchedule);

  const submitDisabled =
    (state.startDate === userCareSchedule?.startDate &&
      state.endDate === userCareSchedule?.startDate &&
      state.availabilityExceptions === userCareSchedule?.availabilityExceptions) ||
    state.careSchedule?.entries?.length === 0;
  const submitInProgress = updateInProgress;
  const submitReady = ready || panelUpdated;

  const timezone = zipcodeToTimezone.lookup(currentListing.attributes.publicData.location.zipcode);

  const timelineInitialValues = {
    startDate: {
      date: savedStartDate ? timestampToDate(savedStartDate) : null,
    },
    endDate: {
      date: savedEndDate ? timestampToDate(savedEndDate) : null,
    },
  };

  const onStartDateChange = date => {
    dispatch({ type: SET_START_DATE, payload: date });
  };

  const onEndDateChange = date => {
    dispatch({ type: SET_END_DATE, payload: date });
  };

  return (
    <>
      <div className={css.timelineFormContainer}>
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
      </div>
      <section className={css.section}>
        <EditListingAvailabilityPlanForm
          formId="EditListingCareScheduleForm"
          listingTitle={currentListing.attributes.title}
          availabilityPlan={state.careSchedule}
          weekdays={WEEKDAYS}
          onChange={handleCareScheduleSubmit}
          initialValues={initialValues}
          inProgress={updateInProgress}
          fetchErrors={errors}
          showErrors={showErrors}
          initialValuesEqual={() => true}
          hideLiveIn
          className={css.recurringPlanForm}
          hideSubmit
        />
      </section>
      <Button
        className={css.goToNextTabButton}
        onClick={handleSubmit}
        disabled={submitDisabled}
        inProgress={submitInProgress}
        ready={submitReady}
      >
        {submitButtonText}
      </Button>
    </>
  );
};

const CareScheduleRecurringTimesContainer = compose(injectIntl)(
  CareScheduleRecurringTimesContainerComponent
);

export default CareScheduleRecurringTimesContainer;
