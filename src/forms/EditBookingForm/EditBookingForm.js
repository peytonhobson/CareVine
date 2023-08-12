import React, { useEffect, useState, useMemo } from 'react';
import { compose } from 'redux';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import { injectIntl, FormattedMessage } from '../../util/reactIntl';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';
import {
  Form,
  Button,
  NamedLink,
  ButtonTabNavHorizontal,
  PrimaryButton,
  Modal,
  BookingCalendar,
} from '../../components';
import {
  isTransactionInitiateListingNotFoundError,
  isTransactionInitiateBookingTimeNotAvailableError,
  isTransactionChargeDisabledError,
  transactionInitiateOrderStripeErrors,
} from '../../util/errors';
import { createSlug } from '../../util/urlHelpers';
import { useMediaQuery } from '@mui/material';
import { SectionOneTime, SectionRecurring, SectionRequest, SectionPayment } from './sections';
import moment from 'moment';
import { WEEKDAYS } from '../../util/constants';
import WarningIcon from '@mui/icons-material/Warning';

import css from './EditBookingForm.module.css';

const BANK_ACCOUNT = 'Bank Account';
const CREDIT_CARD = 'Payment Card';

const STORAGE_KEY = 'CheckoutPage';

const reverseWeekdayMap = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
};

const overlapsBookingTime = (startDate, endDate, booking) => {
  const bookingStart = new Date(booking.startDate);
  const bookingEnd = new Date(booking.endDate);
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  return (
    (start <= bookingStart && (!end || end >= bookingStart) && !booking.endDate) ||
    (start >= bookingStart && !booking.endDate) ||
    (start >= bookingStart && start <= bookingEnd) ||
    (end >= bookingStart && (!end || end <= bookingEnd)) ||
    (start <= bookingStart && (!end || end <= bookingEnd))
  );
};

const getUnavailableDays = (bookedDays = [], startDate, endDate, bookedDates = [], weekdays) => {
  const bookedDaysArr = bookedDays.reduce((acc, booking) => {
    const overlaps = overlapsBookingTime(startDate, endDate, booking);

    if (overlaps) {
      return [...acc, ...booking.days];
    }
    return acc;
  }, []);

  const bookedDatesArr = bookedDates.reduce((acc, bookingDate) => {
    const isBetween =
      new Date(bookingDate) >= startDate && (!endDate || new Date(bookingDate) <= endDate);

    if (isBetween) {
      const dayOfWeek = WEEKDAYS[new Date(bookingDate).getDay()];
      return [...acc, dayOfWeek];
    }
    return acc;
  }, []);

  const unavailableDays = [...new Set([...bookedDaysArr, ...bookedDatesArr])].filter(
    w => weekdays[w]
  );

  return unavailableDays;
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

  if (weekdays[reverseWeekdayMap[day]]) {
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

const isSelectedWeekday = (weekdays, date) => {
  const day = date.getDay();
  return weekdays[WEEKDAYS[day]];
};

const EditBookingFormComponent = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={formRenderProps => {
      const {
        className,
        handleSubmit,
        values,
        form,
        onManageDisableScrolling,
        authorDisplayName,
        defaultPaymentMethods,
        selectedPaymentMethod,
        initiateOrderInProgress,
        initiateOrderError,
        transaction,
        currentListing,
        listingTitle,
        currentAuthor,
        showPaymentForm,
        defaultPaymentFetched,
        fetchDefaultPaymentError,
        fetchDefaultPaymentInProgress,
        stripeCustomerFetched,
        onChangePaymentMethod,
        intl,
        onUpdateBookingDraft,
        updateBookingDraftInProgress,
      } = formRenderProps;

      const [selectedTab, setSelectedTab] = useState('Dates/Times');
      const [goToPaymentError, setGoToPaymentError] = useState(false);
      const [goToRequestError, setGoToRequestError] = useState(false);
      const [isUnavailableWarningModalOpen, setIsUnavailableWarningModalOpen] = useState(false);

      const isLarge = useMediaQuery('(min-width:1024px)');

      const updateDraft = newValues => {
        const bookingSchedule = findWeekdays(newValues);
        const saveParams = {
          bookingRate: newValues.bookingRate,
          bookingDates: newValues.bookingDates,
          scheduleType: newValues.scheduleType,
          startDate: newValues.startDate?.date.getTime(),
          endDate: newValues.endDate?.date.getTime(),
          bookingSchedule,
          dateTimes: newValues.dateTimes,
          exceptions: newValues.exceptions,
        };

        if (!Object.keys(bookingSchedule).length && !values.bookingDates?.length) return;

        onUpdateBookingDraft(saveParams);
      };

      const checkValidDates = () => {
        if (values.scheduleType === 'oneTime') {
          if (values.bookingDates?.length === 0) {
            setGoToPaymentError('Please select at least one booking date.');
            return false;
          }

          if (!checkValidBookingTimes(values.dateTimes, values.bookingDates)) {
            setGoToPaymentError('Please select start times and end times for each booking date.');
            return false;
          }
        } else {
          const hasWeekdayvalues = WEEKDAYS.some(weekday => values[weekday]);
          if (!hasWeekdayvalues) {
            setGoToPaymentError('Please select at least one weekday.');
            return false;
          }

          if (!values.startDate) {
            setGoToPaymentError('Please select a start date.');
            return false;
          }

          const weekdays = findWeekdays(values);

          if (!isSelectedWeekday(weekdays, values.startDate.date)) {
            setGoToPaymentError(
              "Your selected start date doesn't fall on one of your selected weekdays. Please select a new start date."
            );
            return false;
          }

          if (values.endDate && !isSelectedWeekday(weekdays, values.endDate.date)) {
            setGoToPaymentError(
              "Your selected end date doesn't fall on one of your selected weekdays. Please select a new end date."
            );
            return false;
          }

          if (
            values.exceptions.removedDays.some(d =>
              moment(d.date).isSame(values.startDate.date, 'day')
            )
          ) {
            setGoToPaymentError(
              'Your selected start date is also a day you removed. Please select a new start date or add the date back.'
            );
            return false;
          }
        }
        return true;
      };

      const checkvalidPayment = () => {
        if (!selectedPaymentMethod) {
          setGoToRequestError('You must add or select a payment method before requesting to book.');
          return false;
        }
        return true;
      };

      const handleGoToPayment = () => {
        if (!checkValidDates()) return;

        if (unavailableDates.length > 0 && selectedTab === 'Dates/Times') {
          setIsUnavailableWarningModalOpen(true);
          return;
        }

        setSelectedTab('Payment');
      };

      const handleGoToRequest = () => {
        if (!checkValidDates() || !checkvalidPayment()) return;

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

      const { bookedDates, bookedDays } = currentListing.attributes.metadata;
      const weekdays = useMemo(() => findWeekdays(values), [values]);
      const unavailableDates = useMemo(
        () =>
          getUnavailableDays(
            bookedDays,
            values.startDate?.date,
            values.endDate?.date,
            bookedDates,
            weekdays
          ),
        [bookedDays, values.startDate?.date, values.endDate?.date, bookedDates, weekdays]
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

      const selectedPaymentMethodType =
        selectedPaymentMethod?.type === 'card' ? CREDIT_CARD : BANK_ACCOUNT;

      const classes = classNames(css.root, className);

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
                  values={values}
                  listing={currentListing}
                  form={form}
                />
              ) : (
                <SectionRecurring
                  values={values}
                  intl={intl}
                  onManageDisableScrolling={onManageDisableScrolling}
                  listing={currentListing}
                  isLarge={isLarge}
                  onDeleteEndDate={() => form.change('endDate', null)}
                  form={form}
                  unavailableDates={unavailableDates}
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
              bookingDates={values.bookingDates}
              onManageDisableScrolling={onManageDisableScrolling}
              selectedPaymentMethodType={selectedPaymentMethodType}
              initiateOrderErrorMessage={initiateOrderErrorMessage}
              listingNotFoundErrorMessage={listingNotFoundErrorMessage}
              initiateOrderInProgress={initiateOrderInProgress}
              transaction={transaction}
              form={form}
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
              setGoToPaymentError(null);
              setGoToRequestError(null);
              if (
                !updateBookingDraftInProgress &&
                JSON.stringify(e.values) !== JSON.stringify(values)
              ) {
                updateDraft(e.values);
              }
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
          {onManageDisableScrolling && isUnavailableWarningModalOpen ? (
            <Modal
              id="UnavailableWarningModal"
              isOpen={isUnavailableWarningModalOpen}
              onClose={() => setIsUnavailableWarningModalOpen(false)}
              onManageDisableScrolling={onManageDisableScrolling}
              usePortal
            >
              <p className={css.modalTitle}>
                <WarningIcon color="warning" fontSize="large" />
                Warning: Unavailable Dates During Booking
              </p>
              <p className={css.modalMessage}>
                The caregiver is unavailable for all dates highlighted in{' '}
                <span className={css.error}>red</span> below.
                <BookingCalendar
                  bookingSchedule={weekdays}
                  startDate={values.startDate?.date}
                  endDate={values.endDate?.date}
                  unavailableDates={{
                    bookedDays,
                    bookedDates,
                  }}
                  noDisabled
                  className={css.warningCalendar}
                  exceptions={values.exceptions}
                />
                By continuing, you are acknowledging that the caregiver is unavailable for the above
                dates and you will need to make other arrangements. Alternatively you can change
                your booking to accommodate the caregiver’s availability.
              </p>
              <div className={css.warningModalButtons}>
                <Button
                  className={css.modalButton}
                  onClick={() => setIsUnavailableWarningModalOpen(false)}
                >
                  Change Dates
                </Button>
                <PrimaryButton
                  className={css.modalButton}
                  onClick={() => {
                    setIsUnavailableWarningModalOpen(false);
                    setSelectedTab('Payment');
                  }}
                >
                  Continue
                </PrimaryButton>
              </div>
            </Modal>
          ) : null}
        </Form>
      );
    }}
  />
);

export default compose(injectIntl)(EditBookingFormComponent);
