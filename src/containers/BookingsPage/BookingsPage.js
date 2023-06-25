import React, { useState } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import {
  TRANSITION_COMPLETE,
  TRANSITION_PAY_CAREGIVER,
  TRANSITION_DISPUTE,
  TRANSITION_RESOLVE_DISPUTE,
  TRANSITION_REVIEW,
  TRANSITION_EXPIRE_REVIEW_PERIOD,
  TRANSITION_REQUEST_BOOKING,
  TRANSITION_ACCEPT_BOOKING,
} from '../../util/transaction';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/UI.duck';
import {
  Page,
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  LayoutWrapperFooter,
  Footer,
  EmployerBookingCard,
  ButtonTabNavHorizontal,
} from '../../components';
import { TopbarContainer } from '../../containers';
import { convertTimeFrom12to24, ensureCurrentUser } from '../../util/data';
import { EMPLOYER } from '../../util/constants';
import { cancelBooking, disputeBooking } from './BookingsPage.duck';
import moment from 'moment';
import { addTimeToStartOfDay } from '../../util/dates';

import css from './BookingsPage.module.css';

const pastBookingTransitions = [
  TRANSITION_COMPLETE,
  TRANSITION_PAY_CAREGIVER,
  TRANSITION_DISPUTE,
  TRANSITION_RESOLVE_DISPUTE,
  TRANSITION_REVIEW,
  TRANSITION_EXPIRE_REVIEW_PERIOD,
];

const findStartAndEndDateFromLineItems = lineItems => {
  if (!lineItems) return null;

  const startItem = lineItems?.reduce((min, li) => {
    return new Date(li.date) < min.date ? li : min;
  }, lineItems[0]);

  const endItem = lineItems?.reduce((max, li) => {
    return new Date(li.date) > max.date ? li : max;
  }, lineItems[0]);

  const start = addTimeToStartOfDay(startItem.date, startItem.startTime);
  const end =
    endItem.endTime === '12:00am'
      ? moment()
          .add(24, 'hours')
          .toDate()
      : addTimeToStartOfDay(endItem.date, endItem.endTime);

  return { start, end };
};

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
    onCancelBooking,
    disputeBookingInProgress,
    disputeBookingError,
    disputeBookingSuccess,
    onDisputeBooking,
  } = props;

  const currentUser = ensureCurrentUser(user);
  const userType = currentUser.attributes.profile.metadata.userType;
  const CardComponent = userType === EMPLOYER ? EmployerBookingCard : null;

  const cardProps = {
    currentUser,
    onManageDisableScrolling,
    cancelBookingInProgress,
    cancelBookingError,
    onCancelBooking,
    disputeBookingInProgress,
    disputeBookingError,
    disputeBookingSuccess,
    onDisputeBooking,
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
    disputeBookingInProgress,
    disputeBookingError,
    disputeBookingSuccess,
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
    disputeBookingInProgress,
    disputeBookingError,
    disputeBookingSuccess,
  };
};

const mapDispatchToProps = {
  onManageDisableScrolling: manageDisableScrolling,
  onCancelBooking: cancelBooking,
  onDisputeBooking: disputeBooking,
};

export default compose(connect(mapStateToProps, mapDispatchToProps))(BookingsPage);
