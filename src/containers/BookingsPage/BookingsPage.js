import React, { useEffect, useState, useMemo } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/UI.duck';
import {
  Page,
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  LayoutWrapperFooter,
  Footer,
  ButtonTabNavHorizontal,
} from '../../components';
import { TopbarContainer } from '../../containers';
import { ensureCurrentUser } from '../../util/data';
import { BOOKING_FEE_PERCENTAGE, EMPLOYER, ISO_OFFSET_FORMAT } from '../../util/constants';
import {
  fetchBookings,
  setInitialState,
  removeDrafts,
  fetchBooking,
  updateBookingFilterValue,
} from './BookingsPage.duck';
import { setInitialValues } from '../../ducks/transactions.duck';
import { fetchCurrentUserHasListings } from '../../ducks/user.duck';
import qs from 'qs';
import {
  BookingCard,
  BookingCardHeader,
  BookingCardBody,
  BookingCardDateTimes,
  BookingCardDateTimesContainer,
  BookingCardTablePagination,
  BookingCardTitle,
  BookingCardMenu,
  BookingStartEndDates,
  BookingScheduleMobile,
  FilterByMenu,
} from '../../components';
import { useCheckMobileScreen } from '../../util/hooks';
import { calculateTimeBetween } from '../../util/dates';
import { formatDateTimeValues } from '../../util/bookings';
import moment from 'moment';
import BookingCardLoading from '../../components/BookingCard/BookingCardLoading';

import css from './BookingsPage.module.css';

const FILTER_OPTIONS = [
  {
    label: 'All',
    key: 'all',
  },
  {
    label: 'Upcoming',
    key: 'upcoming',
  },
  {
    label: 'Active',
    key: 'active',
  },
  {
    label: 'Past',
    key: 'past',
  },
  {
    label: 'Canceled',
    key: 'canceled',
  },
];

const sortDrafts = (a, b) => {
  const aDate = new Date(a.createdAt);
  const bDate = new Date(b.createdAt);

  return bDate - aDate;
};

const createDraftLineItems = draft => {
  const { dateTimes: bookingTimes, bookingDates, bookingRate } = draft.attributes;

  const lineItems = formatDateTimeValues(bookingTimes).map((booking, index) => {
    const { startTime, endTime } = booking;

    const hours = calculateTimeBetween(startTime, endTime);
    const amount = parseFloat(hours * bookingRate).toFixed(2);
    const isoDate = moment(bookingDates[index])?.format(ISO_OFFSET_FORMAT);

    return {
      code: 'line-item/booking',
      startTime,
      endTime,
      date: isoDate,
      shortDay: moment(isoDate).format('ddd'),
      shortDate: moment(isoDate).format('MM/DD'),
      hours,
      amount,
      bookingFee: Number(amount * BOOKING_FEE_PERCENTAGE).toFixed(2),
    };
  });

  return lineItems;
};

const createBookingDrafts = drafts => {
  return drafts.map(draft => {
    const splitName = draft.attributes.providerDisplayName?.split(' ');

    if (draft.attributes.dateTimes) {
      draft.attributes.lineItems = createDraftLineItems(draft);
    }

    return {
      createdAt: draft.createdAt,
      id: {
        uuid: draft.id,
      },
      listing: {
        id: {
          uuid: draft.attributes.listingId,
        },
      },
      provider: {
        profileImage: draft.attributes.providerProfileImage,
        attributes: {
          profile: {
            displayName: draft.attributes.providerDisplayName,
            abbreviatedName: splitName
              ? `${splitName[0].charAt(0)}${splitName[1].charAt(0)}`
              : null,
            publicData: {
              defaultAvatar: draft.attributes.providerDefaultAvatar,
            },
          },
        },
      },
      attributes: {
        lastTransition: 'transition/draft',
        metadata: {
          ...draft.attributes,
          bookingTimes: draft.attributes.dateTimes,
        },
      },
    };
  });
};

const BookingCardComponent = props => {
  const { isMobile } = props;

  return (
    <BookingCard {...props}>
      <BookingCardHeader>
        <BookingCardTitle />
        {isMobile ? null : <BookingCardMenu />}
      </BookingCardHeader>
      {isMobile ? (
        <>
          <BookingScheduleMobile />
          <BookingCardMenu />
        </>
      ) : (
        <BookingCardBody>
          <BookingCardDateTimesContainer>
            <div className="flex flex-col">
              <BookingCardDateTimes />
              <BookingCardTablePagination />
            </div>
            <BookingStartEndDates />
          </BookingCardDateTimesContainer>
        </BookingCardBody>
      )}
    </BookingCard>
  );
};

const BookingsPage = props => {
  const [initialBookingsFetched, setInitialBookingsFetched] = useState(false);

  const {
    bookings,
    // TODO: Still need to implement these
    fetchBookingsError,
    fetchBookingsInProgress,
    currentUser: user,
    scrollingDisabled,
    onManageDisableScrolling,
    onFetchBookings,
    onResetInitialState,
    onFetchCurrentUserListing,
    history,
    onRemoveDrafts,
    onResetTransactionsInitialState,
    params,
    onFetchBooking,
    onUpdateBookingFilterValue,
  } = props;

  const isMobile = useCheckMobileScreen();

  const selectedTab = params?.tab || 'requests';

  const currentUser = ensureCurrentUser(user);
  const userType = currentUser.attributes.profile.metadata.userType;
  const bookingDrafts = currentUser?.attributes?.profile?.privateData?.bookingDrafts || [];

  const formattedBookingDrafts = useMemo(() => {
    return createBookingDrafts(bookingDrafts).sort(sortDrafts);
  }, [bookingDrafts]);

  const searchString = qs.parse(history.location.search, {
    ignoreQueryPrefix: true,
  });

  useEffect(() => {
    if (currentUser.id?.uuid) {
      onRemoveDrafts();
    }
  }, [currentUser.id?.uuid]);

  useEffect(() => {
    if (searchString?.bookingId && initialBookingsFetched) {
      const element = document.getElementById(searchString.bookingId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [searchString?.bookingId, initialBookingsFetched]);

  useEffect(() => {
    if (!initialBookingsFetched && bookings.length > 0 && !fetchBookingsInProgress) {
      setInitialBookingsFetched(true);
    }
  }, [bookings.length, fetchBookingsInProgress, initialBookingsFetched]);

  const cardProps = {
    onManageDisableScrolling,
    onFetchBookings,
    onResetInitialState,
    onFetchCurrentUserListing,
    onResetTransactionsInitialState,
    userType,
    onFetchBooking,
    currentTab: selectedTab,
    isMobile,
  };

  const handleChangeTab = tab => {
    history.push(`/bookings/${tab}`);
  };

  const handleUpdateFilter = filter => {
    onUpdateBookingFilterValue(filter);
    onFetchBookings({ tab: selectedTab, filtervalue: filter });
  };

  const draftTabMaybe =
    userType === EMPLOYER
      ? [
          {
            text: 'Drafts',
            selected: 'drafts' === selectedTab,
            onClick: () => handleChangeTab('drafts'),
          },
        ]
      : [];

  const tabs = [
    ...draftTabMaybe,
    {
      text: 'Requests',
      selected: 'requests' === selectedTab,
      onClick: () => handleChangeTab('requests'),
    },
    {
      text: 'Bookings',
      selected: 'bookings' === selectedTab,
      onClick: () => handleChangeTab('bookings'),
    },
  ];

  let cardSection = null;
  switch (selectedTab) {
    case 'drafts':
      cardSection =
        formattedBookingDrafts.length > 0 ? (
          formattedBookingDrafts.map(draft => (
            <span id={draft.id} key={draft.id.uuid}>
              <BookingCardComponent booking={draft} {...cardProps} />
            </span>
          ))
        ) : (
          <h2>No Booking Drafts</h2>
        );

      break;
    case 'requests':
      cardSection =
        bookings.length > 0 ? (
          bookings.map(b => (
            <span id={b.id.uuid} key={b.id.uuid}>
              <BookingCardComponent booking={b} {...cardProps} />
            </span>
          ))
        ) : (
          <h2>No Requested Bookings</h2>
        );
      break;
    case 'bookings':
      cardSection =
        bookings.length > 0 ? (
          bookings.map(b => (
            <span id={b.id.uuid} style={{ display: 'flex' }} key={b.id.uuid}>
              <BookingCardComponent booking={b} {...cardProps} />
            </span>
          ))
        ) : (
          <h2>No Bookings</h2>
        );
      break;
    default:
      cardSection = null;
  }

  return (
    // TODO: Update schema
    <Page
      scrollingDisabled={scrollingDisabled}
      contentType="website"
      schema={{
        '@context': 'http://schema.org',
        '@type': 'WebPage',
      }}
      title="Bookings"
    >
      <LayoutSingleColumn>
        <LayoutWrapperTopbar>
          <TopbarContainer currentPage="BookingsPage" />
        </LayoutWrapperTopbar>
        <LayoutWrapperMain>
          <div className={css.root}>
            <div className={css.container}>
              <h1 className={css.title}>Bookings</h1>
            </div>
            <div className="md:flex md:flex-row md:justify-between md:items-center">
              <ButtonTabNavHorizontal
                tabs={tabs}
                className="mr-4"
                rootClassName={css.nav}
                tabRootClassName={css.tab}
                tabContentClass={css.tabContent}
                tabClassName={css.tab}
              />
              {selectedTab === 'bookings' && (
                <FilterByMenu
                  initialValue="all"
                  options={FILTER_OPTIONS}
                  label="Filter by"
                  onSelect={handleUpdateFilter}
                  className={css.filterMenu}
                />
              )}
            </div>

            <section className={css.cardSection}>
              {fetchBookingsInProgress ? (
                <>
                  <BookingCardLoading />
                  <BookingCardLoading />
                  <BookingCardLoading />
                </>
              ) : (
                cardSection
              )}
            </section>
          </div>
        </LayoutWrapperMain>
        <LayoutWrapperFooter>
          <Footer />
        </LayoutWrapperFooter>
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  const {
    fetchBookingsInProgress,
    fetchBookingsError,
    bookings,
    bookingFilterValue,
  } = state.BookingsPage;
  const { currentUser, currentUserListing } = state.user;

  const { acceptBookingInProgress, acceptBookingSuccess } = state.transactions;

  return {
    fetchBookingsInProgress,
    fetchBookingsError,
    bookings,
    currentUser,
    scrollingDisabled: isScrollingDisabled(state),
    acceptBookingInProgress,
    acceptBookingSuccess,
    currentUserListing,
    bookingFilterValue,
  };
};

const mapDispatchToProps = {
  onManageDisableScrolling: manageDisableScrolling,
  onFetchBookings: fetchBookings,
  onResetInitialState: setInitialState,
  onResetTransactionsInitialState: setInitialValues,
  onFetchCurrentUserListing: fetchCurrentUserHasListings,
  onRemoveDrafts: removeDrafts,
  onFetchBooking: fetchBooking,
  onUpdateBookingFilterValue: updateBookingFilterValue,
};

export default compose(withRouter, connect(mapStateToProps, mapDispatchToProps))(BookingsPage);
