import { getDefaultTimeZoneOnBrowser } from '../../util/dates';
import zipcodeToTimezone from 'zipcode-to-timezone';
import { WEEKDAYS } from '../../util/constants';

export const defaultTimeZone = () =>
  typeof window !== 'undefined' ? getDefaultTimeZoneOnBrowser() : 'Etc/UTC';

// Create entries from submit values
export const createEntriesFromSubmitValues = values =>
  WEEKDAYS.reduce((allEntries, dayOfWeek) => {
    const dayValues = values[dayOfWeek] || [];
    const dayEntries = dayValues.map(dayValue => {
      const { startTime, endTime } = dayValue;
      // Note: This template doesn't support seats yet.
      return startTime && endTime
        ? {
            dayOfWeek,
            seats: 1,
            startTime,
            endTime,
          }
        : null;
    });

    return allEntries.concat(dayEntries.filter(e => !!e));
  }, []);

// Create careSchedule from submit values
export const createCareSchedule = (values, currentListing) => {
  const timezone =
    zipcodeToTimezone.lookup(currentListing?.attributes?.publicData?.location?.zipcode) ||
    'America/Denver';

  return {
    type: 'repeat',
    timezone,
    entries: createEntriesFromSubmitValues(values),
  };
};

// Create initial entry mapping for form's initial values
export const createEntryDayGroups = (entries = {}) =>
  entries.reduce((groupedEntries, entry) => {
    const { startTime, endTime: endHour, dayOfWeek } = entry;
    const dayGroup = groupedEntries[dayOfWeek] || [];
    return {
      ...groupedEntries,
      [dayOfWeek]: [
        ...dayGroup,
        {
          startTime,
          endTime: endHour === '00:00' ? '24:00' : endHour,
        },
      ],
    };
  }, {});

// Create initial values
export const createInitialValues = careSchedule => {
  const { timezone, entries } = careSchedule || {};
  const tz = timezone || defaultTimeZone();
  return {
    timezone: tz,
    ...createEntryDayGroups(entries),
  };
};
