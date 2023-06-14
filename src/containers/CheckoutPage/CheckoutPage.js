import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from '../../util/reactIntl';
import { withRouter } from 'react-router-dom';
import { findRouteByRouteName } from '../../util/routes';
import { ensureListing, ensureUser } from '../../util/data';
import { NamedLink, NamedRedirect, Page } from '../../components';
import { EditBookingForm } from '../../forms';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/UI.duck';
import { createCreditCard } from '../../ducks/paymentMethods.duck';

import {
  initiateOrder,
  setStateValues,
  stripeCustomer,
  setInitialValues,
} from './CheckoutPage.duck';
import BookingSummaryCard from './BookingSummaryCard';
import { storeData, storedData } from './CheckoutPageSessionHelpers';
import css from './CheckoutPage.module.css';
import PaymentSection from './PaymentSection';

const STORAGE_KEY = 'CheckoutPage';
const BANK_ACCOUNT = 'Bank Account';
const CREDIT_CARD = 'Payment Card';

const initializeOrderPage = (initialValues, routes, dispatch) => {
  const OrderPage = findRouteByRouteName('OrderDetailsPage', routes);

  // Transaction is already created, but if the initial message
  // sending failed, we tell it to the OrderDetailsPage.
  dispatch(OrderPage.setInitialValues(initialValues));
};

export class CheckoutPageComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pageData: {},
      dataLoaded: false,
      submitting: false,
      selectedBookingTimes: [],
      selectedPaymentMethod: BANK_ACCOUNT,
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
    const { bookingDates: prevBookingDates, bookingRate: prevBookingRate } = prevProps;
    const { bookingDates, bookingRate } = this.props;

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
      history,
      currentUser,
      defaultPaymentMethods,
      listing: listingProps,
    } = this.props;

    const {
      listing: listingState,
      bookingRate: bookingRateState,
      bookingDates: bookingDatesState,
    } = this.state.pageData;

    const listing = listingProps || listingState;
    const bookingRate = bookingRateProps || bookingRateState;
    const bookingDates = bookingDatesProps || bookingDatesState;

    const stripeCustomerId = currentUser.stripeCustomer.attributes.stripeCustomerId;
    const paymentMethodId =
      this.state.selectedPaymentMethod === BANK_ACCOUNT
        ? defaultPaymentMethods.bankAccount.id
        : defaultPaymentMethods.card.id;

    const listingId = listing.id;

    const orderParams = {
      listingId,
      seats: 1,
    };

    const metadata = {
      bookingDates: bookingDates.map(b => b.toISOString()),
      bookingTimes,
      bookingRate,
      stripeCustomerId,
      paymentMethodId,
      paymentMethodType:
        this.state.selectedPaymentMethod === BANK_ACCOUNT ? 'us_bank_account' : 'card',
      applicationFee: this.state.selectedPaymentMethod === BANK_ACCOUNT ? 0.05 : 0.08,
      message,
    };

    onInitiateOrder(orderParams, metadata);
  }

  handleEditBookingFormChange = e => {
    const { dateTimes = {} } = e.values;

    const dateTimeKeys = Object.keys(dateTimes) ?? [];

    const formattedBookingTimes = dateTimeKeys.map(key => {
      const startTime = dateTimes[key].startTime;
      const endTime = dateTimes[key].endTime;

      return {
        startTime,
        endTime,
        date: key,
      };
    });

    this.setState({
      selectedBookingTimes: formattedBookingTimes,
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
      transaction,
    } = this.props;

    const isLoading = !this.state.dataLoaded;

    const { listing, bookingDates, bookingRate } = this.state.pageData;
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
    const hasRequiredData = hasListingAndAuthor && bookingDates?.length > 0;
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
      const month = bookingDate.getMonth() + 1;
      const day = bookingDate.getDate();

      return `${month}/${day}`;
    });

    const authorDisplayName = currentAuthor.attributes.profile.displayName;

    return (
      <Page {...pageProps}>
        {topbar}
        <div className={css.contentContainer}>
          <div className={css.bookListingContainer}>
            <EditBookingForm
              className={css.editBookingForm}
              listing={currentListing}
              onSubmit={this.handleSubmit}
              onChange={this.handleEditBookingFormChange}
              monthYearBookingDates={monthYearBookingDates}
              monthlyTimeSlots={monthlyTimeSlots}
              onManageDisableScrolling={onManageDisableScrolling}
              bookingDates={bookingDates}
              onSetState={onSetState}
              authorDisplayName={authorDisplayName}
              defaultPaymentMethods={defaultPaymentMethods}
              selectedPaymentMethod={this.state.selectedPaymentMethod}
              initiateOrderInProgress={initiateOrderInProgress}
              initiateOrderError={initiateOrderError}
              transaction={transaction}
            >
              <PaymentSection
                currentUser={currentUser}
                hasRequiredData={hasRequiredData}
                currentListing={currentListing}
                listingTitle={listingTitle}
                defaultPaymentFetched={defaultPaymentFetched}
                defaultPaymentMethods={defaultPaymentMethods}
                fetchDefaultPaymentError={fetchDefaultPaymentError}
                fetchDefaultPaymentInProgress={fetchDefaultPaymentInProgress}
                stripeCustomerFetched={stripeCustomerFetched}
                onChangePaymentMethod={value => this.setState({ selectedPaymentMethod: value })}
              />
              <BookingSummaryCard
                authorDisplayName={authorDisplayName}
                currentAuthor={currentAuthor}
                selectedBookingTimes={this.state.selectedBookingTimes}
                bookingRate={bookingRate}
                bookingDates={bookingDates}
                listing={currentListing}
                onManageDisableScrolling={onManageDisableScrolling}
                onSetState={onSetState}
                displayOnMobile
                selectedPaymentMethod={this.state.selectedPaymentMethod}
              />
            </EditBookingForm>
          </div>
          <BookingSummaryCard
            authorDisplayName={authorDisplayName}
            currentAuthor={currentAuthor}
            selectedBookingTimes={this.state.selectedBookingTimes}
            bookingRate={bookingRate}
            bookingDates={bookingDates}
            listing={currentListing}
            onManageDisableScrolling={onManageDisableScrolling}
            onSetState={onSetState}
            selectedPaymentMethod={this.state.selectedPaymentMethod}
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
  const { currentUser } = state.user;
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
  };
};

const mapDispatchToProps = dispatch => ({
  fetchStripeCustomer: () => dispatch(stripeCustomer()),
  onInitiateOrder: (params, metadata) => dispatch(initiateOrder(params, metadata)),
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
