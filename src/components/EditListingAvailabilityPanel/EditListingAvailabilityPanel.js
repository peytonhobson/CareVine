import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';
import { ensureOwnListing, convertTimeFrom12to24, convertTimeFrom24to12 } from '../../util/data';
import { getDefaultTimeZoneOnBrowser, timestampToDate } from '../../util/dates';
import { LISTING_STATE_DRAFT } from '../../util/types';
import { EditListingAvailabilityPlanForm } from '../../forms';
import zipcodeToTimezone from 'zipcode-to-timezone';

import css from './EditListingAvailabilityPanel.module.css';

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const defaultTimeZone = () =>
  typeof window !== 'undefined' ? getDefaultTimeZoneOnBrowser() : 'America/New_York';

const createOpenAvailabilityPlan = currentListing => {
  const timezone =
    zipcodeToTimezone.lookup(currentListing.attributes.publicData.location?.zipcode) ||
    defaultTimeZone();
  const entries = WEEKDAYS.map(dayOfWeek => ({
    dayOfWeek,
    startTime: '00:00',
    endTime: '00:00',
    seats: 1,
  }));

  return {
    type: 'availability-plan/time',
    timezone,
    entries,
  };
};

const createEntryDayGroups = (entries = {}) =>
  entries.reduce((groupedEntries, entry) => {
    const { startTime, endTime: endHour, dayOfWeek } = entry;
    const dayGroup = groupedEntries[dayOfWeek] || [];
    return {
      ...groupedEntries,
      [dayOfWeek]: [
        ...dayGroup,
        {
          startTime: convertTimeFrom24to12(startTime),
          endTime: convertTimeFrom24to12(endHour),
        },
      ],
    };
  }, {});

const createInitialValues = (availabilityPlan, scheduleTypes) => {
  const { timezone, entries } = availabilityPlan || {};
  const tz = timezone || defaultTimeZone();
  return {
    timezone: tz,
    ...createEntryDayGroups(entries),
    scheduleTypes,
  };
};

const createEntriesFromSubmitValues = values =>
  WEEKDAYS.reduce((allEntries, dayOfWeek) => {
    const dayValues = values[dayOfWeek] || [];
    const dayEntries = dayValues.map(dayValue => {
      const { startTime, endTime } = dayValue;
      // Note: This template doesn't support seats yet.
      return startTime && endTime
        ? {
            dayOfWeek,
            seats: 1,
            startTime: convertTimeFrom12to24(startTime),
            endTime: convertTimeFrom12to24(endTime),
          }
        : null;
    });

    return allEntries.concat(dayEntries.filter(e => !!e));
  }, []);

export const createAvailabilityPlan = (values, currentListing) => {
  const timezone =
    zipcodeToTimezone.lookup(currentListing.attributes.publicData.location?.zipcode) ||
    defaultTimeZone();

  return {
    type: 'availability-plan/time',
    timezone,
    entries: createEntriesFromSubmitValues(values),
  };
};

//////////////////////////////////
// EditListingAvailabilityPanel //
//////////////////////////////////
const EditListingAvailabilityPanel = props => {
  const {
    className,
    rootClassName,
    listing,
    onSubmit,
    onNextTab,
    updateInProgress,
    errors,
    panelUpdated,
  } = props;

  const currentListing = ensureOwnListing(listing);
  const defaultAvailabilityPlan = {
    type: 'repeat',
    timezone: defaultTimeZone(),
    entries: [],
  };
  const publicData = currentListing.attributes.publicData;
  const availabilityPlan = publicData?.availabilityPlan || defaultAvailabilityPlan;
  const scheduleTypes = publicData?.scheduleTypes || [];

  const [showNoEntriesError, setShowNoEntriesError] = useState(false);

  const classes = classNames(rootClassName || css.root, className);
  const isPublished = currentListing.id && currentListing.attributes.state !== LISTING_STATE_DRAFT;

  const initialValues = createInitialValues(availabilityPlan, scheduleTypes);

  const handleSubmit = values => {
    const submittedAvailabilityPlan = createAvailabilityPlan(values, currentListing);
    const { scheduleTypes } = values;

    if (submittedAvailabilityPlan.entries.length === 0) {
      setShowNoEntriesError(true);
      return;
    }

    // Final Form can wait for Promises to return.
    return onSubmit({
      availabilityPlan: createOpenAvailabilityPlan(currentListing),
      publicData: {
        availabilityPlan: submittedAvailabilityPlan,
        scheduleTypes,
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

  return (
    <main className={classes}>
      <h1 className={css.title}>
        {isPublished ? (
          <FormattedMessage
            id="EditListingAvailabilityPanel.title"
            values={{
              availability: (
                <span className={css.availabilityText}>
                  <FormattedMessage id="EditListingAvailabilityPanel.availability" />
                </span>
              ),
            }}
          />
        ) : (
          <FormattedMessage
            id="EditListingAvailabilityPanel.createListingTitle"
            values={{
              availability: (
                <span className={css.availabilityText}>
                  <FormattedMessage id="EditListingAvailabilityPanel.availability" />
                </span>
              ),
            }}
          />
        )}
      </h1>

      <section className={css.section}>
        <EditListingAvailabilityPlanForm
          formId="EditListingAvailabilityPlanForm"
          listingTitle={currentListing.attributes.title}
          weekdays={WEEKDAYS}
          onSubmit={handleSubmit}
          initialValues={initialValues}
          inProgress={updateInProgress}
          fetchErrors={errors}
          currentListing={currentListing}
          initialValuesEqual={() => true}
          updated={panelUpdated}
        />
      </section>

      {errors.showListingsError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingAvailabilityPanel.showListingFailed" />
        </p>
      ) : null}
      {errors.updateListingError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingAvailabilityPanel.updateListingFailed" />
        </p>
      ) : null}
      {showNoEntriesError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingAvailabilityPanel.noEntriesError" />
        </p>
      ) : null}
    </main>
  );
};

export default EditListingAvailabilityPanel;
