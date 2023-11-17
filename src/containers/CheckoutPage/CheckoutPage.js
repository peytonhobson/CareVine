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
  GenericError,
  InlineTextButton,
} from '../../components';
import { EditBookingForm } from '../../forms';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/UI.duck';
import { createCreditCard } from '../../ducks/paymentMethods.duck';

import { initiateOrder, updateBookingDraft, setInitialValues } from './CheckoutPage.duck';
import { ISO_OFFSET_FORMAT } from '../../util/constants';
import moment from 'moment';
import {
  mapWeekdays,
  findStartTimeFromBookingTimes,
  findStartTimeRecurring,
  constructBookingMetadataOneTime,
  constructBookingMetadataRecurring,
} from '../../util/bookings';
import { calculateDistanceBetweenOrigins } from '../../util/maps';

import css from './CheckoutPage.module.css';

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

  componentWillUnmount() {
    this.props.onSetInitialValues();
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
      setTimeout(() => {
        this.setState({ showBookingSummary: true });
        window.scrollTo(0, 0);
      }, 3000);
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
      bookingRate,
      scheduleType,
      exceptions,
    } = values;

    const weekdays = mapWeekdays(values);

    const startDate = moment(startDateDate?.date)
      .startOf('day')
      .format(ISO_OFFSET_FORMAT);
    const endDate = endDateDate?.date
      ? moment(endDateDate.date)
          .startOf('day')
          .format(ISO_OFFSET_FORMAT)
      : null;
    const { onInitiateOrder, currentUserListing, currentUser, listing, params } = this.props;

    const listingId = listing.id;

    const bookingStart =
      scheduleType === 'oneTime'
        ? findStartTimeFromBookingTimes(bookingTimes).format(ISO_OFFSET_FORMAT)
        : findStartTimeRecurring(weekdays, startDate, endDate, exceptions).format(
            ISO_OFFSET_FORMAT
          );
    const bookingEnd = moment
      .parseZone(bookingStart)
      .add(5, 'minutes')
      .format(ISO_OFFSET_FORMAT);
    const orderParams = {
      listingId,
      seats: 1,
      bookingStart,
      bookingEnd,
    };

    const ensuredExceptions = exceptions || {
      addedDays: [],
      removedDays: [],
      changedDays: [],
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
            ensuredExceptions
          );

    const currentUserListingTitle = currentUserListing.attributes.title;
    const currentUserListingCity = currentUserListing.attributes.publicData.location.city;
    const currentUserListingGeo = currentUserListing.attributes.geolocation;

    const senderGeolocation = listing?.attributes?.geolocation;
    const senderListingDistance =
      currentUserListingGeo && senderGeolocation
        ? calculateDistanceBetweenOrigins(senderGeolocation, currentUserListingGeo)
        : null;

    const metadata = {
      ...scheduleTypeMetadata,
      message,
      bookingRate,
      paymentMethodId: this.state.selectedPaymentMethod?.id,
      paymentMethodType: this.state.selectedPaymentMethod?.type,
      senderListingTitle: currentUserListingTitle,
      senderCity: currentUserListingCity,
      senderListingDescription: currentUserListing?.attributes.description,
      senderListingDistance,
      stripeCustomerId: currentUser.stripeCustomer.attributes.stripeCustomerId,
      clientEmail: currentUser.attributes.email,
      stripeAccountId: listing.author.attributes.profile.metadata.stripeAccountId,
      providerName: listing.author.attributes.profile.displayName,
      exceptions: scheduleType === 'recurring' ? ensuredExceptions : null,
    };

    onInitiateOrder(orderParams, metadata, listing, params.draftId);
  }

  render() {
    const {
      scrollingDisabled,
      initiateOrderError,
      initiateOrderInProgress,
      intl,
      params,
      currentUser,
      onManageDisableScrolling,
      onUpdateBookingDraft,
      listing,
      updateBookingDraftInProgress,
      history,
      showListingError,
      transaction,
    } = this.props;

    const bookingDrafts = currentUser?.attributes.profile.privateData.bookingDrafts || [];
    const bookingDraft = bookingDrafts.find(draft => draft.id === params.draftId) || {};

    if (currentUser?.id?.uuid && !bookingDraft.id && !transaction) {
      return listing?.id?.uuid ? (
        <NamedRedirect name="ListingPage" params={{ slug: 'title', id: listing.id.uuid }} />
      ) : (
        <NamedRedirect name="LandingPage" />
      );
    }

    const {
      bookingDates = [],
      bookingRate,
      type: scheduleType,
      startDate,
      endDate,
      bookingSchedule = [],
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
        <InlineTextButton className={css.home} onClick={() => history.goBack()}>
          Back to Listing
        </InlineTextButton>
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

    // Transfer booking schedule back to format that works with daily plan
    const initialBookingSchedule =
      bookingSchedule?.reduce((acc, curr) => {
        return {
          ...acc,
          [curr.dayOfWeek]: [
            {
              startTime: curr.startTime,
              endTime: curr.endTime,
            },
          ],
        };
      }, {}) || {};

    return (
      <Page {...pageProps}>
        {topbar}
        <div className={css.contentContainer}>
          {scheduleType && listing.id?.uuid ? (
            <EditBookingForm
              className={css.editBookingForm}
              listing={currentListing}
              onSubmit={this.handleSubmit}
              onManageDisableScrolling={onManageDisableScrolling}
              authorDisplayName={authorDisplayName}
              selectedPaymentMethod={this.state.selectedPaymentMethod}
              initiateOrderInProgress={initiateOrderInProgress}
              initiateOrderError={initiateOrderError}
              transaction={transaction}
              currentListing={currentListing}
              listingTitle={listingTitle}
              currentAuthor={currentAuthor}
              onChangePaymentMethod={method => this.setState({ selectedPaymentMethod: method })}
              initialValues={{
                scheduleType,
                startDate: startDate ? { date: new Date(startDate) } : null,
                endDate: endDate ? { date: new Date(endDate) } : null,
                ...initialBookingSchedule,
                dateTimes,
                exceptions,
                bookingDates: bookingDates.map(date => new Date(date)),
                bookingRate,
              }}
              initialValuesEqual={() => true}
              onUpdateBookingDraft={params => onUpdateBookingDraft(params, bookingDraft.id)}
              updateBookingDraftInProgress={updateBookingDraftInProgress}
              history={history}
            />
          ) : null}
        </div>
        <GenericError
          show={showListingError}
          errorText={`Failed to load ${authorDisplayName}'s data. Please try reloading the page`}
        />
      </Page>
    );
  }
}

const mapStateToProps = state => {
  const {
    listing,
    transaction,
    initiateOrderError,
    initiateOrderInProgress,
    updateBookingDraftInProgress,
    showListingError,
  } = state.CheckoutPage;
  const { currentUser, currentUserListing } = state.user;

  return {
    scrollingDisabled: isScrollingDisabled(state),
    currentUser,
    transaction,
    listing,
    initiateOrderError,
    initiateOrderInProgress,
    currentUserListing,
    updateBookingDraftInProgress,
    showListingError,
  };
};

const mapDispatchToProps = {
  onInitiateOrder: initiateOrder,
  onSavePaymentMethod: createCreditCard,
  onManageDisableScrolling: manageDisableScrolling,
  onUpdateBookingDraft: updateBookingDraft,
  onSetInitialValues: setInitialValues,
};

const CheckoutPage = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(CheckoutPageComponent);

CheckoutPage.displayName = 'CheckoutPage';

export default CheckoutPage;
