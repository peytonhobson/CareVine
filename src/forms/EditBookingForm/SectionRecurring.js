import React, { useState, useMemo } from 'react';

import { DailyPlan, Modal, WeekPanel, FieldDateInput, IconClose, Button } from '../../components';
import {
  formatFieldDateInput,
  parseFieldDateInput,
  filterAvailableBookingEndDates,
  filterAvailableBookingStartDates,
} from '../../util/dates';
import { useCheckMobileScreen } from '../../util/hooks';
import { WEEKDAYS } from '../../util/constants';

import css from './EditBookingForm.module.css';

const TODAY = new Date();

// Date formatting used for placeholder texts:
const dateFormattingOptions = { month: 'short', day: 'numeric', weekday: 'short' };

const overlapsBookingTime = (startDate, endDate, booking) => {
  const bookingStart = new Date(booking.startDate);
  const bookingEnd = new Date(booking.endDate);
  const start = new Date(startDate);
  const end = new Date(endDate);

  return (
    (start <= bookingStart && end >= bookingStart && !booking.endDate) ||
    (start >= bookingStart && !booking.endDate) ||
    (start >= bookingStart && start <= bookingEnd) ||
    (end >= bookingStart && end <= bookingEnd) ||
    (start <= bookingStart && end >= bookingEnd)
  );
};

const getDisabledDays = (bookedDays = [], startDate, endDate, bookedDates = []) => {
  const bookedDaysArr = bookedDays.reduce((acc, booking) => {
    const overlaps = overlapsBookingTime(startDate, endDate, booking);

    if (overlaps) {
      return [...acc, ...booking.days];
    }
    return acc;
  }, []);

  const bookedDatesArr = bookedDates.reduce((acc, bookingDate) => {
    const isBetween =
      new Date(bookingDate) >= startDate && (!endDate || new Date(bookingDate) <= endDate);

    if (isBetween) {
      const dayOfWeek = WEEKDAYS[new Date(bookingDate).getDay()];
      return [...acc, dayOfWeek];
    }
    return acc;
  }, []);

  return [...new Set([...bookedDaysArr, ...bookedDatesArr])];
};

const SectionRecurring = props => {
  const { values, intl, onManageDisableScrolling, listing, onDeleteEndDate } = props;

  const [isEditDatesModalOpen, setIsEditDatesModalOpen] = useState(false);

  const { startDate, endDate } = values;

  const startDay = startDate?.date;
  const endDay = endDate?.date;

  const timezone = listing.attributes.publicData.availabilityPlan?.timezone;

  const { bookedDays = [], bookedDates = [] } = listing.attributes.metadata;

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

  const disabledDays = useMemo(() => getDisabledDays(bookedDays, startDay, endDay, bookedDates), [
    bookedDays,
    startDay,
    endDay,
  ]);

  return (
    <div className={css.recurringRoot}>
      {disabledDays.length > 0 ? (
        <p>
          <strong className={css.warning}>Warning:</strong> The caregiver is unavailable on certain
          days between your start and end date. If you would like to book on these days, please
          select a different date range. You may also create a booking with another caregiver who
          has availability during these days.
        </p>
      ) : null}
      <div className={css.dateInputContainer}>
        <FieldDateInput
          className={css.fieldDateInput}
          name="startDate"
          id="startDate"
          label="Start Date"
          placeholderText={intl.formatDate(TODAY, dateFormattingOptions)}
          format={formatFieldDateInput(timezone)}
          parse={parseFieldDateInput(timezone)}
          isDayBlocked={filterAvailableBookingStartDates(endDay, bookedDays, bookedDates)}
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
            isDayBlocked={filterAvailableBookingEndDates(startDay, bookedDays, bookedDates)}
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
        disabledDays={disabledDays}
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
              <DailyPlan
                dayOfWeek={w}
                key={w}
                values={values}
                intl={intl}
                multipleTimesDisabled
                disabledDays={disabledDays}
              />
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
