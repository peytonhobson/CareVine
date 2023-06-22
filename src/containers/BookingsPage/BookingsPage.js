import React, { useMemo } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import {
  TRANSITION_COMPLETE,
  TRANSITION_PAY_CAREGIVER_AFTER_COMPLETION,
  TRANSITION_DISPUTE,
  TRANSITION_DISPUTE_RESOLVED,
  TRANSITION_REVIEW_BY_CUSTOMER,
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
} from '../../components';
import { TopbarContainer } from '../../containers';
import { ensureCurrentUser } from '../../util/data';
import { EMPLOYER } from '../../util/constants';
import { cancelBooking, disputeBooking } from './BookingsPage.duck';

import css from './BookingsPage.module.css';

const pastBookingTransitions = [
  TRANSITION_COMPLETE,
  TRANSITION_PAY_CAREGIVER_AFTER_COMPLETION,
  TRANSITION_DISPUTE,
  TRANSITION_DISPUTE_RESOLVED,
  TRANSITION_REVIEW_BY_CUSTOMER,
  TRANSITION_EXPIRE_REVIEW_PERIOD,
];

const findStartAndEndDateFromLineItems = lineItems => {
  const start = lineItems?.reduce((min, li) => {
    return new Date(li.date) < min ? new Date(li.date) : min;
  }, new Date(lineItems[0].date));

  const end = lineItems?.reduce((max, li) => {
    return new Date(li.date) > max ? new Date(li.date) : max;
  }, new Date(lineItems[0].date));

  return { start, end };
};

const BookingsPage = props => {
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

  const activeBookings = useMemo(() => {
    return bookings.filter(booking => {
      const { start, end } = findStartAndEndDateFromLineItems(
        booking.attributes.metadata.lineItems
      );

      return (
        booking.attributes.lastTransition === TRANSITION_ACCEPT_BOOKING &&
        end > new Date() &&
        start < new Date()
      );
    });
  }, [bookings]);

  const upcomingBookings = useMemo(() => {
    return bookings.filter(booking => {
      const { start, end } = findStartAndEndDateFromLineItems(
        booking.attributes.metadata.lineItems
      );

      return booking.attributes.lastTransition === TRANSITION_ACCEPT_BOOKING && start > new Date();
    });
  }, [bookings]);

  const pastBookings = useMemo(() => {
    return bookings.filter(booking =>
      pastBookingTransitions.includes(booking.attributes.lastTransition)
    );
  }, [bookings]);

  const requestedBookings = useMemo(() => {
    return bookings.filter(
      booking => booking.attributes.lastTransition === TRANSITION_REQUEST_BOOKING
    );
  }, [bookings]);

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
            {activeBookings.length > 0 ? (
              <section className={css.cardSection}>
                <h2 className={css.subHeading}>Active</h2>
                {activeBookings.map(b => (
                  <CardComponent {...cardProps} key={b.id.uuid} booking={b} />
                ))}
              </section>
            ) : null}
            {upcomingBookings.length > 0 ? (
              <section className={css.cardSection}>
                <h2 className={css.subHeading}>Upcoming</h2>
                <div className={css.cards}>
                  {upcomingBookings.map(b => (
                    <CardComponent {...cardProps} key={b.id.uuid} booking={b} />
                  ))}
                </div>
              </section>
            ) : null}
            {pastBookings.length > 0 ? (
              <section className={css.cardSection}>
                <h2 className={css.subHeading}>Past</h2>
                <div className={css.cards}>
                  {pastBookings.map(b => (
                    <CardComponent {...cardProps} key={b.id.uuid} booking={b} />
                  ))}
                </div>
              </section>
            ) : null}
            {requestedBookings.length > 0 ? (
              <section className={css.cardSection}>
                <h2 className={css.subHeading}>Requested</h2>
                <div className={css.cards}>
                  {requestedBookings.map(b => (
                    <CardComponent {...cardProps} key={b.id.uuid} booking={b} />
                  ))}
                </div>
              </section>
            ) : null}
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
