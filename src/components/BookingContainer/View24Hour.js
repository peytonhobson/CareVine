import React, { useState } from 'react';

import { FormattedMessage } from 'react-intl';
import { AvailabilityPreview, Button, Modal, ViewCalendar, InlineTextButton } from '..';
import { Care24HourForm } from '../../forms';
import { timestampToDate } from '../../util/dates';
import { getDefaultTimeZoneOnBrowser } from '../../util/dates';
import { AVAILABILITY_PLAN_24_HOUR } from '../../util/constants';

import css from './BookingContainer.module.css';

const CALENDAR_VIEW = 'calendar';
const LIST_VIEW = 'list';

const defaultTimeZone = () =>
  typeof window !== 'undefined' ? getDefaultTimeZoneOnBrowser() : 'Etc/UTC';

const View24Hour = props => {
  const {
    careSchedule,
    currentUserListing,
    onManageDisableScrolling,
    onChange,
    onChangeViewType,
    viewType,
  } = props;

  const [isEditMode, setIsEditMode] = useState(false);

  const availableDays = careSchedule?.availableDays;
  const endDate = careSchedule?.endDate;
  const startDate = careSchedule?.startDate;
  const availabilityExceptions = careSchedule?.availabilityExceptions;

  const defaultcareSchedule = {
    type: AVAILABILITY_PLAN_24_HOUR,
    availableDays: [],
    liveIn: false,
    timezone: defaultTimeZone(),
  };
  const formcareSchedule =
    careSchedule?.type === AVAILABILITY_PLAN_24_HOUR ? careSchedule : defaultcareSchedule;

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
          availableDays={availableDays}
          startDate={startDate}
          endDate={endDate}
          availabilityExceptions={availabilityExceptions}
          planType={AVAILABILITY_PLAN_24_HOUR}
          onClick={() => setIsEditMode(true)}
          hoursPerDay={careSchedule?.hoursPerDay}
        />
      ) : (
        <div className={css.twentyFourListView}>
          <AvailabilityPreview availableDays={availableDays} className={css.previewDay} />
          <div className={css.datesContainer}>
            <span className={css.dateContainer}>
              <p>
                <span className={css.bold}>Start Date: </span>
                <span className={css.item}>
                  {careSchedule?.startDate
                    ? timestampToDate(careSchedule.startDate).toLocaleDateString()
                    : 'NA'}
                </span>
              </p>
            </span>
            <span className={css.dateContainer}>
              <p>
                <span className={css.bold}>End Date: </span>
                <span className={css.item}>
                  {careSchedule?.endDate
                    ? timestampToDate(careSchedule.endDate).toLocaleDateString()
                    : 'NA'}
                </span>
              </p>
            </span>
          </div>
        </div>
      )}
    </>
  ) : (
    <Modal
      id="BookingPanel"
      isOpen={isEditMode}
      onClose={() => setIsEditMode(false)}
      onManageDisableScrolling={onManageDisableScrolling}
      containerClassName={css.bookingModalContainer}
      usePortal
    >
      <Care24HourForm
        careSchedule={formcareSchedule}
        currentListing={currentUserListing}
        onManageDisableScrolling={onManageDisableScrolling}
        onSubmit={handleSubmit}
        submitButtonText="Save"
        submitButtonType="button"
      ></Care24HourForm>
    </Modal>
  );
};

export default View24Hour;
