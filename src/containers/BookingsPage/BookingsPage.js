import React, { useState } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
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
  cancelBookingSuccess,
  declineBooking,
  disputeBooking,
  fetchBookings,
  setInitialState,
} from './BookingsPage.duck';

import css from './BookingsPage.module.css';

const BookingsPage = props => {
  const [selectedTab, setSelectedTab] = useState('Requests');

  const {
    bookings,
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
  } = props;

  const currentUser = ensureCurrentUser(user);
  const userType = currentUser.attributes.profile.metadata.userType;
  const CardComponent = userType === EMPLOYER ? EmployerBookingCard : CaregiverBookingCard;

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
  };

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
                  <CardComponent {...cardProps} key={b.id.uuid} booking={b} />
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
  const { currentUser } = state.user;

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
};

export default compose(connect(mapStateToProps, mapDispatchToProps))(BookingsPage);
