import React, { useState } from 'react';

import { FormattedMessage } from 'react-intl';
import { Button, Modal, ViewCalendar, InlineTextButton, TimeRange } from '..';
import CareScheduleSelectDatesContainer from '../EditListingCareSchedulePanel/containers/CareScheduleSelectDatesContainer';
import { getDefaultTimeZoneOnBrowser } from '../../util/dates';
import { AVAILABILITY_PLAN_ONE_TIME } from '../../util/constants';
import { timestampToDate } from '../../util/dates';
import { DATE_TYPE_DATETIME } from '../../util/types';
import zipcodeToTimezone from 'zipcode-to-timezone';

import css from './BookingContainer.module.css';

const CALENDAR_VIEW = 'calendar';

const defaultTimeZone = () =>
  typeof window !== 'undefined' ? getDefaultTimeZoneOnBrowser() : 'Etc/UTC';

const ViewOneTime = props => {
  const {
    careSchedule,
    currentUserListing,
    onManageDisableScrolling,
    onChange,
    onChangeViewType,
    viewType,
  } = props;

  const [isEditMode, setIsEditMode] = useState(false);

  const selectedSessions = careSchedule?.selectedSessions;

  const timeZone = zipcodeToTimezone.lookup(
    currentUserListing?.attributes?.publicData?.location?.zipcode
  );

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
          selectedSessions={selectedSessions}
          planType={AVAILABILITY_PLAN_ONE_TIME}
          onClick={() => setIsEditMode(true)}
        />
      ) : selectedSessions && selectedSessions.length !== 0 ? (
        <div className={css.sessionsContainer} onClick={() => setIsEditMode(true)}>
          <div className={css.oneTimeSessions}>
            {selectedSessions.map(session => {
              const { start, end } = session;
              return (
                <div key={start} className={css.oneTimeSession}>
                  <TimeRange
                    className={css.oneTimeRange}
                    startDate={timestampToDate(start)}
                    endDate={timestampToDate(end)}
                    dateType={DATE_TYPE_DATETIME}
                    timeZone={timeZone}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Button className={css.addScheduleButton} onClick={() => setIsEditMode(true)} type="button">
          + Add Care Schedule
        </Button>
      )}
    </>
  ) : (
    <Modal
      id="EditcareScheduleOneTimeModal"
      isOpen={isEditMode}
      onClose={() => setIsEditMode(false)}
      onManageDisableScrolling={onManageDisableScrolling}
      containerClassName={css.oneTimeEditModalContainer}
      usePortal
    >
      <CareScheduleSelectDatesContainer
        careSchedule={careSchedule}
        listing={currentUserListing}
        onManageDisableScrolling={onManageDisableScrolling}
        onSubmit={handleSubmit}
        submitButtonText="Save Schedule"
        errors={{}}
        exceptionsClassName={css.exceptions}
      />
    </Modal>
  );
};

export default ViewOneTime;
