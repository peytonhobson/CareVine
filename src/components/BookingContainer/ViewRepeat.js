import React, { useState } from 'react';

import { FormattedMessage } from 'react-intl';
import { Modal, ViewCalendar, InlineTextButton, WeekPanel } from '..';
import { EditListingAvailabilityPlanForm } from '../../forms';
import CareScheduleRecurringTimesContainer from '../EditListingCareSchedulePanel/containers/CareScheduleRecurringTimesContainer';
import { timestampToDate } from '../../util/dates';
import { getDefaultTimeZoneOnBrowser } from '../../util/dates';
import { AVAILABILITY_PLAN_REPEAT } from '../../util/constants';

import css from './BookingContainer.module.css';

const CALENDAR_VIEW = 'calendar';
const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const defaultTimeZone = () =>
  typeof window !== 'undefined' ? getDefaultTimeZoneOnBrowser() : 'Etc/UTC';

const ViewRepeat = props => {
  const {
    availabilityPlan,
    currentUserListing,
    onManageDisableScrolling,
    onChange,
    onChangeViewType,
    viewType,
  } = props;

  const [isEditMode, setIsEditMode] = useState(false);

  const entries = availabilityPlan?.entries;
  const endDate = availabilityPlan?.endDate;
  const startDate = availabilityPlan?.startDate;
  const availabilityExceptions = availabilityPlan?.availabilityExceptions;

  const defaultAvailabilityPlan = {
    type: AVAILABILITY_PLAN_REPEAT,
    timezone: defaultTimeZone(),
    entries: [],
  };
  const formAvailabilityPlan =
    availabilityPlan?.type === AVAILABILITY_PLAN_REPEAT
      ? availabilityPlan
      : defaultAvailabilityPlan;

  const handleSubmit = values => {
    setIsEditMode(false);
    onChange(values);
  };

  return !isEditMode ? (
    <>
      <div className={css.inlineContainer}>
        <InlineTextButton className={css.editButton} onClick={onChangeViewType} type="button">
          {viewType === CALENDAR_VIEW ? 'List View' : 'Calendar View'}
        </InlineTextButton>
        <InlineTextButton
          className={css.editButton}
          onClick={() => setIsEditMode(true)}
          type="button"
        >
          <FormattedMessage id="BookingContainer.edit" />
        </InlineTextButton>
      </div>
      {viewType === CALENDAR_VIEW ? (
        <ViewCalendar
          entries={entries}
          startDate={startDate}
          endDate={endDate}
          availabilityExceptions={availabilityExceptions}
          planType={AVAILABILITY_PLAN_REPEAT}
          onClick={() => setIsEditMode(true)}
        />
      ) : (
        <>
          <div className={css.weeklySchedule}>Weekly Schedule</div>
          <WeekPanel
            availabilityPlan={availabilityPlan}
            openEditModal={() => setIsEditMode(true)}
          />
          <div className={css.datesContainer}>
            <span className={css.dateContainer}>
              <p>
                <span className={css.bold}>Start Date: </span>
                <span className={css.item}>
                  {availabilityPlan?.startDate
                    ? timestampToDate(availabilityPlan.startDate).toLocaleDateString()
                    : 'NA'}
                </span>
              </p>
            </span>
            <span className={css.dateContainer}>
              <p>
                <span className={css.bold}>End Date: </span>
                <span className={css.item}>
                  {availabilityPlan?.endDate
                    ? timestampToDate(availabilityPlan.endDate).toLocaleDateString()
                    : 'NA'}
                </span>
              </p>
            </span>
          </div>
        </>
      )}
    </>
  ) : (
    <Modal
      id="EditAvailabilityPlanRepeatModal"
      isOpen={isEditMode}
      onClose={() => setIsEditMode(false)}
      onManageDisableScrolling={onManageDisableScrolling}
      containerClassName={css.repeatEditModalContainer}
      usePortal
    >
      <CareScheduleRecurringTimesContainer
        availabilityPlan={formAvailabilityPlan}
        currentListing={currentUserListing}
        errors={{}}
        isPublished
        onManageDisableScrolling={onManageDisableScrolling}
        onSubmit={handleSubmit}
        submitButtonText="Save Schedule"
        isBooking
      />
    </Modal>
  );
};

export default ViewRepeat;
