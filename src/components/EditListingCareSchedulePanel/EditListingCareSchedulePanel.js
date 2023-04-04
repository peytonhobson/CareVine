import React, { useReducer } from 'react';
import { arrayOf, bool, func, object, string } from 'prop-types';
import classNames from 'classnames';
import zipcodeToTimezone from 'zipcode-to-timezone';

import { FormattedMessage } from '../../util/reactIntl';
import { ensureOwnListing } from '../../util/data';
import { getDefaultTimeZoneOnBrowser } from '../../util/dates';
import { LISTING_STATE_DRAFT, propTypes } from '../../util/types';
import { ButtonGroup } from '..';
import { Care24HourForm } from '../../forms';
import CareScheduleRecurringTimesContainer from './containers/CareScheduleRecurringTimesContainer';
import CareScheduleSelectDatesContainer from './containers/CareScheduleSelectDatesContainer';

import css from './EditListingCareSchedulePanel.module.css';
import { useEffect } from 'react';

const AVAILABILITY_PLAN_TYPE_REPEAT = 'repeat';
const AVAILABILITY_PLAN_TYPE_24HOUR = '24hour';

const ONE_TIME = 'oneTime';
const REPEAT = 'repeat';
const TWENTY_FOUR_HOUR = '24hour';

const CHANGE_SCHEDULE_TYPE = 'changeScheduleType';
const SET_SHOW_ERRORS = 'setShowErrors';
const SET_SAVE_ONE_TIME_PLAN = 'setSaveOneTimePlan';
const SET_SAVE_REPEAT_PLAN = 'setSaveRepeatPlan';
const SET_SAVE_24_HOUR_PLAN = 'setSave24HourPlan';

const buttonGroupOptions = [
  { key: ONE_TIME, label: 'One Time Care' },
  { key: REPEAT, label: 'Repeat Care' },
  { key: TWENTY_FOUR_HOUR, label: '24-Hour Care' },
];

const defaultTimeZone = () =>
  typeof window !== 'undefined' ? getDefaultTimeZoneOnBrowser() : 'Etc/UTC';

const init = availabilityPlan => {
  return {
    selectedScheduleType: availabilityPlan?.type ?? ONE_TIME,
    showErrors: false,
    savedOneTimePlan: null,
    savedRepeatPlan: null,
    saved24HourPlan: null,
  };
};

const reducer = (state, action) => {
  switch (action.type) {
    case CHANGE_SCHEDULE_TYPE:
      return { ...state, selectedScheduleType: action.payload };
    case SET_SHOW_ERRORS:
      return { ...state, showErrors: action.payload };
    case SET_SAVE_ONE_TIME_PLAN:
      return { ...state, savedOneTimePlan: action.payload };
    case SET_SAVE_REPEAT_PLAN:
      return { ...state, savedRepeatPlan: action.payload };
    case SET_SAVE_24_HOUR_PLAN:
      return { ...state, saved24HourPlan: action.payload };
    default:
      throw new Error();
  }
};

const EditListingCareSchedulePanel = props => {
  const {
    className,
    disabled,
    errors,
    listing,
    onManageDisableScrolling,
    onNextTab,
    onSubmit,
    panelUpdated,
    ready,
    rootClassName,
    submitButtonText,
    updateInProgress,
  } = props;

  const classes = classNames(className, rootClassName || css.root);
  const currentListing = ensureOwnListing(listing);
  const isPublished = currentListing.id && currentListing.attributes.state !== LISTING_STATE_DRAFT;
  const availabilityPlanMaybe = currentListing.attributes.publicData?.availabilityPlan;

  const [state, dispatch] = useReducer(reducer, availabilityPlanMaybe, init);

  useEffect(() => {
    dispatch({ type: SET_SHOW_ERRORS, payload: errors.updateListingError });
  }, [errors.updateListingError]);

  const handle24HourCareSubmit = values => {
    const currentZipcode = currentListing.attributes.publicData?.location?.zipcode;
    const timezone = zipcodeToTimezone.lookup(currentZipcode);

    const availabilityPlan = {
      type: AVAILABILITY_PLAN_TYPE_24HOUR,
      timezone,
      ...values,
    };

    return onSubmit({ publicData: { scheduleType: TWENTY_FOUR_HOUR, availabilityPlan } })
      .then(() => {
        if (!isPublished) {
          onNextTab();
        }
      })
      .catch(e => {});
  };

  const handleSelectDatesSubmit = availabilityPlan => {
    return onSubmit({ publicData: { scheduleType: ONE_TIME, availabilityPlan } })
      .then(() => {
        if (!isPublished) {
          onNextTab();
        }
      })
      .catch(e => {});
  };

  const handleScheduleTypeChange = type => {
    dispatch({ type: CHANGE_SCHEDULE_TYPE, payload: type });
    dispatch({ type: SET_SHOW_ERRORS, payload: false });
  };

  let mainContent = null;
  let availabilityPlan = null;
  let defaultAvailabilityPlan = null;

  switch (state.selectedScheduleType) {
    case ONE_TIME:
      availabilityPlan = state.savedOneTimePlan ?? availabilityPlanMaybe;
      mainContent = (
        <CareScheduleSelectDatesContainer
          availabilityPlan={availabilityPlan}
          userAvailabilityPlan={availabilityPlanMaybe}
          disabled={disabled}
          errors={errors}
          listing={currentListing}
          onManageDisableScrolling={onManageDisableScrolling}
          onSubmit={handleSelectDatesSubmit}
          ready={ready}
          submitButtonText={submitButtonText}
          updated={panelUpdated}
          updateInProgress={updateInProgress}
          showErrors={state.showErrors}
          onChange={oneTimePlan => dispatch({ type: SET_SAVE_ONE_TIME_PLAN, payload: oneTimePlan })}
        />
      );
      break;
    case REPEAT:
      defaultAvailabilityPlan = {
        type: AVAILABILITY_PLAN_TYPE_REPEAT,
        timezone: defaultTimeZone(),
        entries: [],
      };
      availabilityPlan = state.savedRepeatPlan
        ? state.savedRepeatPlan
        : availabilityPlanMaybe?.type === AVAILABILITY_PLAN_TYPE_REPEAT
        ? availabilityPlanMaybe
        : defaultAvailabilityPlan;
      mainContent = (
        <CareScheduleRecurringTimesContainer
          availabilityPlan={availabilityPlan}
          userAvailabilityPlan={availabilityPlanMaybe}
          currentListing={currentListing}
          disabled={disabled}
          errors={errors}
          isPublished={isPublished}
          onManageDisableScrolling={onManageDisableScrolling}
          onNextTab={onNextTab}
          onSubmit={onSubmit}
          ready={ready}
          submitButtonText={submitButtonText}
          updateInProgress={updateInProgress}
          showErrors={state.showErrors}
          panelUpdated={panelUpdated}
          onChange={repeatPlan => dispatch({ type: SET_SAVE_REPEAT_PLAN, payload: repeatPlan })}
        />
      );
      break;
    case TWENTY_FOUR_HOUR:
      defaultAvailabilityPlan = {
        type: AVAILABILITY_PLAN_TYPE_24HOUR,
        availableDays: [],
        liveIn: false,
        timezone: defaultTimeZone(),
      };
      availabilityPlan = state.saved24HourPlan
        ? state.saved24HourPlan
        : availabilityPlanMaybe?.type === AVAILABILITY_PLAN_TYPE_24HOUR
        ? availabilityPlanMaybe
        : defaultAvailabilityPlan;
      mainContent = (
        <Care24HourForm
          availabilityPlan={availabilityPlan}
          currentListing={currentListing}
          disabled={disabled}
          fetchErrors={errors}
          onManageDisableScrolling={onManageDisableScrolling}
          onSubmit={handle24HourCareSubmit}
          ready={ready}
          showErrors={state.showErrors}
          submitButtonText={submitButtonText}
          updated={panelUpdated}
          updateInProgress={updateInProgress}
          onChange={plan => dispatch({ type: SET_SAVE_24_HOUR_PLAN, payload: plan })}
        ></Care24HourForm>
      );
      break;
    default:
      mainContent = <></>;
      break;
  }

  return (
    <main className={classes}>
      <h1 className={css.title}>
        {isPublished ? (
          <FormattedMessage
            id="EditListingCareSchedulePanel.title"
            values={{
              careSchedule: (
                <span className={css.careScheduleText}>
                  <FormattedMessage id="EditListingCareSchedulePanel.careSchedule" />
                </span>
              ),
            }}
          />
        ) : (
          <FormattedMessage
            id="EditListingCareSchedulePanel.createListingTitle"
            values={{
              careSchedule: (
                <span className={css.careScheduleText}>
                  <FormattedMessage id="EditListingCareSchedulePanel.careSchedule" />
                </span>
              ),
            }}
          />
        )}
      </h1>
      {errors.showListingsError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingCareSchedulePanel.showListingFailed" />
        </p>
      ) : null}
      <ButtonGroup
        className={css.buttonGroup}
        initialSelect={availabilityPlanMaybe?.type || ONE_TIME}
        onChange={handleScheduleTypeChange}
        options={buttonGroupOptions}
        rootClassName={css.buttonGroupRoot}
        selectedClassName={css.buttonGroupSelected}
      />

      {mainContent}
    </main>
  );
};

EditListingCareSchedulePanel.defaultProps = {
  className: null,
  rootClassName: null,
  listing: null,
  availabilityExceptions: [],
};

EditListingCareSchedulePanel.propTypes = {
  className: string,
  rootClassName: string,

  // We cannot use propTypes.listing since the listing might be a draft.
  listing: object,
  disabled: bool.isRequired,
  ready: bool.isRequired,
  availabilityExceptions: arrayOf(propTypes.availabilityException),
  fetchExceptionsInProgress: bool.isRequired,
  onAddAvailabilityException: func.isRequired,
  onDeleteAvailabilityException: func.isRequired,
  onSubmit: func.isRequired,
  onManageDisableScrolling: func.isRequired,
  onNextTab: func.isRequired,
  submitButtonText: string.isRequired,
  updateInProgress: bool.isRequired,
  errors: object.isRequired,
};

export default EditListingCareSchedulePanel;
