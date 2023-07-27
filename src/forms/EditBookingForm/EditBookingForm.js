import React, { useEffect, useState } from 'react';
import { compose } from 'redux';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import { injectIntl, FormattedMessage } from '../../util/reactIntl';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';
import { Form, Button, NamedLink, ButtonTabNavHorizontal } from '../../components';
import {
  isTransactionInitiateListingNotFoundError,
  isTransactionInitiateBookingTimeNotAvailableError,
  isTransactionChargeDisabledError,
  transactionInitiateOrderStripeErrors,
} from '../../util/errors';
import { createSlug } from '../../util/urlHelpers';
import { useMediaQuery } from '@mui/material';
import SectionOneTime from './SectionOneTime';
import SectionRecurring from './SectionRecurring';
import SectionRequest from './SectionRequest';
import SectionPayment from './SectionPayment';
import moment from 'moment';
import { WEEKDAYS } from '../../util/constants';

import css from './EditBookingForm.module.css';

const BANK_ACCOUNT = 'Bank Account';
const CREDIT_CARD = 'Payment Card';

const weekdayMap = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
};

const checkValidBookingTimes = (bookingTimes, bookingDates) => {
  if (!bookingTimes || !bookingDates || bookingDates.length === 0) return false;

  const sameLength = Object.keys(bookingTimes).length === bookingDates.length;
  const hasStartAndEndTimes = Object.keys(bookingTimes).every(
    bookingTime => bookingTimes[bookingTime].startTime && bookingTimes[bookingTime].endTime
  );

  return sameLength && hasStartAndEndTimes;
};

const findNewStartDate = (startDate, weekdays) => {
  const day = moment(startDate).day();

  if (weekdays[weekdayMap[day]]) {
    return startDate;
  }

  const newStartDate = moment(startDate).add(1, 'days');
  return findNewStartDate(newStartDate, weekdays);
};

const findWeekdays = values =>
  WEEKDAYS.reduce((acc, key) => {
    if (values[key]) {
      return { ...acc, [key]: values[key] };
    }
    return acc;
  }, {});

const EditBookingFormComponent = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={formRenderProps => {
      const {
        className,
        ready,
        handleSubmit,
        pristine,
        updated,
        updateInProgress,
        monthYearBookingDates,
        onChange,
        values,
        form,
        onManageDisableScrolling,
        bookingDates,
        onSetState,
        authorDisplayName,
        defaultPaymentMethods,
        selectedPaymentMethod,
        initiateOrderInProgress,
        initiateOrderError,
        transaction,
        currentListing,
        listingTitle,
        currentAuthor,
        bookingRate,
        showPaymentForm,
        defaultPaymentFetched,
        fetchDefaultPaymentError,
        fetchDefaultPaymentInProgress,
        stripeCustomerFetched,
        onChangePaymentMethod,
        intl,
      } = formRenderProps;

      const [selectedTab, setSelectedTab] = useState('Dates/Times');
      const [goToPaymentError, setGoToPaymentError] = useState(false);
      const [goToRequestError, setGoToRequestError] = useState(false);

      const isLarge = useMediaQuery('(min-width:1024px)');

      const handleGoToPayment = () => {
        if (values.scheduleType === 'oneTime') {
          if (values.bookingDates?.length === 0) {
            setGoToPaymentError('Please select at least one booking date.');
            return;
          }

          if (!checkValidBookingTimes(values.dateTimes, values.bookingDates)) {
            setGoToPaymentError('Please select start times and end times for each booking date.');
            return;
          }
        } else {
          const hasWeekdayvalues = WEEKDAYS.some(weekday => values[weekday]);
          if (!hasWeekdayvalues) {
            setGoToPaymentError('Please select at least one weekday.');
            return;
          }
        }

        if (values.startDate) {
          const newStartDate = findNewStartDate(values.startDate.date, findWeekdays(values));
          if (newStartDate !== values.startDate.date) {
            form.change('startDate', { date: newStartDate });
          }
        }

        setSelectedTab('Payment');
      };

      const handleGoToRequest = () => {
        if (!selectedPaymentMethod) {
          setGoToRequestError('You must add or select a payment method before requesting to book.');
          return;
        }

        if (values.startDate) {
          const newStartDate = findNewStartDate(values.startDate.date, findWeekdays(values));
          if (newStartDate !== values.startDate.date) {
            form.change('startDate', { date: newStartDate });
          }
        }

        setSelectedTab('Request');
      };

      const tabs = [
        {
          text: 'Dates/Times',
          selected: 'Dates/Times' === selectedTab,
          onClick: () => setSelectedTab('Dates/Times'),
        },
        {
          text: 'Payment',
          selected: 'Payment' === selectedTab,
          onClick: handleGoToPayment,
        },
        {
          text: 'Request',
          selected: 'Request' === selectedTab,
          onClick: handleGoToRequest,
        },
      ];

      const listingNotFound = isTransactionInitiateListingNotFoundError(initiateOrderError);
      const isChargeDisabledError = isTransactionChargeDisabledError(initiateOrderError);
      const isBookingTimeNotAvailableError = isTransactionInitiateBookingTimeNotAvailableError(
        initiateOrderError
      );
      const stripeErrors = transactionInitiateOrderStripeErrors(initiateOrderError);

      const listingLink = (
        <NamedLink
          name="ListingPage"
          params={{ id: currentListing.id.uuid, slug: createSlug(listingTitle) }}
        >
          <FormattedMessage id="CheckoutPage.errorlistingLinkText" />
        </NamedLink>
      );

      let initiateOrderErrorMessage = null;
      let listingNotFoundErrorMessage = null;

      if (listingNotFound) {
        listingNotFoundErrorMessage = (
          <p className={css.error}>
            <FormattedMessage id="CheckoutPage.listingNotFoundError" />
          </p>
        );
      } else if (isBookingTimeNotAvailableError) {
        initiateOrderErrorMessage = (
          <p className={css.error}>
            <FormattedMessage
              id="CheckoutPage.bookingTimeNotAvailableMessage"
              values={{ listingLink }}
            />
          </p>
        );
      } else if (isChargeDisabledError) {
        initiateOrderErrorMessage = (
          <p className={css.error}>
            <FormattedMessage id="CheckoutPage.chargeDisabledMessage" />
          </p>
        );
      } else if (stripeErrors && stripeErrors.length > 0) {
        // NOTE: Error messages from Stripes are not part of translations.
        // By default they are in English.
        const stripeErrorsAsString = stripeErrors.join(', ');
        initiateOrderErrorMessage = (
          <p className={css.error}>
            <FormattedMessage
              id="CheckoutPage.initiateOrderStripeError"
              values={{ stripeErrors: stripeErrorsAsString }}
            />
          </p>
        );
      } else if (initiateOrderError) {
        // Generic initiate order error
        initiateOrderErrorMessage = (
          <p className={css.error}>
            <FormattedMessage id="CheckoutPage.initiateOrderError" values={{ listingLink }} />
          </p>
        );
      }

      useEffect(() => {
        form.change('bookingDates', bookingDates);
      }, [JSON.stringify(bookingDates)]);

      const handleSaveBookingDates = bd => {
        onSetState({ bookingDates: bd });
        const newMonthYearBookingDates = bd.map(
          bookingDate =>
            `${new Date(bookingDate).getMonth() + 1}/${new Date(bookingDate).getDate()}`
        );

        const newDateTimes = values.dateTimes
          ? Object.keys(values.dateTimes)?.reduce((acc, monthYear) => {
              if (newMonthYearBookingDates.includes(monthYear)) {
                acc[monthYear] = values.dateTimes[monthYear];
              }
              return acc;
            }, {})
          : {};

        form.change('dateTimes', newDateTimes);
      };

      const bookedDates = currentListing.attributes.metadata.bookedDates;
      const selectedPaymentMethodType =
        selectedPaymentMethod?.type === 'card' ? CREDIT_CARD : BANK_ACCOUNT;

      const classes = classNames(css.root, className);
      const submitInProgress = updateInProgress;
      const submitReady = (updated && pristine) || ready;

      let tabContent = null;
      switch (selectedTab) {
        case 'Dates/Times':
          tabContent = (
            <>
              {isLarge && goToPaymentError ? (
                <div className={css.nextButton}>
                  <p className={css.error}>{goToPaymentError}</p>
                </div>
              ) : null}
              {values.scheduleType === 'oneTime' ? (
                <SectionOneTime
                  bookedDates={bookedDates}
                  onSaveBookingDates={handleSaveBookingDates}
                  values={values}
                  goToPaymentError={goToPaymentError}
                  onGoToPayment={handleGoToPayment}
                  isLarge={isLarge}
                  monthYearBookingDates={monthYearBookingDates}
                />
              ) : (
                <SectionRecurring
                  values={values}
                  intl={intl}
                  onManageDisableScrolling={onManageDisableScrolling}
                  listing={currentListing}
                  isLarge={isLarge}
                />
              )}
              {!isLarge ? (
                <div className={css.nextButton}>
                  {goToPaymentError ? <p className={css.error}>{goToPaymentError}</p> : null}

                  <Button onClick={handleGoToPayment} type="button">
                    Next: Payment
                  </Button>
                </div>
              ) : null}
            </>
          );
          break;
        case 'Payment':
          tabContent = (
            <SectionPayment
              isLarge={isLarge}
              showPaymentForm={showPaymentForm}
              defaultPaymentFetched={defaultPaymentFetched}
              fetchDefaultPaymentError={fetchDefaultPaymentError}
              fetchDefaultPaymentInProgress={fetchDefaultPaymentInProgress}
              stripeCustomerFetched={stripeCustomerFetched}
              onChangePaymentMethod={onChangePaymentMethod}
              onManageDisableScrolling={onManageDisableScrolling}
              defaultPaymentMethods={defaultPaymentMethods}
              onGoToRequest={handleGoToRequest}
              goToRequestError={goToRequestError}
              setGoToRequestError={setGoToRequestError}
            />
          );
          break;
        case 'Request':
          tabContent = (
            <SectionRequest
              authorDisplayName={authorDisplayName}
              currentAuthor={currentAuthor}
              currentListing={currentListing}
              values={values}
              bookingDates={bookingDates}
              bookingRate={bookingRate}
              onManageDisableScrolling={onManageDisableScrolling}
              onSetState={onSetState}
              selectedPaymentMethodType={selectedPaymentMethodType}
              initiateOrderErrorMessage={initiateOrderErrorMessage}
              listingNotFoundErrorMessage={listingNotFoundErrorMessage}
              initiateOrderInProgress={initiateOrderInProgress}
              transaction={transaction}
            />
          );
          break;
        default:
          tabContent = null;
      }

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <FormSpy
            onChange={e => {
              onChange(e);
              setGoToPaymentError(null);
              setGoToRequestError(null);
            }}
          />
          <ButtonTabNavHorizontal
            tabs={tabs}
            rootClassName={css.nav}
            tabRootClassName={css.tab}
            tabContentClass={css.tabContent}
            tabClassName={css.tab}
          />
          {tabContent}
        </Form>
      );
    }}
  />
);

export default compose(injectIntl)(EditBookingFormComponent);
