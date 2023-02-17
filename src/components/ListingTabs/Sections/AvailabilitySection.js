import React, { forwardRef } from 'react';

import { WeekCalendar } from '../../';
import { SectionCard } from './';

import css from './sections.module.css';

const AvailabilitySection = forwardRef((props, ref) => {
  const { entries } = props;

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

  entries.forEach(entry => {
    const { dayOfWeek, startTime, endTime } = entry;
    mappedTimesToDay[dayOfWeek].push({ startTime, endTime });
  });

  return (
    <SectionCard title={availabilityCardTitle} ref={ref}>
      <WeekCalendar mappedTimesToDay={mappedTimesToDay} />
    </SectionCard>
  );
});

export default AvailabilitySection;
