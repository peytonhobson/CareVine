import React, { useEffect } from 'react';

import { DailyPlan, FieldDateInput, IconClose, BookingExceptions } from '../../../components';
import {
  formatFieldDateInput,
  parseFieldDateInput,
  filterAvailableBookingEndDates,
  filterAvailableBookingStartDates,
} from '../../../util/dates';
import { WEEKDAYS } from '../../../util/constants';
import { useCheckMobileScreen } from '../../../util/hooks';
import moment from 'moment';
import { checkIsBlockedDay, mapWeekdays } from '../../../util/bookings';
import classNames from 'classnames';

import css from '../EditBookingForm.module.css';

const TODAY = new Date();
// Date formatting used for placeholder texts:
const dateFormattingOptions = { month: 'short', day: 'numeric', weekday: 'short' };

const renderDayContents = (bookedDays, bookedDates, isMobile) => (date, classes) => {
  const isBlockedDay = checkIsBlockedDay({ date, bookedDays, bookedDates });
  const dateInPast = moment(date).isBefore(moment().startOf('day'));

  const isBlocked = classes.has('blocked');

  if (classes.has('selected') && isMobile) {
    return <div className={css.mobileSelectedDay}>{date.format('D')}</div>;
  }

  return isBlockedDay && !dateInPast ? (
    <div className="text-error cursor-not-allowed">{date.format('D')}</div>
  ) : (
    <span className={!isBlocked ? css.regularDay : null}>{date.format('D')}</span>
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
    unavailableDays,
    booking,
  } = props;

  const isMobile = useCheckMobileScreen();

  const { startDate, endDate } = values;
  const weekdays = mapWeekdays(values);

  const startDay = startDate?.date;
  const endDay = endDate?.date;

  const timezone = listing.attributes.publicData.availabilityPlan?.timezone;

  const { bookedDays = [], bookedDates = [] } = listing.attributes.metadata;

  useEffect(() => {
    if (weekdays.length === 0) {
      form.change('startDate', null);
      form.change('endDate', null);
    }
  }, [weekdays?.length]);

  const startDateDisabled =
    (booking
      ? !moment()
          .add(2, 'days')
          .isBefore(booking?.attributes.metadata.startDate, 'day')
      : false) || weekdays.length === 0;

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
              warnings={unavailableDays?.includes(w)}
              className={css.dailyPlan}
            />
          );
        })}
      </div>
      <div className={css.timeline}>
        <h2>When do you need care?</h2>
        <p className={classNames(css.leaveEndDate, 'text-error', 'text-sm')}>
          Leave end date blank if you want the booking to repeat indefinitely.
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
            disabled={startDateDisabled}
            renderDayContents={renderDayContents(bookedDays, bookedDates, isMobile)}
            withPortal={isMobile}
            // TODO: REmove enable outside days
            enableOutsideDays
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
              renderDayContents={renderDayContents(bookedDays, bookedDates, isMobile)}
              withPortal={isMobile}
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
    </div>
  );
};

export default SectionRecurring;
