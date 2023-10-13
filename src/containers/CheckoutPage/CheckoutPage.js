import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from '../../util/reactIntl';
import { withRouter } from 'react-router-dom';
import { calculateProcessingFee, ensureListing, ensureUser } from '../../util/data';
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
import css from './CheckoutPage.module.css';
import { convertTimeFrom12to24 } from '../../util/data';
import moment from 'moment';
import { BOOKING_FEE_PERCENTAGE } from '../../util/constants';

const STORAGE_KEY = 'CheckoutPage';
const BANK_ACCOUNT = 'Bank Account';
const CREDIT_CARD = 'Payment Card';

const formatDateTimeValues = dateTimes =>
  Object.keys(dateTimes).map(key => {
    const startTime = dateTimes[key].startTime;
    const endTime = dateTimes[key].endTime;

    return {
      startTime,
      endTime,
      date: key,
    };
  });

const findStartTimeFromBookingTimes = bookingTimes => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const dateBookingTimes = formatDateTimeValues(bookingTimes).map(bookingTime => {
    const split = bookingTime.date.split('/');
    const date = new Date(
      split[0] - 1 < currentMonth ? currentYear + 1 : currentYear,
      split[0] - 1,
      split[1]
    );
    return { date, startTime: bookingTime.startTime, endTime: bookingTime.endTime };
  });
  const sortedBookingTimes = dateBookingTimes.sort((a, b) => {
    return a.date - b.date;
  });

  const firstDay = sortedBookingTimes[0];
  const additionalTime = parseInt(convertTimeFrom12to24(firstDay.startTime).split(':')[0], 10);
  const startTime = moment(sortedBookingTimes[0].date)
    .add(additionalTime, 'hours')
    .toDate();

  return startTime;
};

const calculateTimeBetween = (bookingStart, bookingEnd) => {
  const start = convertTimeFrom12to24(bookingStart).split(':')[0];
  const end = bookingEnd === '12:00am' ? 24 : convertTimeFrom12to24(bookingEnd).split(':')[0];

  return end - start;
};

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
    const { bookingRate, bookingDates, listing, transaction, history } = this.props;

    // Browser's back navigation should not rewrite data in session store.
    // Action is 'POP' on both history.back() and page refresh cases.
    // Action is 'PUSH' when user has directed through a link
    // Action is 'REPLACE' when user has directed through login/signup process
    const hasNavigatedThroughLink = history.action === 'PUSH' || history.action === 'REPLACE';

    const hasDataInProps = !!(bookingRate && bookingDates && listing) && hasNavigatedThroughLink;
    if (hasDataInProps) {
      // Store data only if data is passed through props and user has navigated through a link.
      storeData(bookingRate, bookingDates, listing, transaction, STORAGE_KEY);
    }

    // NOTE: stored data can be empty if user has already successfully completed transaction.
    const pageData = hasDataInProps
      ? { bookingRate, bookingDates, listing, transaction }
      : storedData(STORAGE_KEY);

    // Check if a booking is already created according to stored data.
    const tx = pageData ? pageData.transaction : null;
    const isBookingCreated = tx && tx.booking && tx.booking.id;

    this.setState({ pageData: pageData || {}, dataLoaded: true });
  }

  handleSubmit(values) {
    const { dateTimes: bookingTimes, message } = values;
    const {
      bookingDates: bookingDatesProps,
      bookingRate: bookingRateProps,
      onInitiateOrder,
      listing: listingProps,
      currentUserListing,
      currentUser,
    } = this.props;

    const {
      listing: listingState,
      bookingRate: bookingRateState,
      bookingDates: bookingDatesState,
    } = this.state.pageData;

    const listing = listingProps || listingState;
    const bookingRate = bookingRateProps || bookingRateState;
    const bookingDates = bookingDatesProps || bookingDatesState;

    const paymentMethodId = this.state.selectedPaymentMethod?.id;

    const listingId = listing.id;

    const bookingStart = findStartTimeFromBookingTimes(bookingTimes);
    const bookingEnd = moment(bookingStart)
      .add(1, 'hours')
      .toDate();
    const orderParams = {
      listingId,
      seats: 1,
      bookingStart,
      bookingEnd,
    };

    const lineItems = formatDateTimeValues(bookingTimes).map(booking => {
      const { startTime, endTime, date } = booking;

      const hours = calculateTimeBetween(startTime, endTime);
      const amount = parseFloat(hours * bookingRate).toFixed(2);
      const isoDate = bookingDates
        .find(d => `${d.getMonth() + 1}/${d.getDate()}` === date)
        ?.toISOString();

      return {
        code: 'line-item/booking',
        startTime,
        endTime,
        seats: 1,
        date: isoDate,
        shortDate: moment(isoDate).format('MM/DD'),
        hours,
        amount,
        bookingFee: parseFloat(amount * BOOKING_FEE_PERCENTAGE).toFixed(2),
      };
    });

    const payout = lineItems.reduce((acc, item) => acc + parseFloat(item.amount), 0);

    const bookingFee = parseFloat(payout * BOOKING_FEE_PERCENTAGE).toFixed(2);
    const currentUserListingTitle = currentUserListing?.attributes.title;
    const currentUserListingCity = currentUserListing?.attributes.publicData.location.city;
    const processingFee = calculateProcessingFee(
      payout,
      bookingFee,
      this.state.selectedPaymentMethod.type === 'card' ? CREDIT_CARD : BANK_ACCOUNT
    );

    const metadata = {
      lineItems,
      bookingRate,
      paymentMethodId,
      paymentMethodType: this.state.selectedPaymentMethod.type,
      bookingFee,
      processingFee,
      message,
      senderListingTitle: currentUserListingTitle,
      senderCity: currentUserListingCity,
      senderListingDescription: currentUserListing?.attributes.description,
      stripeCustomerId: currentUser.stripeCustomer.attributes.stripeCustomerId,
      clientEmail: currentUser.attributes.email,
      stripeAccountId: listing.author.attributes.profile.metadata.stripeAccountId,
      totalPayment: parseFloat(Number(bookingFee) + Number(processingFee) + Number(payout)).toFixed(
        2
      ),
      payout: parseFloat(payout).toFixed(2),
      providerName: listing.author.attributes.profile.displayName,
    };

    onInitiateOrder(orderParams, metadata, listing, listing.author.id.uuid);
  }

  handleEditBookingFormChange = e => {
    const { dateTimes = {} } = e.values;

    this.setState({
      selectedBookingTimes: formatDateTimeValues(dateTimes),
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

    const { listing, bookingDates, bookingRate, transaction } = this.state.pageData;
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

    const hasListingAndAuthor = !!(currentListing.id && currentAuthor.id);
    const hasRequiredData = hasListingAndAuthor;
    const canShowPage = hasRequiredData && !isOwnListing;
    const shouldRedirect = !isLoading && !canShowPage;

    // Redirect back to ListingPage if data is missing.
    // Redirection must happen before any data format error is thrown (e.g. wrong currency)
    if (shouldRedirect) {
      // eslint-disable-next-line no-console
      console.error('Missing or invalid data for checkout, redirecting back to listing page.', {
        bookingDates,
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
    const { listing, bookingRate, bookingDates } = initialValues;
    storeData(bookingRate, bookingDates, listing, null, STORAGE_KEY);
  }

  return setInitialValues(initialValues);
};

CheckoutPage.displayName = 'CheckoutPage';

export default CheckoutPage;
