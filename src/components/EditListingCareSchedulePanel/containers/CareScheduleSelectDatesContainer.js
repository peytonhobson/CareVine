import React, { useState, useEffect } from 'react';

import { FormattedMessage } from 'react-intl';
import zipcodeToTimezone from 'zipcode-to-timezone';

import { DATE_TYPE_DATETIME } from '../../../util/types';
import { timestampToDate } from '../../../util/dates';
import { InlineTextButton, Button, Modal, IconClose, TimeRange } from '../..';
import { CareScheduleSelectDatesForm } from '../../../forms';

import css from './containers.module.css';

const AVAILABILITY_PLAN_TYPE_SELECT_DATES = 'availability-plan/selectDates';

// Ensure that the AvailabilityExceptions are in sensible order.
//
// Note: if you allow fetching more than 100 exception,
// pagination kicks in and that makes client-side sorting impossible.
const sortSessionsByStartTime = (a, b) => {
  return a.start - b.start;
};

const CareScheduleSelectDatesContainer = props => {
  const {
    availabilityPlan,
    disabled,
    errors,
    listing,
    onManageDisableScrolling,
    onNextTab,
    onSubmit,
    ready,
    submitButtonText,
    updated,
    updateInProgress,
    showErrors,
  } = props;

  // Hooks
  const [isAddCareSessionModalOpen, setIsAddCareSessionModalOpen] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState([]);

  useEffect(() => {
    setSelectedSessions(
      availabilityPlan && availabilityPlan.type === AVAILABILITY_PLAN_TYPE_SELECT_DATES
        ? availabilityPlan.selectedSessions
        : []
    );
  }, []);

  const timeZone = zipcodeToTimezone.lookup(
    listing && listing.attributes.publicData.location.zipcode
  );
  const sortedSessions = selectedSessions.sort(sortSessionsByStartTime);

  const saveSession = values => {
    const { sessionStartTime, sessionEndTime } = values;

    setSelectedSessions(prevSelectedSessions => [
      ...prevSelectedSessions,
      { start: sessionStartTime, end: sessionEndTime },
    ]);

    setIsAddCareSessionModalOpen(false);
  };

  const onDeleteCareSession = session => {
    setSelectedSessions(prevSelectedSessions => prevSelectedSessions.filter(s => s !== session));
  };

  const handleSubmit = () => {
    const availabilityPlan = {
      type: AVAILABILITY_PLAN_TYPE_SELECT_DATES,
      selectedSessions,
      timezone: timeZone,
    };

    onSubmit(availabilityPlan);
  };

  const submitInProgress = updateInProgress;
  const submitDisabled = disabled || selectedSessions.length === 0;
  const submitReady =
    (updated || ready) && availabilityPlan.type === AVAILABILITY_PLAN_TYPE_SELECT_DATES;

  return (
    <div className={css.root}>
      <div className={css.exceptionsContainer}>
        {selectedSessions.length === 0 ? (
          <div className={css.noExceptions}>
            <FormattedMessage id="CareScheduleSelectDatesContainer.noCareSessions" />
          </div>
        ) : (
          <div className={css.exceptions}>
            {selectedSessions.map(session => {
              const { start, end } = session;
              return (
                <div key={start} className={css.exception}>
                  <div className={css.exceptionHeader}>
                    <button
                      className={css.removeExceptionButton}
                      onClick={() => onDeleteCareSession(session)}
                    >
                      <IconClose size="normal" className={css.removeIcon} />
                    </button>
                  </div>
                  <TimeRange
                    className={css.timeRange}
                    startDate={timestampToDate(start)}
                    endDate={timestampToDate(end)}
                    dateType={DATE_TYPE_DATETIME}
                    timeZone={timeZone}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
      <InlineTextButton
        className={css.addExceptionButton}
        onClick={() => setIsAddCareSessionModalOpen(true)}
        disabled={disabled}
        ready={ready}
      >
        <FormattedMessage id="CareScheduleSelectDatesContainer.addCareSession" />
      </InlineTextButton>
      {errors.updateListingError && showErrors ? (
        <p className={css.error}>
          <FormattedMessage id="CareScheduleSelectDatesContainer.updateFailed" />
        </p>
      ) : null}
      <Button
        className={css.goToNextTabButton}
        onClick={handleSubmit}
        inProgress={submitInProgress}
        disabled={submitDisabled}
        ready={submitReady}
      >
        {submitButtonText}
      </Button>
      {onManageDisableScrolling ? (
        <Modal
          id="AddCareSessionModal"
          isOpen={isAddCareSessionModalOpen}
          onClose={() => setIsAddCareSessionModalOpen(false)}
          onManageDisableScrolling={onManageDisableScrolling}
          containerClassName={css.modalContainer}
          usePortal
        >
          {isAddCareSessionModalOpen && (
            <CareScheduleSelectDatesForm
              formId="EditListingAvailabilityExceptionForm"
              onSubmit={saveSession}
              selectedSessions={sortedSessions}
              updateInProgress={updateInProgress}
              fetchErrors={errors}
              timeZone={timeZone}
            />
          )}
        </Modal>
      ) : null}
    </div>
  );
};

export default CareScheduleSelectDatesContainer;
