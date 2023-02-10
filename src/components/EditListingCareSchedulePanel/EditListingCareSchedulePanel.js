import React, { useState } from 'react';
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

const AVAILABILITY_PLAN_TYPE_REPEAT = 'availability-plan/repeat';
const AVAILABILITY_PLAN_TYPE_24HOUR = 'availability-plan/24hour';

const ONE_TIME = 'oneTime';
const REPEAT = 'repeat';
const TWENTY_FOUR_HOUR = '24hour';

const buttonGroupOptions = [
  { key: ONE_TIME, label: 'One Time Care' },
  { key: REPEAT, label: 'Repeat Care' },
  { key: TWENTY_FOUR_HOUR, label: '24-Hour Care' },
];

const defaultTimeZone = () =>
  typeof window !== 'undefined' ? getDefaultTimeZoneOnBrowser() : 'Etc/UTC';

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

  const [selectedScheduleType, setSelectedScheduleType] = useState(null);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    setShowErrors(true);
  }, [errors.updateListingError]);

  const classes = classNames(className, rootClassName || css.root);
  const currentListing = ensureOwnListing(listing);
  const isPublished = currentListing.id && currentListing.attributes.state !== LISTING_STATE_DRAFT;

  const handle24HourCareSubmit = values => {
    const { liveIn, availableDays, availabilityExceptions, startDate, endDate } = values;

    const currentZipcode = currentListing.attributes.publicData.location.zipcode;
    const timezone = zipcodeToTimezone.lookup(currentZipcode);

    const availabilityPlan = {
      type: AVAILABILITY_PLAN_TYPE_24HOUR,
      liveIn,
      availableDays,
      timezone,
      availabilityExceptions,
      startDate,
      endDate,
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
    setSelectedScheduleType(type);
    setShowErrors(false);
  };

  let mainContent = null;
  let availabilityPlan = null;
  let defaultAvailabilityPlan = null;

  switch (selectedScheduleType) {
    case ONE_TIME:
      availabilityPlan = currentListing.attributes.publicData.availabilityPlan;
      mainContent = (
        <CareScheduleSelectDatesContainer
          availabilityPlan={availabilityPlan}
          disabled={disabled}
          errors={errors}
          listing={currentListing}
          onManageDisableScrolling={onManageDisableScrolling}
          onSubmit={handleSelectDatesSubmit}
          ready={ready}
          submitButtonText={submitButtonText}
          updated={panelUpdated}
          updateInProgress={updateInProgress}
          showErrors={showErrors}
        />
      );
      break;
    case REPEAT:
      defaultAvailabilityPlan = {
        type: AVAILABILITY_PLAN_TYPE_REPEAT,
        timezone: defaultTimeZone(),
        entries: [],
      };
      availabilityPlan =
        currentListing.attributes.publicData.availabilityPlan &&
        currentListing.attributes.publicData.availabilityPlan.type === AVAILABILITY_PLAN_TYPE_REPEAT
          ? currentListing.attributes.publicData.availabilityPlan
          : defaultAvailabilityPlan;
      mainContent = (
        <CareScheduleRecurringTimesContainer
          availabilityPlan={availabilityPlan}
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
          showErrors={showErrors}
          panelUpdated={panelUpdated}
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
      availabilityPlan =
        currentListing.attributes.publicData.availabilityPlan &&
        currentListing.attributes.publicData.availabilityPlan.type === AVAILABILITY_PLAN_TYPE_24HOUR
          ? currentListing.attributes.publicData.availabilityPlan
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
          showErrors={showErrors}
          submitButtonText={submitButtonText}
          updated={panelUpdated}
          updateInProgress={updateInProgress}
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
        initialSelect={ONE_TIME}
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
