import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from '../../util/reactIntl';
import { withRouter } from 'react-router-dom';
import { ensureListing, ensureUser } from '../../util/data';
import {
  NamedLink,
  NamedRedirect,
  Page,
  IconConfirm,
  BookingConfirmationCard,
} from '../../components';
import { EditBookingForm } from '../../forms';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/UI.duck';
import { createCreditCard } from '../../ducks/paymentMethods.duck';

import { initiateOrder, stripeCustomer, updateBookingDraft } from './CheckoutPage.duck';
import {
  findStartTimeFromBookingTimes,
  constructBookingMetadataOneTime,
  constructBookingMetadataRecurring,
  findStartTimeRecurring,
} from './CheckoutPage.helpers';
import { WEEKDAYS } from '../../util/constants';
import moment from 'moment';

import css from './CheckoutPage.module.css';

const STORAGE_KEY = 'CheckoutPage';

const findWeekdays = values =>
  WEEKDAYS.reduce((acc, key) => {
    if (values[key]) {
      return { ...acc, [key]: values[key] };
    }
    return acc;
  }, {});

export class CheckoutPageComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pageData: {},
      dataLoaded: false,
      submitting: false,
      selectedPaymentMethod: null,
      showConfirmation: false,
      showBookingSummary: false,
    };
    this.stripe = null;

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidUpdate(prevProps) {
    const {
      bookingDates: prevBookingDates,
      bookingRate: prevBookingRate,
      transaction: prevTransaction,
    } = prevProps;
    const { bookingDates, bookingRate, transaction } = this.props;

    if (bookingDates !== prevBookingDates) {
      this.setState(prevState => {
        return { pageData: { ...prevState.pageData, bookingDates } };
      });
    }

    if (bookingRate !== prevBookingRate) {
      this.setState(prevState => {
        return { pageData: { ...prevState.pageData, bookingRate } };
      });
    }

    if (!prevTransaction && transaction && !this.state.showBookingSummary) {
      this.setState(prevState => {
        return { pageData: { ...prevState.pageData, transaction } };
      });
      setTimeout(() => this.setState({ showBookingSummary: true }), 3000);
    }

    if (this.state.pageData.transaction && !transaction && !this.state.showBookingSummary) {
      this.setState({ showBookingSummary: true });
    }
  }

  handleSubmit(values) {
    const {
      dateTimes: bookingTimes,
      message,
      bookingDates,
      startDate: startDateDate,
      endDate: endDateDate,
      bookingRate: bookingRateArr,
      scheduleType,
      exceptions,
    } = values;

    const weekdays = findWeekdays(values);

    const startDate = moment(startDateDate?.date)
      .startOf('day')
      .toDate();
    const endDate = moment(endDateDate?.date)
      .startOf('day')
      .toDate();
    const bookingRate = bookingRateArr[0];
    const { onInitiateOrder, currentUserListing, currentUser } = this.props;

    const { listing } = this.state.pageData;

    const listingId = listing.id;

    const bookingStart =
      scheduleType === 'oneTime'
        ? findStartTimeFromBookingTimes(bookingTimes)
        : findStartTimeRecurring(weekdays, startDate);
    const bookingEnd = moment(bookingStart)
      .add(1, 'hours')
      .toDate();
    const orderParams = {
      listingId,
      seats: 1,
      bookingStart,
      bookingEnd,
    };

    const scheduleTypeMetadata =
      scheduleType === 'oneTime'
        ? constructBookingMetadataOneTime(
            bookingDates,
            bookingTimes,
            bookingRate,
            this.state.selectedPaymentMethod.type
          )
        : constructBookingMetadataRecurring(
            weekdays,
            startDate,
            endDate,
            bookingRate,
            this.state.selectedPaymentMethod.type,
            listing
          );

    const currentUserListingTitle = currentUserListing.attributes.title;
    const currentUserListingCity = currentUserListing.attributes.publicData.location.city;

    const metadata = {
      ...scheduleTypeMetadata,
      message,
      bookingRate,
      paymentMethodId: this.state.selectedPaymentMethod?.id,
      paymentMethodType: this.state.selectedPaymentMethod?.type,
      senderListingTitle: currentUserListingTitle,
      senderCity: currentUserListingCity,
      stripeCustomerId: currentUser.stripeCustomer.attributes.stripeCustomerId,
      clientEmail: currentUser.attributes.email,
      stripeAccountId: listing.author.attributes.profile.metadata.stripeAccountId,
      providerName: listing.author.attributes.profile.displayName,
      exceptions,
    };

    onInitiateOrder(orderParams, metadata, listing, listing.author.id.uuid);
  }

  render() {
    const {
      scrollingDisabled,
      initiateOrderError,
      initiateOrderInProgress,
      intl,
      params,
      currentUser,
      stripeCustomerFetched,
      monthlyTimeSlots,
      onManageDisableScrolling,
      defaultPaymentFetched,
      defaultPaymentMethods,
      fetchDefaultPaymentError,
      fetchDefaultPaymentInProgress,
      onUpdateBookingDraft,
      listing,
      updateBookingDraftInProgress,
    } = this.props;

    const bookingDrafts = currentUser?.attributes.profile.privateData.bookingDrafts || [];
    const bookingDraft = bookingDrafts.find(draft => draft.id === params.draftId) || {};
    const {
      bookingDates = [],
      bookingRate,
      transaction,
      scheduleType,
      startDate,
      endDate,
      bookingSchedule = {},
      dateTimes,
      exceptions = {
        addedDays: [],
        removedDays: [],
        changedDays: [],
      },
    } = bookingDraft?.attributes || {};

    const isLoading = !listing || !bookingDraft;
    const currentListing = ensureListing(listing);
    const currentAuthor = ensureUser(currentListing.author);

    const listingTitle = currentListing.attributes.title;

    const title = intl.formatMessage({ id: 'CheckoutPage.title' }, { listingTitle });

    const pageProps = { title, scrollingDisabled };
    const topbar = (
      <div className={css.topbar}>
        <NamedLink className={css.home} name="LandingPage">
          Home
        </NamedLink>
      </div>
    );

    if (isLoading) {
      return <Page {...pageProps}>{topbar}</Page>;
    }

    const authorDisplayName = currentAuthor.attributes.profile.displayName;

    if (transaction) {
      return (
        <div className={css.confirmationContainer}>
          <div className={css.confirmationSubContainer}>
            {this.state.showBookingSummary ? (
              <>
                <BookingConfirmationCard
                  authorDisplayName={authorDisplayName}
                  currentAuthor={currentAuthor}
                  transaction={transaction}
                  listing={currentListing}
                  onManageDisableScrolling={onManageDisableScrolling}
                />
                {/* TODO: Change to bookings page */}
                <NamedLink name="LandingPage" className={css.toBookings}>
                  Back to Home
                </NamedLink>
              </>
            ) : (
              <>
                <div className={css.iconContainer}>
                  <IconConfirm className={css.iconConfirm} height="10em" width="10em" />
                </div>
                <div className={css.confirmationText}>Booking Requested</div>
              </>
            )}
          </div>
        </div>
      );
    }

    const showPaymentForm = !!(currentUser && currentListing);

    return (
      <Page {...pageProps}>
        {topbar}
        <div className={css.contentContainer}>
          <EditBookingForm
            className={css.editBookingForm}
            listing={currentListing}
            onSubmit={this.handleSubmit}
            monthlyTimeSlots={monthlyTimeSlots}
            onManageDisableScrolling={onManageDisableScrolling}
            authorDisplayName={authorDisplayName}
            defaultPaymentMethods={defaultPaymentMethods}
            selectedPaymentMethod={this.state.selectedPaymentMethod}
            initiateOrderInProgress={initiateOrderInProgress}
            initiateOrderError={initiateOrderError}
            transaction={transaction}
            currentListing={currentListing}
            listingTitle={listingTitle}
            currentAuthor={currentAuthor}
            bookingRate={bookingRate}
            showPaymentForm={showPaymentForm}
            defaultPaymentFetched={defaultPaymentFetched}
            fetchDefaultPaymentError={fetchDefaultPaymentError}
            fetchDefaultPaymentInProgress={fetchDefaultPaymentInProgress}
            stripeCustomerFetched={stripeCustomerFetched}
            onChangePaymentMethod={method => this.setState({ selectedPaymentMethod: method })}
            initialValues={{
              scheduleType,
              startDate: startDate ? { date: new Date(startDate) } : null,
              endDate: endDate ? { date: new Date(endDate) } : null,
              ...bookingSchedule,
              dateTimes,
              exceptions,
              bookingDates,
              bookingRate,
            }}
            initialValuesEqual={() => true}
            onUpdateBookingDraft={params => onUpdateBookingDraft(params, bookingDraft.id)}
            updateBookingDraftInProgress={updateBookingDraftInProgress}
            keepDirtyOnReinitialize
          />
        </div>
      </Page>
    );
  }
}

const mapStateToProps = state => {
  const {
    listing,
    stripeCustomerFetched,
    transaction,
    initiateOrderError,
    initiateOrderInProgress,
    updateBookingDraftInProgress,
  } = state.CheckoutPage;
  const { currentUser, currentUserListing } = state.user;
  const {
    defaultPaymentFetched,
    defaultPaymentMethods,
    fetchDefaultPaymentError,
    fetchDefaultPaymentInProgress,
  } = state.paymentMethods;

  return {
    scrollingDisabled: isScrollingDisabled(state),
    currentUser,
    stripeCustomerFetched,
    transaction,
    listing,
    initiateOrderError,
    initiateOrderInProgress,
    defaultPaymentFetched,
    defaultPaymentMethods,
    fetchDefaultPaymentError,
    fetchDefaultPaymentInProgress,
    currentUserListing,
    updateBookingDraftInProgress,
  };
};

const mapDispatchToProps = {
  fetchStripeCustomer: stripeCustomer,
  onInitiateOrder: initiateOrder,
  onSavePaymentMethod: createCreditCard,
  onManageDisableScrolling: manageDisableScrolling,
  onUpdateBookingDraft: updateBookingDraft,
};

const CheckoutPage = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(CheckoutPageComponent);

CheckoutPage.displayName = 'CheckoutPage';

export default CheckoutPage;
