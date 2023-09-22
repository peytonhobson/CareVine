import React, { useState } from 'react';

import { Avatar, NamedLink } from '..';
import { convertTimeFrom12to24 } from '../../util/data';
import MuiTablePagination from '@mui/material/TablePagination';
import { v4 as uuidv4 } from 'uuid';
import { useCheckMobileScreen } from '../../util/hooks';
import { styled } from '@mui/material/styles';
import { compose } from 'redux';
import { injectIntl } from 'react-intl';
import moment from 'moment';
import { WEEKDAYS, FULL_WEEKDAY_MAP } from '../../util/constants';

import css from './BookingCards.module.css';

const calculateBookingDayHours = (bookingStart, bookingEnd) => {
  if (!bookingStart || !bookingEnd) return 0;

  const start = convertTimeFrom12to24(bookingStart).split(':')[0];
  const end = bookingEnd === '12:00am' ? 24 : convertTimeFrom12to24(bookingEnd).split(':')[0];

  return end - start;
};

const DraftBookingCard = props => {
  const [bookingTimesPage, setBookingTimesPage] = useState(0);

  const { draft } = props;

  const draftId = draft.id;
  const {
    providerDisplayName,
    scheduleType,
    startDate,
    endDate,
    bookingSchedule = [],
    dateTimes,
    providerDefaultAvatar,
    providerProfileImage,
    listingId,
  } = draft.attributes;
  const dateTimesKeys = dateTimes ? Object.keys(dateTimes) : [];

  if (!Array.isArray(bookingSchedule)) {
    return <div></div>;
  }

  const handleChangeTimesPage = (e, page) => {
    setBookingTimesPage(page);
  };

  const splitName = providerDisplayName?.split(' ');
  const provider = {
    profileImage: providerProfileImage,
    attributes: {
      profile: {
        displayName: providerDisplayName,
        abbreviatedName: splitName ? `${splitName[0].charAt(0)}${splitName[1].charAt(0)}` : null,
        publicData: {
          defaultAvatar: providerDefaultAvatar,
        },
      },
    },
  };
  const listing = {
    id: {
      uuid: listingId,
    },
  };

  const isMobile = useCheckMobileScreen();

  const timesToDisplay = isMobile ? 2 : 4;

  const TablePagination = styled(MuiTablePagination)`
    ${isMobile
      ? `& .MuiTablePagination-toolbar {
      padding-left: 1rem;
    }

    & .MuiTablePagination-actions {
      margin-left: 0;
    }`
      : ''}
  `;

  const previewTimeCount =
    scheduleType === 'recurring' ? bookingSchedule?.length : dateTimesKeys?.length;

  let timeTitle = null;

  if (scheduleType === 'recurring' && bookingSchedule?.length) {
    timeTitle = 'Weekly Schedule';
  } else if (scheduleType === 'oneTime' && dateTimesKeys?.length) {
    timeTitle = 'Dates & Times';
  }

  return (
    <div className={css.bookingCard}>
      <div className={css.header}>
        <div className={css.bookingTitle}>
          <Avatar user={provider} listing={listing} className={css.avatar} />
          <div>
            <h2 style={{ margin: 0 }}>Booking with </h2>
            <h2 style={{ margin: 0 }}>{providerDisplayName}</h2>
          </div>
        </div>
        <div className={css.changeButtonsContainer}>
          <NamedLink
            className={css.continueButton}
            name="CheckoutPage"
            params={{ id: listing?.id.uuid, slug: 'title', draftId }}
          >
            Continue
          </NamedLink>
        </div>
      </div>
      <div className={css.body}>
        <div className={css.dateTimesContainer}>
          {timeTitle ? <h2 className={css.datesAndTimes}>{timeTitle}</h2> : null}
          {startDate ? (
            <p class="text-primary mt-0 mb-2 text-sm">
              {moment(startDate).format('ddd, MMM DD')} -{' '}
              {endDate ? moment(endDate).format('ddd, MMM DD') : 'No End Date'}
            </p>
          ) : null}
          <div className={css.dateTimes}>
            {scheduleType === 'recurring'
              ? bookingSchedule
                  ?.slice(
                    bookingTimesPage * timesToDisplay,
                    bookingTimesPage * timesToDisplay + timesToDisplay
                  )
                  .map(b => {
                    const { startTime, endTime, dayOfWeek } = b;
                    return (
                      <div className={css.bookingTime} key={uuidv4()}>
                        <h3 className={css.summaryDate}>{FULL_WEEKDAY_MAP[dayOfWeek]}</h3>
                        <span className={css.summaryTimes}>
                          {startTime} - {endTime}
                        </span>
                        <p className={css.tinyNoMargin}>
                          ({calculateBookingDayHours(startTime, endTime)} hours)
                        </p>
                      </div>
                    );
                  })
              : dateTimesKeys
                  ?.slice(
                    bookingTimesPage * timesToDisplay,
                    bookingTimesPage * timesToDisplay + timesToDisplay
                  )
                  .map(timeKey => {
                    const { startTime, endTime } = dateTimes[timeKey];
                    return (
                      <div className={css.bookingTime} key={uuidv4()}>
                        <h3 className={css.summaryDate}>{timeKey}</h3>
                        <span className={css.summaryTimes}>
                          {startTime} - {endTime}
                        </span>
                        <p className={css.tinyNoMargin}>
                          ({calculateBookingDayHours(startTime, endTime)} hours)
                        </p>
                      </div>
                    );
                  })}
          </div>
          <div className={css.tablePagination}>
            {previewTimeCount > timesToDisplay ? (
              <TablePagination
                component="div"
                count={previewTimeCount}
                page={bookingTimesPage}
                onPageChange={handleChangeTimesPage}
                rowsPerPage={timesToDisplay}
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}${isMobile ? '' : `-${to}`} of ${count}`
                }
                labelRowsPerPage=""
                rowsPerPageOptions={[]}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default compose(injectIntl)(DraftBookingCard);
