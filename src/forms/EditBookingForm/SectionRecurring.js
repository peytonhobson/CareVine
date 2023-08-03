import React, { useState, useMemo, useEffect } from 'react';

import {
  DailyPlan,
  Modal,
  WeekPanel,
  FieldDateInput,
  IconClose,
  Button,
  BookingExceptions,
} from '../../components';
import {
  formatFieldDateInput,
  parseFieldDateInput,
  filterAvailableBookingEndDates,
  filterAvailableBookingStartDates,
} from '../../util/dates';
import { WEEKDAYS, WEEKDAY_MAP } from '../../util/constants';
import { pick } from 'lodash';

import css from './EditBookingForm.module.css';

const TODAY = new Date();
// Date formatting used for placeholder texts:
const dateFormattingOptions = { month: 'short', day: 'numeric', weekday: 'short' };

const renderDayContents = (bookedDays, bookedDates) => (date, classes) => {
  const realDate = date.startOf('day');
  const day = date.day();
  const isBookedDay = bookedDays?.some(
    d =>
      d.days.some(dd => WEEKDAY_MAP[dd] === day) &&
      (!d.endDate || realDate <= new Date(d.endDate)) &&
      realDate >= new Date(d.startDate)
  );
  const isBookedDate = bookedDates?.some(d => d === realDate.toISOString());

  const isBlocked = classes.has('blocked');

  return isBookedDay || isBookedDate ? (
    <div style={{ color: 'var(--failColor)' }}>{date.format('D')}</div>
  ) : (
    <span className={!isBlocked && css.regularDay}>{date.format('D')}</span>
  );
};

const SectionRecurring = props => {
  const {
    values,
    intl,
    onManageDisableScrolling,
    listing,
    onDeleteEndDate,
    form,
    unavailableDates,
  } = props;

  const [isEditDatesModalOpen, setIsEditDatesModalOpen] = useState(false);

  const { startDate, endDate } = values;
  const weekdays = pick(values, WEEKDAYS);

  const startDay = startDate?.date;
  const endDay = endDate?.date;

  const timezone = listing.attributes.publicData.availabilityPlan?.timezone;

  const { bookedDays = [], bookedDates = [] } = listing.attributes.metadata;

  useEffect(() => {
    if (Object.keys(weekdays)?.length === 0) {
      form.change('startDate', null);
      form.change('endDate', null);
    }
  }, [Object.keys(weekdays)?.length]);

  return (
    <div className={css.recurringRoot}>
      <h2>Which days do you need care?</h2>
      <div className={css.week}>
        {WEEKDAYS.map(w => {
          return (
            <DailyPlan
              dayOfWeek={w}
              key={w}
              values={values}
              intl={intl}
              multipleTimesDisabled
              disabledDays={unavailableDates}
              className={css.dailyPlan}
            />
          );
        })}
      </div>
      <div className={css.timeline}>
        <h2>When do you need care?</h2>
        <p className={css.leaveEndDate}>
          Leave end date blank if you want the booking to repeat indefinitely
        </p>
        <div className={css.dateInputContainer}>
          <FieldDateInput
            className={css.fieldDateInput}
            name="startDate"
            id="startDate"
            label="Start Date"
            placeholderText={intl.formatDate(TODAY, dateFormattingOptions)}
            format={formatFieldDateInput(timezone)}
            parse={parseFieldDateInput(timezone)}
            isDayBlocked={filterAvailableBookingStartDates(
              endDay,
              bookedDays,
              bookedDates,
              weekdays
            )}
            useMobileMargins
            showErrorMessage={false}
            disabled={Object.keys(weekdays).length === 0}
            renderDayContents={renderDayContents(bookedDays, bookedDates)}
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
              isDayBlocked={filterAvailableBookingEndDates(
                startDay,
                bookedDays,
                bookedDates,
                weekdays
              )}
              useMobileMargins
              showErrorMessage={false}
              disabled={!startDate || !startDate.date}
              renderDayContents={renderDayContents(bookedDays, bookedDates)}
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
      </div>
      <div className={css.exceptions}>
        <h2>Are there any exceptions to this schedule?</h2>
        <BookingExceptions
          bookedDates={bookedDates}
          bookedDays={bookedDays}
          values={values}
          onManageDisableScrolling={onManageDisableScrolling}
          intl={intl}
          timezone={timezone}
          form={form}
        />
      </div>

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
                disabledDays={unavailableDates}
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
