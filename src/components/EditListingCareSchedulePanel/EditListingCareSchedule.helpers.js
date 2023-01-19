import { getDefaultTimeZoneOnBrowser } from '../../util/dates';
import zipcodeToTimezone from 'zipcode-to-timezone';

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

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
            endTime: endTime === '24:00' ? '00:00' : endTime,
          }
        : null;
    });

    return allEntries.concat(dayEntries.filter(e => !!e));
  }, []);

// Create availabilityPlan from submit values
export const createAvailabilityPlan = (values, currentListing) => {
  const timezone = zipcodeToTimezone.lookup(currentListing.attributes.publicData.location.zipcode);

  const isFlexible = values.isFlexible;

  return {
    type: 'availability-plan/recurring',
    timezone,
    entries: createEntriesFromSubmitValues(values),
    ...isFlexible,
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
export const createInitialValues = availabilityPlan => {
  const { timezone, entries } = availabilityPlan || {};
  const tz = timezone || defaultTimeZone();
  return {
    timezone: tz,
    ...createEntryDayGroups(entries),
  };
};
