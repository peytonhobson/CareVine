import React, { useState } from 'react';

import { DailyPlan, Modal, WeekPanel, FieldDateInput, IconClose, Button } from '../../components';
import {
  formatFieldDateInput,
  parseFieldDateInput,
  getAvailableStartDates,
  getAvailableEndDates,
} from '../../util/dates';
import { useCheckMobileScreen } from '../../util/hooks';
import { WEEKDAYS } from '../../util/constants';

import css from './EditBookingForm.module.css';

const TODAY = new Date();

// Date formatting used for placeholder texts:
const dateFormattingOptions = { month: 'short', day: 'numeric', weekday: 'short' };

const SectionRecurring = props => {
  const { values, intl, onManageDisableScrolling, listing } = props;

  const [isEditDatesModalOpen, setIsEditDatesModalOpen] = useState(false);

  const isMobile = useCheckMobileScreen();

  const onDeleteEndDate = () => {
    form.change('endDate', null);
  };

  const { startDate, endDate } = values;

  const startDay = startDate?.date;
  const endDay = endDate?.date;

  const timezone = listing.attributes.publicData.availabilityPlan?.timezone;

  const availabilityPlan = {
    type: 'availability-plan/day',
    timezone,
    entries: WEEKDAYS.filter(w => values[w]?.[0]?.startTime).map(dayOfWeek => ({
      dayOfWeek,
      seats: 1,
      startTime: values[dayOfWeek]?.[0]?.startTime ? values[dayOfWeek][0].startTime : null,
      endTime: values[dayOfWeek]?.[0]?.endTime ? values[dayOfWeek][0].endTime : null,
    })),
  };

  return (
    <div className={css.recurringRoot}>
      <div className={css.dateInputContainer}>
        <FieldDateInput
          className={css.fieldDateInput}
          name="startDate"
          id="startDate"
          label="Start Date"
          placeholderText={intl.formatDate(TODAY, dateFormattingOptions)}
          format={formatFieldDateInput(timezone)}
          parse={parseFieldDateInput(timezone)}
          isDayBlocked={getAvailableStartDates(endDay)}
          useMobileMargins
          showErrorMessage={false}
        />
        <div className={css.endDateContainer}>
          <FieldDateInput
            name="endDate"
            id="endDate"
            className={css.fieldDateInput}
            label="End Date • optional"
            placeholderText={intl.formatDate(TODAY, dateFormattingOptions)}
            format={formatFieldDateInput(timezone)}
            parse={parseFieldDateInput(timezone)}
            isDayBlocked={getAvailableEndDates(startDay, timezone)}
            useMobileMargins
            showErrorMessage={false}
            disabled={!startDate || !startDate.date}
          />
          <button
            className={css.removeExceptionButton}
            onClick={() => onDeleteEndDate()}
            type="button"
          >
            <IconClose size="normal" className={css.removeIcon} />
          </button>
        </div>
      </div>
      <WeekPanel
        openEditModal={() => setIsEditDatesModalOpen(true)}
        className={css.weekPanel}
        availabilityPlan={availabilityPlan}
      />
      <Modal
        id="EditRecurringDates"
        isOpen={isEditDatesModalOpen}
        onClose={() => setIsEditDatesModalOpen(false)}
        onManageDisableScrolling={onManageDisableScrolling}
        containerClassName={css.recurringModalContainer}
        usePortal
      >
        <p className={css.modalTitle}>Edit Care Schedule</p>
        <div className={css.week}>
          {WEEKDAYS.map(w => {
            return (
              <DailyPlan dayOfWeek={w} key={w} values={values} intl={intl} multipleTimesDisabled />
            );
          })}
        </div>
        <Button className={css.saveWeekButton} onClick={() => setIsEditDatesModalOpen(false)}>
          Save
        </Button>
      </Modal>
    </div>
  );
};

export default SectionRecurring;
