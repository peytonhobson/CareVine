import React from 'react';

import { FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import { FieldSelect, InlineTextButton, IconClose, InfoTooltip } from '../../components';
import { FieldArray } from 'react-final-form-arrays';
import WarningIcon from '@mui/icons-material/Warning';

import css from './DailyPlan.module.css';

const shortWeekdayToLong = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  yhu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

const printHourStrings = h => {
  if (h === 0 || h === 24) {
    return '12:00am';
  }

  if (h === 12) {
    return '12:00pm';
  }

  if (h > 12) {
    h = h % 12;
    return `${h}:00pm`;
  }

  return `${h}:00am`;
};

const startTimeOrderMap = new Map([
  ['12:00am', 0],
  ['1:00am', 1],
  ['2:00am', 2],
  ['3:00am', 3],
  ['4:00am', 4],
  ['5:00am', 5],
  ['6:00am', 6],
  ['7:00am', 7],
  ['8:00am', 8],
  ['9:00am', 9],
  ['10:00am', 10],
  ['11:00am', 11],
  ['12:00pm', 12],
  ['1:00pm', 13],
  ['2:00pm', 14],
  ['3:00pm', 15],
  ['4:00pm', 16],
  ['5:00pm', 17],
  ['6:00pm', 18],
  ['7:00pm', 19],
  ['8:00pm', 20],
  ['9:00pm', 21],
  ['10:00pm', 22],
  ['11:00pm', 23],
]);

const endTimeOrderMap = new Map([
  ['1:00am', 1],
  ['2:00am', 2],
  ['3:00am', 3],
  ['4:00am', 4],
  ['5:00am', 5],
  ['6:00am', 6],
  ['7:00am', 7],
  ['8:00am', 8],
  ['9:00am', 9],
  ['10:00am', 10],
  ['11:00am', 11],
  ['12:00pm', 12],
  ['1:00pm', 13],
  ['2:00pm', 14],
  ['3:00pm', 15],
  ['4:00pm', 16],
  ['5:00pm', 17],
  ['6:00pm', 18],
  ['7:00pm', 19],
  ['8:00pm', 20],
  ['9:00pm', 21],
  ['10:00pm', 22],
  ['11:00pm', 23],
  ['12:00am', 24],
]);

const ALL_START_HOURS = Array.from(startTimeOrderMap.keys());
const ALL_END_HOURS = Array.from(endTimeOrderMap.keys());

const sortEntries = (defaultCompareReturn = 0) => (a, b) => {
  if (a.startTime && b.startTime) {
    const aStart = startTimeOrderMap.get(a.startTime);
    const bStart = startTimeOrderMap.get(b.startTime);
    return aStart - bStart;
  }
  return defaultCompareReturn;
};

const findEntryFn = entry => e => e.startTime === entry.startTime && e.endTime === entry.endTime;

const filterStartHours = (availableStartHours, values, dayOfWeek, index) => {
  const entries = values[dayOfWeek];
  const currentEntry = entries[index];

  // If there is no end time selected, return all the available start times
  if (!currentEntry.endTime) {
    return availableStartHours;
  }

  // By default the entries are not in order so we need to sort the entries by startTime
  // in order to find out the previous entry
  const sortedEntries = [...entries].sort(sortEntries());

  // Find the index of the current entry from sorted entries
  const currentIndex = sortedEntries.findIndex(findEntryFn(currentEntry));

  // If there is no next entry or the previous entry does not have endTime,
  // return all the available times before current selected end time.
  // Otherwise return all the available start times that are after the previous entry or entries.
  const prevEntry = sortedEntries[currentIndex - 1];
  const pickBefore = time => h => startTimeOrderMap.get(h) < endTimeOrderMap.get(time);

  const pickBetween = (start, end) => h => {
    return (
      startTimeOrderMap.get(h) >= endTimeOrderMap.get(start) &&
      startTimeOrderMap.get(h) < endTimeOrderMap.get(end)
    );
  };

  return !prevEntry || !prevEntry.endTime
    ? availableStartHours.filter(pickBefore(currentEntry.endTime))
    : availableStartHours.filter(pickBetween(prevEntry.endTime, currentEntry.endTime));
};

const filterEndHours = (availableEndHours, values, dayOfWeek, index) => {
  const entries = values[dayOfWeek];
  const currentEntry = entries[index];

  // If there is no start time selected, return an empty array;
  if (!currentEntry.startTime) {
    return [];
  }

  // By default the entries are not in order so we need to sort the entries by startTime
  // in order to find out the allowed start times
  const sortedEntries = [...entries].sort(sortEntries(-1));

  // Find the index of the current entry from sorted entries
  const currentIndex = sortedEntries.findIndex(findEntryFn(currentEntry));

  // If there is no next entry,
  // return all the available end times that are after the start of current entry.
  // Otherwise return all the available end hours between current start time and next entry.
  const nextEntry = sortedEntries[currentIndex + 1];
  const pickAfter = time => h => {
    return endTimeOrderMap.get(h) > startTimeOrderMap.get(time);
  };
  const pickBetween = (start, end) => h => {
    return (
      endTimeOrderMap.get(h) > startTimeOrderMap.get(start) &&
      endTimeOrderMap.get(h) <= endTimeOrderMap.get(end)
    );
  };

  let availableHours = null;

  !nextEntry || !nextEntry.startTime
    ? (availableHours = availableEndHours.filter(pickAfter(currentEntry.startTime)))
    : (availableHours = availableEndHours.filter(
        pickBetween(currentEntry.startTime, nextEntry.startTime)
      ));

  return availableHours;
};

const getEntryBoundaries = (values, dayOfWeek, intl, findStartHours) => index => {
  const entries = values[dayOfWeek];
  const boundaryDiff = findStartHours ? 0 : 1;

  return entries.reduce((allHours, entry, i) => {
    const { startTime, endTime } = entry || {};

    if (i !== index && startTime && endTime) {
      const hoursBetween = Array(endTimeOrderMap.get(endTime) - startTimeOrderMap.get(startTime))
        .fill()
        .map((v, i) => printHourStrings(startTimeOrderMap.get(startTime) + i + boundaryDiff));

      return allHours.concat(hoursBetween);
    }

    return allHours;
  }, []);
};

const DailyPlan = props => {
  const {
    dayOfWeek,
    values,
    intl,
    multipleTimesDisabled,
    warning,
    disabled,
    className,
    customName,
    noClose,
  } = props;
  const getEntryStartTimes = getEntryBoundaries(values, dayOfWeek, intl, true);
  const getEntryEndTimes = getEntryBoundaries(values, dayOfWeek, intl, false);

  // const [startHours, setStartHours] = useState(ALL_START_HOURS);
  // const [endHours, setEndHours] = useState(ALL_END_HOURS);

  const hasEntries = values[dayOfWeek] && values[dayOfWeek][0];

  const startTimePlaceholder = intl.formatMessage({
    id: 'EditListingAvailabilityPlanForm.startTimePlaceholder',
  });
  const endTimePlaceholder = intl.formatMessage({
    id: 'EditListingAvailabilityPlanForm.endTimePlaceholder',
  });

  return (
    <div className={classNames(css.weekDay, hasEntries ? css.hasEntries : null, className)}>
      <div className={css.dayOfWeek}>
        {customName ? (
          customName
        ) : (
          <>
            <FormattedMessage id={`EditListingAvailabilityPlanForm.dayOfWeek.${dayOfWeek}`} />
            {(warning && values[dayOfWeek]) || disabled ? (
              <div className={css.warning}>
                <InfoTooltip
                  icon={<WarningIcon color="warning" />}
                  title={
                    <p>
                      One or more {shortWeekdayToLong[dayOfWeek]}s are unavailable during your
                      chosen start/end dates.
                    </p>
                  }
                />
              </div>
            ) : null}
          </>
        )}
      </div>

      <FieldArray name={dayOfWeek}>
        {({ fields }) => {
          return (
            <div className={css.timePicker}>
              {fields.map((name, index) => {
                // Pick available start hours
                const pickUnreservedStartHours = h => !getEntryStartTimes(index).includes(h);
                const availableStartHours = ALL_START_HOURS.filter(pickUnreservedStartHours);

                // Pick available end hours
                const pickUnreservedEndHours = h => !getEntryEndTimes(index).includes(h);
                const availableEndHours = ALL_END_HOURS.filter(pickUnreservedEndHours);

                return (
                  <div className={css.fieldWrapper} key={name}>
                    <div className={css.formRow}>
                      <div className={css.field}>
                        <FieldSelect
                          id={`${name}.startTime`}
                          name={`${name}.startTime`}
                          selectClassName={css.fieldSelect}
                          initialValueSelected={index === 0 && fields.value[index].startTime}
                          disabled={disabled}
                        >
                          {index !== 0 && (
                            <option disabled value="">
                              {startTimePlaceholder}
                            </option>
                          )}
                          {filterStartHours(availableStartHours, values, dayOfWeek, index).map(
                            s => (
                              <option value={s} key={s}>
                                {s}
                              </option>
                            )
                          )}
                        </FieldSelect>
                      </div>
                      <span className={css.dashBetweenTimes}>-</span>
                      <div className={css.field}>
                        <FieldSelect
                          id={`${name}.endTime`}
                          name={`${name}.endTime`}
                          selectClassName={css.fieldSelect}
                          initialValueSelected={index === 0 && fields.value[index].endTime}
                          disabled={disabled}
                        >
                          {index !== 0 && (
                            <option disabled value="">
                              {endTimePlaceholder}
                            </option>
                          )}
                          {filterEndHours(availableEndHours, values, dayOfWeek, index).map(s => (
                            <option value={s} key={s}>
                              {s}
                            </option>
                          ))}
                        </FieldSelect>
                      </div>
                    </div>
                    {!noClose ? (
                      <div
                        className={css.fieldArrayRemove}
                        onClick={() => fields.remove(index)}
                        style={{ cursor: 'pointer' }}
                      >
                        <IconClose rootClassName={css.closeIcon} />
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {fields.length === 0 && !disabled ? (
                <InlineTextButton
                  type="button"
                  className={css.buttonSetHours}
                  onClick={() => fields.push({ startTime: '8:00am', endTime: '5:00pm' })}
                  disabled={disabled}
                >
                  <FormattedMessage id="EditListingAvailabilityPlanForm.setHours" />
                </InlineTextButton>
              ) : multipleTimesDisabled ? null : (
                <InlineTextButton
                  type="button"
                  className={css.buttonAddNew}
                  onClick={() => fields.push({ startTime: null, endTime: null })}
                >
                  <FormattedMessage id="EditListingAvailabilityPlanForm.addAnother" />
                </InlineTextButton>
              )}
            </div>
          );
        }}
      </FieldArray>
    </div>
  );
};

export default DailyPlan;
