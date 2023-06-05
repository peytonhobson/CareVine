import React, { forwardRef } from 'react';

import { WeekCalendar } from '../../';
import { SectionCard } from './';

import css from './sections.module.css';

const AvailabilitySection = forwardRef((props, ref) => {
  const { entries, isProfileClosed } = props;

  const availabilityCardTitle = <h1 className={css.title}>Availability</h1>;

  const mappedTimesToDay = {
    sun: [],
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
  };

  entries?.forEach(entry => {
    const { dayOfWeek, startTime, endTime } = entry;
    mappedTimesToDay[dayOfWeek].push({ startTime, endTime });
  });

  return (
    <SectionCard title={availabilityCardTitle} ref={ref}>
      {isProfileClosed ? (
        <p>*Availability is empty because this listing is currently closed.</p>
      ) : null}
      <WeekCalendar mappedTimesToDay={mappedTimesToDay} />
    </SectionCard>
  );
});

export default AvailabilitySection;
