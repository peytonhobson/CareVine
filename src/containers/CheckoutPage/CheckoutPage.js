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

import {
  initiateOrder,
  setStateValues,
  stripeCustomer,
  setInitialValues,
} from './CheckoutPage.duck';
import { storeData, storedData } from './CheckoutPageSessionHelpers';
import {
  formatDateTimeValues,
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
      selectedBookingTimes: [],
      selectedPaymentMethod: null,
      showConfirmation: false,
      showBookingSummary: false,
    };
    this.stripe = null;

    this.loadInitialData = this.loadInitialData.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleEditBookingFormChange = this.handleEditBookingFormChange.bind(this);
  }

  componentDidMount() {
    if (window) {
      this.loadInitialData();
    }
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

  /**
   * Load initial data for the page
   *
   * Since the data for the checkout is not passed in the URL (there
   * might be lots of options in the future), we must pass in the data
   * some other way. Currently the ListingPage sets the initial data
   * for the CheckoutPage's Redux store.
   *
   * For some cases (e.g. a refresh in the CheckoutPage), the Redux
   * store is empty. To handle that case, we store the received data
   * to window.sessionStorage and read it from there if no props from
   * the store exist.
   *
   * This function also sets of fetching the speculative transaction
   * based on this initial data.
   */
  loadInitialData() {
    const {
      bookingRate,
      bookingDates = [],
      listing,
      scheduleType,
      startDate,
      endDate,
      weekdays,
      dateTimes,
      transaction,
      exceptions,
      history,
    } = this.props;

    // Browser's back navigation should not rewrite data in session store.
    // Action is 'POP' on both history.back() and page refresh cases.
    // Action is 'PUSH' when user has directed through a link
    // Action is 'REPLACE' when user has directed through login/signup process
    const hasNavigatedThroughLink = history.action === 'PUSH' || history.action === 'REPLACE';

    const hasDataInProps = !!(bookingRate && listing && scheduleType) && hasNavigatedThroughLink;
    if (hasDataInProps) {
      // Store data only if data is passed through props and user has navigated through a link.
      storeData({
        bookingRate,
        bookingDates,
        listing,
        transaction,
        scheduleType,
        startDate,
        endDate,
        weekdays,
        dateTimes,
        exceptions,
        storageKey: STORAGE_KEY,
      });
    }

    // NOTE: stored data can be empty if user has already successfully completed transaction.
    const pageData = hasDataInProps
      ? {
          bookingRate,
          bookingDates,
          listing,
          transaction,
          scheduleType,
          startDate,
          endDate,
          weekdays,
          dateTimes,
          exceptions,
        }
      : storedData(STORAGE_KEY);

    this.setState({ pageData: pageData || {}, dataLoaded: true });
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
    } = values;

    const weekdays = findWeekdays(values);

    const startDate = moment(startDateDate?.date)
      .startOf('day')
      .toDate();
    const endDate = moment(endDateDate?.date)
      .startOf('day')
      .toDate();
    const bookingRate = bookingRateArr[0];
    const { onInitiateOrder, currentUserListing, currentUser, listing } = this.props;

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
            this.state.selectedPaymentMethod.type
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
    };

    onInitiateOrder(orderParams, metadata, listing, listing.author.id.uuid);
  }

  handleEditBookingFormChange = e => {
    const { dateTimes } = e.values;

    this.setState({
      selectedBookingTimes: formatDateTimeValues(dateTimes || {}),
    });
  };

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
      onSetState,
      defaultPaymentFetched,
      defaultPaymentMethods,
      fetchDefaultPaymentError,
      fetchDefaultPaymentInProgress,
    } = this.props;

    const isLoading = !this.state.dataLoaded;

    const {
      listing,
      bookingDates = [],
      bookingRate,
      transaction,
      scheduleType,
      startDate,
      endDate,
      weekdays,
      dateTimes,
      exceptions,
    } = this.state.pageData;
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

    const isOwnListing = currentAuthor?.id?.uuid === currentUser?.id?.uuid;

    const hasRequiredData = !!(currentListing.id && currentAuthor.id);
    const canShowPage = hasRequiredData && !isOwnListing;
    const shouldRedirect = !isLoading && !canShowPage;

    // Redirect back to ListingPage if data is missing.
    // Redirection must happen before any data format error is thrown (e.g. wrong currency)
    if (shouldRedirect) {
      // eslint-disable-next-line no-console
      console.error('Missing or invalid data for checkout, redirecting back to listing page.', {
        listing,
      });
      return <NamedRedirect name="ListingPage" params={params} />;
    }

    const monthYearBookingDates = bookingDates.map(bookingDate => {
      const month = new Date(bookingDate).getMonth() + 1;
      const day = new Date(bookingDate).getDate();

      return `${month}/${day}`;
    });

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

    const showPaymentForm = !!(currentUser && hasRequiredData && currentListing);

    return (
      <Page {...pageProps}>
        {topbar}
        <div className={css.contentContainer}>
          <EditBookingForm
            className={css.editBookingForm}
            listing={currentListing}
            onSubmit={this.handleSubmit}
            onChange={this.handleEditBookingFormChange}
            monthYearBookingDates={monthYearBookingDates}
            monthlyTimeSlots={monthlyTimeSlots}
            onManageDisableScrolling={onManageDisableScrolling}
            bookingDates={bookingDates.map(bookingDate => new Date(bookingDate))}
            onSetState={onSetState}
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
            initialValues={{ scheduleType, startDate, endDate, ...weekdays, dateTimes, exceptions }}
            storeData={storeData}
          />
        </div>
      </Page>
    );
  }
}

const mapStateToProps = state => {
  const { monthlyTimeSlots } = state.ListingPage;
  const {
    listing,
    bookingRate,
    bookingDates,
    stripeCustomerFetched,
    transaction,
    initiateOrderError,
    initiateOrderInProgress,
    startDate,
    endDate,
    scheduleType,
    weekdays,
    dateTimes,
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
    bookingRate,
    bookingDates,
    transaction,
    listing,
    initiateOrderError,
    initiateOrderInProgress,
    monthlyTimeSlots,
    defaultPaymentFetched,
    defaultPaymentMethods,
    fetchDefaultPaymentError,
    fetchDefaultPaymentInProgress,
    currentUserListing,
    startDate,
    endDate,
    scheduleType,
    weekdays,
    dateTimes,
  };
};

const mapDispatchToProps = dispatch => ({
  fetchStripeCustomer: () => dispatch(stripeCustomer()),
  onInitiateOrder: (params, metadata, listing) =>
    dispatch(initiateOrder(params, metadata, listing)),
  onSavePaymentMethod: (stripeCustomer, stripePaymentMethodId) =>
    dispatch(createCreditCard(stripeCustomer, stripePaymentMethodId)),
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
  onSetState: values => dispatch(setStateValues(values)),
});

const CheckoutPage = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(CheckoutPageComponent);

CheckoutPage.setInitialValues = (initialValues, saveToSessionStorage = false) => {
  if (saveToSessionStorage) {
    const {
      listing,
      bookingRate,
      bookingDates,
      scheduleType,
      startDate,
      endDate,
      weekdays,
    } = initialValues;
    storeData({
      bookingRate,
      bookingDates,
      listing,
      scheduleType,
      startDate,
      endDate,
      weekdays,
      storageKey: STORAGE_KEY,
    });
  }

  return setInitialValues(initialValues);
};

CheckoutPage.displayName = 'CheckoutPage';

export default CheckoutPage;
