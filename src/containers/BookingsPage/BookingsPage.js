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
  DraftBookingCard,
  IconSpinner,
} from '../../components';
import { TopbarContainer } from '../../containers';
import { ensureCurrentUser } from '../../util/data';
import { CAREGIVER, EMPLOYER } from '../../util/constants';
import { fetchBookings, setInitialState, removeDrafts, fetchBooking } from './BookingsPage.duck';
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
} from '../../components';
import { useCheckMobileScreen } from '../../util/hooks';

import css from './BookingsPage.module.css';
import BookingCardLoading from '../../components/BookingCard/BookingCardLoading';

const sortDrafts = (a, b) => {
  const aDate = new Date(a.createdAt);
  const bDate = new Date(b.createdAt);

  return bDate - aDate;
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
  } = props;

  const isMobile = useCheckMobileScreen();

  const selectedTab = params?.tab || 'requests';

  const currentUser = ensureCurrentUser(user);
  const userType = currentUser.attributes.profile.metadata.userType;
  const bookingDrafts = currentUser?.attributes?.profile?.privateData?.bookingDrafts || [];

  const sortedBookingDrafts = useMemo(() => {
    return bookingDrafts.sort(sortDrafts);
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
    if (!initialBookingsFetched && bookings.length > 0) {
      setInitialBookingsFetched(true);
    }
  }, [bookings.length]);

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
        sortedBookingDrafts.length > 0 ? (
          sortedBookingDrafts.map(draft => (
            <span id={draft.id} key={draft.id}>
              <DraftBookingCard {...cardProps} draft={draft} />
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
            <ButtonTabNavHorizontal
              tabs={tabs}
              rootClassName={css.nav}
              tabRootClassName={css.tab}
              tabContentClass={css.tabContent}
              tabClassName={css.tab}
            />

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
  const { fetchBookingsInProgress, fetchBookingsError, bookings } = state.BookingsPage;
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
};

export default compose(withRouter, connect(mapStateToProps, mapDispatchToProps))(BookingsPage);
