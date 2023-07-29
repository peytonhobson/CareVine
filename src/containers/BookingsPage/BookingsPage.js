import React, { useEffect, useState } from 'react';
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
} from '../../components';
import { TopbarContainer } from '../../containers';
import { ensureCurrentUser } from '../../util/data';
import { EMPLOYER } from '../../util/constants';
import {
  acceptBooking,
  cancelBooking,
  declineBooking,
  disputeBooking,
  fetchBookings,
  setInitialState,
} from './BookingsPage.duck';
import { fetchCurrentUserHasListings } from '../../ducks/user.duck';
import qs from 'qs';

import css from './BookingsPage.module.css';

const BookingsPage = props => {
  const [selectedTab, setSelectedTab] = useState('Requests');
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
  } = props;

  const currentUser = ensureCurrentUser(user);
  const userType = currentUser.attributes.profile.metadata.userType;
  const CardComponent = userType === EMPLOYER ? EmployerBookingCard : CaregiverBookingCard;
  const bookedDates = currentUserListing?.attributes.metadata.bookedDates;
  const totalBookings =
    bookings?.requests.length +
    bookings?.upcoming.length +
    bookings?.active.length +
    bookings?.past.length;

  const searchString = qs.parse(history.location.search, {
    ignoreQueryPrefix: true,
  });

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

  console.log(bookings);

  const tabs = [
    {
      text: 'Requests',
      selected: 'Requests' === selectedTab,
      onClick: () => setSelectedTab('Requests'),
    },
    {
      text: 'Upcoming',
      selected: 'Upcoming' === selectedTab,
      onClick: () => setSelectedTab('Upcoming'),
    },
    {
      text: 'Active',
      selected: 'Active' === selectedTab,
      onClick: () => setSelectedTab('Active'),
    },
    {
      text: 'Past',
      selected: 'Past' === selectedTab,
      onClick: () => setSelectedTab('Past'),
    },
  ];

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

            {bookings[selectedTab.toLowerCase()].length > 0 ? (
              <section className={css.cardSection}>
                {bookings[selectedTab.toLowerCase()].map(b => (
                  <span id={b.id.uuid}>
                    <CardComponent {...cardProps} key={b.id.uuid} booking={b} />
                  </span>
                ))}
              </section>
            ) : (
              <h2>No {selectedTab.replace('Requests', 'Requested')} Bookings</h2>
            )}
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
    acceptBookingError,
    acceptBookingInProgress,
    acceptBookingSuccess,
    declineBookingError,
    declineBookingInProgress,
    declineBookingSuccess,
  } = state.BookingsPage;
  const { currentUser, currentUserListing } = state.user;

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
};

export default compose(withRouter, connect(mapStateToProps, mapDispatchToProps))(BookingsPage);
