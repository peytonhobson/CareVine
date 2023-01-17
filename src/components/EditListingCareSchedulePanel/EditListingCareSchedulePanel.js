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

const AVAILABILITY_PLAN_TYPE_RECURRING = 'availability-plan/recurring';
const AVAILABILITY_PLAN_TYPE_24HOUR = 'availability-plan/24hour';

const SELECT_DATES = 'selectDates';
const RECURRING = 'recurring';
const TWENTY_FOUR_HOUR = '24hour';

const buttonGroupOptions = [
  { key: SELECT_DATES, label: 'Select Dates' },
  { key: RECURRING, label: 'Recurring' },
  { key: TWENTY_FOUR_HOUR, label: '24 Hour Care' },
];

const defaultTimeZone = () =>
  typeof window !== 'undefined' ? getDefaultTimeZoneOnBrowser() : 'Etc/UTC';

const EditListingCareSchedulePanel = props => {
  const {
    availabilityExceptions,
    className,
    disabled,
    errors,
    fetchExceptionsInProgress,
    listing,
    onAddAvailabilityException,
    onDeleteAvailabilityException,
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
    const { liveIn, availableDays } = values;

    const currentZipcode = currentListing.attributes.publicData.location.zipcode;
    const timezone = zipcodeToTimezone.lookup(currentZipcode);

    const availabilityPlan = {
      type: AVAILABILITY_PLAN_TYPE_24HOUR,
      liveIn,
      availableDays,
      timezone,
    };

    return onSubmit({ publicData: { availabilityPlan } })
      .then(() => {
        if (!isPublished) {
          onNextTab();
        }
      })
      .catch(e => {});
  };

  const handleSelectDatesSubmit = availabilityPlan => {
    availabilityExceptions.forEach(exception => {
      onDeleteAvailabilityException({ id: exception.id });
    });

    return onSubmit({ publicData: { availabilityPlan } })
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
    case SELECT_DATES:
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
    case RECURRING:
      defaultAvailabilityPlan = {
        type: AVAILABILITY_PLAN_TYPE_RECURRING,
        timezone: defaultTimeZone(),
        entries: [],
      };
      availabilityPlan =
        currentListing.attributes.publicData.availabilityPlan &&
        currentListing.attributes.publicData.availabilityPlan.type ===
          AVAILABILITY_PLAN_TYPE_RECURRING
          ? currentListing.attributes.publicData.availabilityPlan
          : defaultAvailabilityPlan;
      mainContent = (
        <CareScheduleRecurringTimesContainer
          availabilityExceptions={availabilityExceptions}
          availabilityPlan={availabilityPlan}
          currentListing={currentListing}
          disabled={disabled}
          errors={errors}
          fetchExceptionsInProgress={fetchExceptionsInProgress}
          isPublished={isPublished}
          onAddAvailabilityException={onAddAvailabilityException}
          onDeleteAvailabilityException={onDeleteAvailabilityException}
          onManageDisableScrolling={onManageDisableScrolling}
          onNextTab={onNextTab}
          onSubmit={onSubmit}
          ready={ready}
          submitButtonText={submitButtonText}
          updateInProgress={updateInProgress}
          showErrors={showErrors}
          useDefaultPlan={availabilityPlan === defaultAvailabilityPlan}
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
          availabilityExceptions={availabilityExceptions}
          availabilityPlan={availabilityPlan}
          currentListing={currentListing}
          disabled={disabled}
          fetchErrors={errors}
          fetchExceptionsInProgress={fetchExceptionsInProgress}
          onAddAvailabilityException={onAddAvailabilityException}
          onDeleteAvailabilityException={onDeleteAvailabilityException}
          onManageDisableScrolling={onManageDisableScrolling}
          onSubmit={handle24HourCareSubmit}
          ready={ready}
          showErrors={showErrors}
          submitButtonText={submitButtonText}
          updated={panelUpdated}
          updateInProgress={updateInProgress}
          useDefaultPlan={currentListing === defaultAvailabilityPlan}
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
        initialSelect="selectDates"
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
