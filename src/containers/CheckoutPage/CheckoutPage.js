import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from '../../util/reactIntl';
import { withRouter } from 'react-router-dom';
import classNames from 'classnames';
import routeConfiguration from '../../routeConfiguration';
import { pathByRouteName, findRouteByRouteName } from '../../util/routes';
import { ensureListing, ensureCurrentUser, ensureUser } from '../../util/data';
import { AvatarMedium, NamedLink, NamedRedirect, Page } from '../../components';
import { EditBookingForm } from '../../forms';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/UI.duck';
import { confirmCardPayment, retrievePaymentIntent } from '../../ducks/stripe.duck';
import { createCreditCard } from '../../ducks/paymentMethods.duck';

import {
  initiateOrder,
  setStateValues,
  speculateTransaction,
  stripeCustomer,
  confirmPayment,
  sendMessage,
  setInitialValues,
} from './CheckoutPage.duck';
import BookingSummaryCard from './BookingSummaryCard';
import { storeData, storedData, clearData } from './CheckoutPageSessionHelpers';
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

  props;

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
    if (this.state.submitting) {
      return;
    }
    this.setState({ submitting: true });

    const { history, speculatedTransaction, currentUser, paymentIntent, dispatch } = this.props;
    const { card, message, paymentMethod, formValues } = values;
    const {
      name,
      addressLine1,
      addressLine2,
      postal,
      city,
      state,
      country,
      saveAfterOnetimePayment,
    } = formValues;

    // Billing address is recommended.
    // However, let's not assume that <StripePaymentAddress> data is among formValues.
    // Read more about this from Stripe's docs
    // https://stripe.com/docs/stripe-js/reference#stripe-handle-card-payment-no-element
    const addressMaybe =
      addressLine1 && postal
        ? {
            address: {
              city: city,
              country: country,
              line1: addressLine1,
              line2: addressLine2,
              postal_code: postal,
              state: state,
            },
          }
        : {};
    const billingDetails = {
      name,
      email: ensureCurrentUser(currentUser).attributes.email,
      ...addressMaybe,
    };

    const requestPaymentParams = {
      pageData: this.state.pageData,
      speculatedTransaction,
      stripe: this.stripe,
      card,
      billingDetails,
      message,
      paymentIntent,
      selectedPaymentMethod: paymentMethod,
      saveAfterOnetimePayment: !!saveAfterOnetimePayment,
    };

    this.handlePaymentIntent(requestPaymentParams)
      .then(res => {
        const { orderId, messageSuccess, paymentMethodSaved } = res;
        this.setState({ submitting: false });

        const routes = routeConfiguration();
        const initialMessageFailedToTransaction = messageSuccess ? null : orderId;
        const orderDetailsPath = pathByRouteName('OrderDetailsPage', routes, { id: orderId.uuid });
        const initialValues = {
          initialMessageFailedToTransaction,
          savePaymentMethodFailed: !paymentMethodSaved,
        };

        initializeOrderPage(initialValues, routes, dispatch);
        clearData(STORAGE_KEY);
        history.push(orderDetailsPath);
      })
      .catch(err => {
        console.error(err);
        this.setState({ submitting: false });
      });
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

    console.log(dateTimes);

    this.setState({
      selectedBookingTimes: formattedBookingTimes,
    });
  };

  render() {
    const {
      scrollingDisabled,
      initiateOrderError,
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
              onSubmit={() => {}}
              onChange={this.handleEditBookingFormChange}
              monthYearBookingDates={monthYearBookingDates}
              monthlyTimeSlots={monthlyTimeSlots}
              onManageDisableScrolling={onManageDisableScrolling}
              bookingDates={bookingDates}
              onSetState={onSetState}
              authorDisplayName={authorDisplayName}
              defaultPaymentMethods={defaultPaymentMethods}
              selectedPaymentMethod={this.state.selectedPaymentMethod}
            >
              <PaymentSection
                currentUser={currentUser}
                initiateOrderError={initiateOrderError}
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
    speculateTransactionInProgress,
    speculateTransactionError,
    speculatedTransaction,
    transaction,
    initiateOrderError,
    confirmPaymentError,
  } = state.CheckoutPage;
  const { currentUser } = state.user;
  const { confirmCardPaymentError, paymentIntent, retrievePaymentIntentError } = state.stripe;
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
    speculateTransactionInProgress,
    speculateTransactionError,
    speculatedTransaction,
    transaction,
    listing,
    initiateOrderError,
    confirmCardPaymentError,
    confirmPaymentError,
    paymentIntent,
    retrievePaymentIntentError,
    monthlyTimeSlots,
    defaultPaymentFetched,
    defaultPaymentMethods,
    fetchDefaultPaymentError,
    fetchDefaultPaymentInProgress,
  };
};

const mapDispatchToProps = dispatch => ({
  fetchSpeculatedTransaction: (params, transactionId) =>
    dispatch(speculateTransaction(params, transactionId)),
  fetchStripeCustomer: () => dispatch(stripeCustomer()),
  onInitiateOrder: (params, transactionId) => dispatch(initiateOrder(params, transactionId)),
  onRetrievePaymentIntent: params => dispatch(retrievePaymentIntent(params)),
  onConfirmCardPayment: params => dispatch(confirmCardPayment(params)),
  onConfirmPayment: params => dispatch(confirmPayment(params)),
  onSendMessage: params => dispatch(sendMessage(params)),
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
