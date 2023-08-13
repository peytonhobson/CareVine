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
  EmployerBookingCard,
  CaregiverBookingCard,
  ButtonTabNavHorizontal,
  DraftBookingCard,
} from '../../components';
import { TopbarContainer } from '../../containers';
import { ensureCurrentUser } from '../../util/data';
import { EMPLOYER } from '../../util/constants';
import {
  cancelBooking,
  declineBooking,
  disputeBooking,
  fetchBookings,
  setInitialState,
  removeDrafts,
} from './BookingsPage.duck';
import { acceptBooking } from '../../ducks/transactions.duck';
import { fetchCurrentUserHasListings } from '../../ducks/user.duck';
import qs from 'qs';

import css from './BookingsPage.module.css';

const sortDrafts = (a, b) => {
  const aDate = new Date(a.createdAt);
  const bDate = new Date(b.createdAt);

  return bDate - aDate;
};

const BookingsPage = props => {
  const [selectedTab, setSelectedTab] = useState('Drafts');
  const [initialBookingsFetched, setInitialBookingsFetched] = useState(false);

  const {
    bookings,
    // TODO: Still need to implement these
    fetchBookingsError,
    fetchBookingsInProgress,
    currentUser: user,
    scrollingDisabled,
    onManageDisableScrolling,
    cancelBookingInProgress,
    cancelBookingError,
    cancelBookingSuccess,
    onCancelBooking,
    disputeBookingInProgress,
    disputeBookingError,
    disputeBookingSuccess,
    onDisputeBooking,
    acceptBookingError,
    acceptBookingInProgress,
    acceptBookingSuccess,
    declineBookingError,
    declineBookingInProgress,
    declineBookingSuccess,
    onAcceptBooking,
    onDeclineBooking,
    onFetchBookings,
    onResetInitialState,
    currentUserListing,
    onFetchCurrentUserListing,
    history,
    onRemoveDrafts,
  } = props;

  const currentUser = ensureCurrentUser(user);
  const userType = currentUser.attributes.profile.metadata.userType;
  const CardComponent = userType === EMPLOYER ? EmployerBookingCard : CaregiverBookingCard;
  const bookedDates = currentUserListing?.attributes.metadata.bookedDates;
  const totalBookings = bookings?.requests.length + bookings?.bookings.length;
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
    if (searchString?.tab) {
      setSelectedTab(searchString.tab);
    }

    if (searchString?.bookingId && initialBookingsFetched) {
      const element = document.getElementById(searchString.bookingId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [searchString?.tab, searchString?.bookingId, initialBookingsFetched]);

  useEffect(() => {
    if (!initialBookingsFetched && totalBookings > 0) {
      setInitialBookingsFetched(true);
    }
  }, [totalBookings]);

  const cardProps = {
    currentUser,
    onManageDisableScrolling,
    cancelBookingInProgress,
    cancelBookingError,
    cancelBookingSuccess,
    onCancelBooking,
    disputeBookingInProgress,
    disputeBookingError,
    disputeBookingSuccess,
    onDisputeBooking,
    acceptBookingError,
    acceptBookingInProgress,
    acceptBookingSuccess,
    declineBookingError,
    declineBookingInProgress,
    declineBookingSuccess,
    onAcceptBooking,
    onDeclineBooking,
    onFetchBookings,
    onResetInitialState,
    bookedDates,
    onFetchCurrentUserListing,
  };

  const draftTabMaybe =
    userType === EMPLOYER
      ? [
          {
            text: 'Drafts',
            selected: 'Drafts' === selectedTab,
            onClick: () => setSelectedTab('Drafts'),
          },
        ]
      : [];

  const tabs = [
    ...draftTabMaybe,
    {
      text: 'Requests',
      selected: 'Requests' === selectedTab,
      onClick: () => setSelectedTab('Requests'),
    },
    {
      text: 'Bookings',
      selected: 'Bookings' === selectedTab,
      onClick: () => setSelectedTab('Bookings'),
    },
  ];

  let cardSection = null;
  switch (selectedTab) {
    case 'Drafts':
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
    case 'Requests':
      cardSection =
        bookings.requests.length > 0 ? (
          bookings.requests.map(b => (
            <span id={b.id.uuid} key={draft.id}>
              <CardComponent {...cardProps} booking={b} />
            </span>
          ))
        ) : (
          <h2>No Requested Bookings</h2>
        );
      break;
    case 'Bookings':
      cardSection =
        bookings.bookings.length > 0 ? (
          bookings.bookings.map(b => (
            <span id={b.id.uuid} style={{ display: 'flex' }} key={draft.id}>
              <CardComponent {...cardProps} booking={b} />
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

            <section className={css.cardSection}>{cardSection}</section>
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
    cancelBookingInProgress,
    cancelBookingError,
    cancelBookingSuccess,
    disputeBookingInProgress,
    disputeBookingError,
    disputeBookingSuccess,
    declineBookingError,
    declineBookingInProgress,
    declineBookingSuccess,
  } = state.BookingsPage;
  const { currentUser, currentUserListing } = state.user;

  const { acceptBookingError, acceptBookingInProgress, acceptBookingSuccess } = state.transactions;

  return {
    fetchBookingsInProgress,
    fetchBookingsError,
    bookings,
    currentUser,
    scrollingDisabled: isScrollingDisabled(state),
    cancelBookingInProgress,
    cancelBookingError,
    cancelBookingSuccess,
    disputeBookingInProgress,
    disputeBookingError,
    disputeBookingSuccess,
    acceptBookingError,
    acceptBookingInProgress,
    acceptBookingSuccess,
    declineBookingError,
    declineBookingInProgress,
    declineBookingSuccess,
    currentUserListing,
  };
};

const mapDispatchToProps = {
  onManageDisableScrolling: manageDisableScrolling,
  onCancelBooking: cancelBooking,
  onDisputeBooking: disputeBooking,
  onAcceptBooking: acceptBooking,
  onDeclineBooking: declineBooking,
  onFetchBookings: fetchBookings,
  onResetInitialState: setInitialState,
  onFetchCurrentUserListing: fetchCurrentUserHasListings,
  onRemoveDrafts: removeDrafts,
};

export default compose(withRouter, connect(mapStateToProps, mapDispatchToProps))(BookingsPage);
