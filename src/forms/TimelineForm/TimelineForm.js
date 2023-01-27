import React, { useState } from 'react';
import { array, bool, func, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import moment from 'moment';
import { intlShape, injectIntl, FormattedMessage } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import {
  resetToStartOfDay,
  timeOfDayFromLocalToTimeZone,
  timeOfDayFromTimeZoneToLocal,
  dateIsAfter,
  monthIdStringInTimeZone,
  getMonthStartInTimeZone,
  nextMonthFn,
  prevMonthFn,
} from '../../util/dates';
import { bookingDateRequired } from '../../util/validators';
import {
  FieldDateInput,
  FieldSelect,
  Form,
  IconArrowHead,
  PrimaryButton,
  IconClose,
} from '../../components';

import css from './TimelineForm.module.css';

const TODAY = new Date();
const MAX_AVAILABILITY_SESSIONS_RANGE = 365;

// Date formatting used for placeholder texts:
const dateFormattingOptions = { month: 'short', day: 'numeric', weekday: 'short' };

// React-dates returns wrapped date objects
const extractDateFromFieldDateInput = dateValue =>
  dateValue && dateValue.date ? dateValue.date : null;

const endOfAvailabilitySessionRange = (timeZone, date) => {
  return resetToStartOfDay(date, timeZone, MAX_AVAILABILITY_SESSIONS_RANGE - 1);
};

// Update current month and call callback function.
const onMonthClick = (currentMonth, setCurrentMonth, timeZone, onMonthChanged) => monthFn => {
  const updatedMonth = monthFn(currentMonth, timeZone);
  setCurrentMonth(updatedMonth);

  if (onMonthChanged) {
    const monthId = monthIdStringInTimeZone(updatedMonth, timeZone);
    onMonthChanged(monthId);
  }
};

// Format form's value for the react-dates input: convert timeOfDay to the local time
const formatFieldDateInput = timeZone => v =>
  v && v.date ? { date: timeOfDayFromTimeZoneToLocal(v.date, timeZone) } : { date: v };

// Parse react-dates input's value: convert timeOfDay to the given time zone
const parseFieldDateInput = timeZone => v =>
  v && v.date ? { date: timeOfDayFromLocalToTimeZone(v.date, timeZone) } : v;

/////////////////
// Next & Prev //
/////////////////

// Components for the react-dates calendar
const Next = props => {
  const { currentMonth, timeZone } = props;
  const nextMonthDate = nextMonthFn(currentMonth, timeZone);

  return dateIsAfter(nextMonthDate, endOfAvailabilitySessionRange(timeZone, TODAY)) ? null : (
    <IconArrowHead direction="right" size="small" />
  );
};
const Prev = props => {
  const { currentMonth, timeZone } = props;
  const prevMonthDate = prevMonthFn(currentMonth, timeZone);
  const currentMonthDate = getMonthStartInTimeZone(TODAY, timeZone);

  return dateIsAfter(prevMonthDate, currentMonthDate) ? (
    <IconArrowHead direction="left" size="small" />
  ) : null;
};

const getAvailabileEndDates = startDate => day => {
  if (day >= startDate) {
    return false;
  }
  return true;
};

const getAvailabileStartDates = endDate => day => {
  if (!endDate || day <= endDate) {
    return false;
  }
  return true;
};

//////////////////////////////////////////
// TimelineForm //
//////////////////////////////////////////
const TimelineForm = props => {
  const [currentMonth, setCurrentMonth] = useState(getMonthStartInTimeZone(TODAY, props.timeZone));
  return (
    <FinalForm
      {...props}
      render={formRenderProps => {
        const {
          className,
          rootClassName,
          formId,
          intl,
          onMonthChanged,
          timeZone,
          values,
          onStartDateChange,
          onEndDateChange,
          form,
        } = formRenderProps;

        const idPrefix = `${formId}` || 'TimelineForm';
        const { startDate, endDate } = values;

        if (startDate && startDate.date && startDate.date < TODAY) {
          form.change(startDate, null);
          form.change(endDate, null);
        }

        const startDay = extractDateFromFieldDateInput(startDate);
        const endDay = extractDateFromFieldDateInput(endDate);

        // Returns a function that changes the current month
        // Currently, used for hiding next&prev month arrow icons.
        const handleMonthClick = onMonthClick(
          currentMonth,
          setCurrentMonth,
          timeZone,
          onMonthChanged
        );

        const onDeleteEndDate = () => {
          form.change('endDate', null);
        };

        const onDeleteStartDate = () => {
          form.change('startDate', null);
          form.change('endDate', null);
        };

        const classes = classNames(rootClassName || css.root, className);

        return (
          <Form className={classes} onSubmit={e => {}}>
            <h2 className={css.heading}>
              <FormattedMessage id="TimelineForm.title" />
            </h2>

            <div className={css.section}>
              <div className={css.formRow}>
                <div className={css.field}>
                  <FieldDateInput
                    className={css.fieldDateInput}
                    name="startDate"
                    id={`${idPrefix}.startDate`}
                    label={intl.formatMessage({
                      id: 'TimelineForm.startDateLabel',
                    })}
                    placeholderText={intl.formatDate(TODAY, dateFormattingOptions)}
                    format={formatFieldDateInput(timeZone)}
                    parse={parseFieldDateInput(timeZone)}
                    isDayBlocked={getAvailabileStartDates(endDay)}
                    onChange={date => onStartDateChange(date)}
                    onPrevMonthClick={() => handleMonthClick(prevMonthFn)}
                    onNextMonthClick={() => handleMonthClick(nextMonthFn)}
                    navNext={<Next currentMonth={currentMonth} timeZone={timeZone} />}
                    navPrev={<Prev currentMonth={currentMonth} timeZone={timeZone} />}
                    useMobileMargins
                    showErrorMessage={false}
                  />
                  <button
                    className={css.removeExceptionButton}
                    onClick={() => onDeleteStartDate()}
                    type="button"
                  >
                    <IconClose size="normal" className={css.removeIcon} />
                  </button>
                </div>
                <div className={css.field}>
                  <FieldDateInput
                    name="endDate"
                    id={`${idPrefix}.endDate`}
                    className={css.fieldDateInput}
                    label={intl.formatMessage({
                      id: 'TimelineForm.endDateLabel',
                    })}
                    placeholderText={intl.formatDate(TODAY, dateFormattingOptions)}
                    format={formatFieldDateInput(timeZone)}
                    parse={parseFieldDateInput(timeZone)}
                    isDayBlocked={getAvailabileEndDates(startDay, timeZone)}
                    onChange={date => onEndDateChange(date)}
                    onPrevMonthClick={() => handleMonthClick(prevMonthFn)}
                    onNextMonthClick={() => handleMonthClick(nextMonthFn)}
                    navNext={<Next currentMonth={currentMonth} timeZone={timeZone} />}
                    navPrev={<Prev currentMonth={currentMonth} timeZone={timeZone} />}
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
            </div>
          </Form>
        );
      }}
    />
  );
};

TimelineForm.defaultProps = {
  className: null,
  rootClassName: null,
  fetchErrors: null,
  formId: null,
  selectedSessions: [],
};

TimelineForm.propTypes = {
  className: string,
  rootClassName: string,
  formId: string,
  selectedSessions: array,
  intl: intlShape.isRequired,
  onSubmit: func.isRequired,
  timeZone: string.isRequired,
  updateInProgress: bool.isRequired,
  fetchErrors: shape({
    updateListingError: propTypes.error,
  }),
};

export default compose(injectIntl)(TimelineForm);
