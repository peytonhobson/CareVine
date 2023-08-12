import React, { useState } from 'react';

import { Avatar, NamedLink } from '..';
import { convertTimeFrom12to24 } from '../../util/data';
import MuiTablePagination from '@mui/material/TablePagination';
import { useMediaQuery } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import { useCheckMobileScreen } from '../../util/hooks';
import { styled } from '@mui/material/styles';
import { compose } from 'redux';
import { injectIntl } from 'react-intl';

import css from './BookingCards.module.css';

const CREDIT_CARD = 'Payment Card';
const BANK_ACCOUNT = 'Bank Account';
const TRANSACTION_FEE = 0.05;

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
    bookingRate,
    bookingDates,
    scheduleType,
    startDate,
    endDate,
    bookingSchedule,
    dateTimes,
    exceptions,
    providerDefaultAvatar,
    providerProfileImage,
    listingId,
  } = draft.attributes;

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

  const isLarge = useMediaQuery('(min-width:1024px)');
  const isMobile = useCheckMobileScreen();

  const timesToDisplay = isMobile ? 3 : 5;

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

  let timeTitle = null;

  if (scheduleType === 'recurring') {
    timeTitle = 'Weekly Schedule';
  } else {
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
          <div className={css.dateTimes}>
            {/* {bookingTimes
              ?.slice(
                bookingTimesPage * timesToDisplay,
                bookingTimesPage * timesToDisplay + timesToDisplay
              )
              .map(({ date, startTime, endTime }) => {
                return (
                  <div className={css.bookingTime} key={uuidv4()}>
                    <h3 className={css.summaryDate}>{date}</h3>
                    <span className={css.summaryTimes}>
                      {startTime} - {endTime}
                    </span>
                    <p className={css.tinyNoMargin}>
                      ({calculateBookingDayHours(startTime, endTime)} hours)
                    </p>
                  </div>
                );
              })} */}
          </div>
          {/* <div className={css.tablePagination}>
            {bookingTimes?.length > timesToDisplay ? (
              <TablePagination
                component="div"
                count={bookingTimes?.length}
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
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default compose(injectIntl)(DraftBookingCard);
