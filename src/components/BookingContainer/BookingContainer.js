import React, { useState } from 'react';

import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';
import { Button, IconArrowHead } from '../../components';
import zipcodeToTimezone from 'zipcode-to-timezone';
import { BookingPriceForm, BookingScheduleForm } from '../../forms';
import { getDefaultTimeZoneOnBrowser } from '../../util/dates';
import {
  AVAILABILITY_PLAN_24_HOUR,
  AVAILABILITY_PLAN_ONE_TIME,
  AVAILABILITY_PLAN_REPEAT,
} from '../../util/constants';
import Weekday from '../EditListingCareSchedulePanel/Weekday';
import config from '../../config';
import { findOptionsForSelectFilter } from '../../util/search';
import View24Hour from './View24Hour';
import ViewRepeat from './ViewRepeat';
import ViewOneTime from './ViewOneTime';

import css from './BookingContainer.module.css';

const defaultTimeZone = () =>
  typeof window !== 'undefined' ? getDefaultTimeZoneOnBrowser() : 'Etc/UTC';

const timeOrderMap = new Map([
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

// Write a function to calculate the number of hours from the availability plan in a two week time period
const calculateHoursFromPlan = plan => {
  const { type, timezone, startDate, endDate, ...rest } = plan;
  const twoWeeksFromStart = startDate + 14 * 24 * 60 * 60 * 1000;

  let hours = 0;

  // This will not be a subscription and will be paid after last session is completed
  if (type === AVAILABILITY_PLAN_ONE_TIME) {
    const { selectedSessions } = rest;

    selectedSessions.forEach(session => {
      const { start, end } = session;

      hours += (end - start) / (60 * 60 * 1000);
    });
  } else if (type === AVAILABILITY_PLAN_REPEAT) {
    const { entries } = rest;

    entries.forEach(day => {
      const { startTime, endTime } = day;

      const endTimeValue = endTime === '12:00am' ? 24 : timeOrderMap.get(endTime);
      const startTimeValue = timeOrderMap.get(startTime);

      if (twoWeeksFromStart < endDate) {
        hours += endTimeValue - startTimeValue;
      } else {
        hours += (endTimeValue - startTimeValue) * 2;
      }
    });
  }
  // TODO: This needs to be determined after days vs hour billing is determined
  // else if (type === AVAILABILITY_PLAN_24_HOUR) {
  //   const { startDate, endDate } = rest;

  //   const start = new Date(startDate);
  //   const end = new Date(endDate);

  //   hours.push((end - start) / (60 * 60 * 1000));
  // }

  return hours;
};

const CALENDAR_VIEW = 'calendar';
const LIST_VIEW = 'list';

const BOOKING_SCHEDULE_FORM_NAME = 'BookingScheduleForm';
const BOOKING_PRICE_FORM_NAME = 'BookingPriceForm';

const BookingContainer = props => {
  const {
    className,
    rootClassName,
    listing,
    currentUserListing,
    onManageDisableScrolling,
    onBookNow,
  } = props;
  const classes = classNames(rootClassName || css.root, className);

  const availabilityPlan = currentUserListing?.attributes?.availabilityPlan;
  const planType = availabilityPlan?.type;

  const [oneTimePlan, setOneTimePlan] = useState(
    planType === AVAILABILITY_PLAN_ONE_TIME ? availabilityPlan : null
  );
  const [repeatPlan, setRepeatPlan] = useState(
    planType === AVAILABILITY_PLAN_REPEAT ? availabilityPlan : null
  );
  const [twentyFourHourPlan, setTwentyFourHourPlan] = useState(
    planType === AVAILABILITY_PLAN_24_HOUR ? availabilityPlan : null
  );
  const [visibleForm, setVisibleForm] = useState(BOOKING_SCHEDULE_FORM_NAME);
  const [viewType, setViewType] = useState('calendar');

  const { minPrice, maxPrice } = listing.attributes.publicData;

  const handleScheduleFormChange = e => {
    setScheduleFormValues(e.values);
  };

  const handlePriceFormChange = e => {
    setPriceFormValues(e.values);
    console.log(e.values);
  };

  const handle24HourCareChange = values => {
    const currentZipcode = currentUserListing?.attributes?.publicData?.location?.zipcode;
    const timezone = zipcodeToTimezone.lookup(currentZipcode);

    setTwentyFourHourPlan({
      type: AVAILABILITY_PLAN_24_HOUR,
      timezone,
      ...values,
    });
  };

  const handleRepeatChange = values => {
    setRepeatPlan({ ...values });
  };

  const handleOneTimeChange = values => {
    setOneTimePlan({ ...values });
  };

  const handlChangeViewType = () => {
    setViewType(currentView => (currentView === CALENDAR_VIEW ? LIST_VIEW : CALENDAR_VIEW));
  };

  const handleBook = () => {
    let plan = null;

    switch (scheduleFormValues.planType) {
      case AVAILABILITY_PLAN_ONE_TIME:
        plan = oneTimePlan;
        break;
      case AVAILABILITY_PLAN_REPEAT:
        plan = repeatPlan;
        break;
      case AVAILABILITY_PLAN_24_HOUR:
        plan = twentyFourHourPlan;
        break;
      default:
        break;
    }

    const initialValues = {
      listing,
      bookingStartTime: new Date().getTime(),
      bookingEndTime: new Date().getTime() + 360000000,
      bookingData: {
        price: priceFormValues.price,
        units: calculateHoursFromPlan(plan),
        unitType: 'line-item/hour',
        planType: scheduleFormValues.planType,
      },
    };

    onBookNow(initialValues);
  };

  const scheduleTypeOptions = findOptionsForSelectFilter('scheduleType', config.custom.filters);

  const scheduleFormInitialValues = {
    planType,
  };

  const [scheduleFormValues, setScheduleFormValues] = useState(scheduleFormInitialValues);
  const [priceFormValues, setPriceFormValues] = useState({});

  let defaultAvailabilityPlan = null;
  let formAvailabilityPlan = null;

  switch (scheduleFormValues?.planType) {
    case AVAILABILITY_PLAN_ONE_TIME:
      break;
    case AVAILABILITY_PLAN_REPEAT:
      break;
    case AVAILABILITY_PLAN_24_HOUR:
      defaultAvailabilityPlan = {
        type: AVAILABILITY_PLAN_24_HOUR,
        availableDays: [],
        liveIn: false,
        timezone: defaultTimeZone(),
      };
      formAvailabilityPlan =
        availabilityPlan?.type === AVAILABILITY_PLAN_24_HOUR
          ? availabilityPlan
          : defaultAvailabilityPlan;
      break;
    default:
      break;
  }

  return (
    <div className={classes}>
      {visibleForm === BOOKING_SCHEDULE_FORM_NAME ? (
        <BookingScheduleForm
          onSubmit={() => setVisibleForm(BOOKING_PRICE_FORM_NAME)}
          minimumAmount={minPrice}
          initialValues={scheduleFormInitialValues}
          onChange={handleScheduleFormChange}
          scheduleTypeOptions={scheduleTypeOptions}
        >
          <div className={css.planDisplay}>
            {scheduleFormValues?.planType === AVAILABILITY_PLAN_ONE_TIME && (
              <ViewOneTime
                availabilityPlan={oneTimePlan}
                currentUserListing={currentUserListing}
                onManageDisableScrolling={onManageDisableScrolling}
                onChange={handleOneTimeChange}
                viewType={viewType}
                onChangeViewType={handlChangeViewType}
              />
            )}
            {scheduleFormValues?.planType === AVAILABILITY_PLAN_REPEAT && (
              <ViewRepeat
                availabilityPlan={repeatPlan}
                currentUserListing={currentUserListing}
                onManageDisableScrolling={onManageDisableScrolling}
                onChange={handleRepeatChange}
                viewType={viewType}
                onChangeViewType={handlChangeViewType}
              />
            )}
            {scheduleFormValues?.planType === AVAILABILITY_PLAN_24_HOUR && (
              <View24Hour
                availabilityPlan={twentyFourHourPlan}
                currentUserListing={currentUserListing}
                onManageDisableScrolling={onManageDisableScrolling}
                onChange={handle24HourCareChange}
                viewType={viewType}
                onChangeViewType={handlChangeViewType}
              />
            )}
          </div>
        </BookingScheduleForm>
      ) : (
        <>
          <Button
            onClick={() => setVisibleForm(BOOKING_SCHEDULE_FORM_NAME)}
            rootClassName={css.goBackButton}
            title="Go Back to schedule"
          >
            <IconArrowHead rootClassName={css.arrowIcon} direction="left" size="small" />
            <span className={css.goBackText}>Go back to schedule</span>
          </Button>
          <BookingPriceForm
            onSubmit={() => {}}
            minimumAmount={minPrice}
            onChange={handlePriceFormChange}
            availabilityPlan={twentyFourHourPlan}
          />
        </>
      )}
    </div>
  );
};

export default BookingContainer;
