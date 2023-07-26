import React, { useEffect, useState } from 'react';
import { compose } from 'redux';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import { injectIntl, FormattedMessage } from '../../util/reactIntl';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';
import {
  Form,
  Button,
  Modal,
  FieldTextInput,
  NamedLink,
  BookingSummaryCard,
  PaymentMethods,
  ButtonTabNavHorizontal,
} from '../../components';
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

import css from './EditBookingForm.module.css';

const BANK_ACCOUNT = 'Bank Account';
const CREDIT_CARD = 'Payment Card';

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

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

const checkValidBookingTimes = (bookingTimes, bookingDates) => {
  if (!bookingTimes || !bookingDates || bookingDates.length === 0) return false;

  const sameLength = Object.keys(bookingTimes).length === bookingDates.length;
  const hasStartAndEndTimes = Object.keys(bookingTimes).every(
    bookingTime => bookingTimes[bookingTime].startTime && bookingTimes[bookingTime].endTime
  );

  return sameLength && hasStartAndEndTimes;
};

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
      const [isPaymentLearnMoreModalOpen, setIsPaymentLearnMoreModalOpen] = useState(false);
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

        setSelectedTab('Payment');
      };

      const handleGoToRequest = () => {
        if (!selectedPaymentMethod) {
          setGoToRequestError('You must add or select a payment method before requesting to book.');
          return;
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
              <div className={css.nextButton}>
                {goToPaymentError ? <p className={css.error}>{goToPaymentError}</p> : null}
                {!isLarge ? (
                  <Button onClick={handleGoToPayment} type="button">
                    Next: Payment
                  </Button>
                ) : null}
              </div>
            </>
          );
          break;
        case 'Payment':
          tabContent = (
            <div className={css.paymentContentContainer}>
              <section className={css.paymentContainer}>
                <p>
                  We understand the importance of trust and security, particularly when it comes to
                  your financial information. Click{' '}
                  <span
                    className={css.paymentLearnMore}
                    onClick={() => setIsPaymentLearnMoreModalOpen(true)}
                  >
                    here
                  </span>{' '}
                  to learn more about why we ask for your payment details upfront when you request
                  to book a caregiver.
                </p>
                <div className={css.processingFees}>
                  <p className={css.tinyNoMargin}>*Processing Fees</p>
                  <ul className={css.processingFeesList}>
                    <li className={css.tinyNoMargin}>Bank Accounts: 0.8%</li>
                    <li className={css.tinyNoMargin}>Payment Cards: 2.9% + $0.30</li>
                  </ul>
                </div>
                {showPaymentForm ? (
                  <PaymentMethods
                    defaultPaymentFetched={defaultPaymentFetched}
                    defaultPaymentMethods={defaultPaymentMethods}
                    fetchDefaultPaymentError={fetchDefaultPaymentError}
                    fetchDefaultPaymentInProgress={fetchDefaultPaymentInProgress}
                    stripeCustomerFetched={stripeCustomerFetched}
                    onChangePaymentMethod={method => {
                      onChangePaymentMethod(method);
                      setGoToRequestError(null);
                    }}
                    className={css.paymentMethods}
                    removeDisabled
                  />
                ) : null}
                <div className={css.nextButton}>
                  {goToRequestError ? <p className={css.error}>{goToRequestError}</p> : null}
                  {!isLarge ? (
                    <Button onClick={handleGoToRequest} type="button">
                      Next: Request
                    </Button>
                  ) : null}
                </div>
              </section>
            </div>
          );
          break;
        case 'Request':
          tabContent = (
            <div className={css.requestContentContainer}>
              <BookingSummaryCard
                authorDisplayName={authorDisplayName}
                currentAuthor={currentAuthor}
                selectedBookingTimes={formatDateTimeValues(values.dateTimes)}
                bookingRate={bookingRate}
                bookingDates={bookingDates.map(bookingDate => new Date(bookingDate))}
                listing={currentListing}
                onManageDisableScrolling={onManageDisableScrolling}
                onSetState={onSetState}
                selectedPaymentMethod={selectedPaymentMethodType}
                displayOnMobile
              />
              <div>
                <div className={css.sendAMessage}>
                  <h2>Send a Message (Optional)</h2>
                  <FieldTextInput
                    id="message"
                    name="message"
                    type="textarea"
                    label="Message"
                    placeholder={`Hello ${authorDisplayName}! I'm looking forward to…`}
                    className={css.message}
                  />
                </div>
                <div>
                  {listingNotFoundErrorMessage}
                  {initiateOrderErrorMessage}
                  <p className={css.paymentInfo}>
                    You will not be charged until the caregiver accepts the booking
                  </p>
                  <Button
                    className={css.submitButton}
                    inProgress={initiateOrderInProgress}
                    ready={transaction}
                    type="submit"
                  >
                    Request to Book
                  </Button>
                </div>
              </div>
              <BookingSummaryCard
                authorDisplayName={authorDisplayName}
                currentAuthor={currentAuthor}
                selectedBookingTimes={formatDateTimeValues(values.dateTimes)}
                bookingRate={bookingRate}
                bookingDates={bookingDates.map(bookingDate => new Date(bookingDate))}
                listing={currentListing}
                onManageDisableScrolling={onManageDisableScrolling}
                onSetState={onSetState}
                selectedPaymentMethod={selectedPaymentMethodType}
              />
            </div>
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
          <Modal
            id="EditBookingDatesModal"
            isOpen={isPaymentLearnMoreModalOpen}
            onClose={() => setIsPaymentLearnMoreModalOpen(false)}
            onManageDisableScrolling={onManageDisableScrolling}
            containerClassName={css.modalContainer}
            className={css.modalContent}
          >
            <p className={css.modalTitle}>Why do we ask for payment details upfront?</p>
            <p className={css.modalMessage}>
              <ol>
                <li className={css.learnMoreListItem}>
                  <strong>Payment Upon Confirmation</strong>: Your selected payment method (either a
                  bank account or a payment card) is used to ensure a seamless transaction. Rest
                  assured, it is only charged once the caregiver accepts your booking request. Until
                  that happens, no charges are applied.
                </li>
                <li className={css.learnMoreListItem}>
                  <strong>Escrow Protection</strong>: To further protect your interests, we hold
                  your payment in a secure escrow account. This process ensures your payment is
                  safeguarded throughout the duration of the service and the caregiver won't receive
                  the funds until the booking is complete.
                </li>
                <li className={css.learnMoreListItem}>
                  <strong>Dispute Resolution</strong>: If anything goes awry during the booking, you
                  have a 48-hour window to raise a dispute. Our dedicated review team will evaluate
                  the situation thoroughly and refund the amount we find appropriate based on the
                  circumstances.
                </li>
                <li className={css.learnMoreListItem}>
                  <strong>Flexible Cancellation</strong>: We understand that plans change, and we've
                  got you covered. If you need to cancel the booking, you'll be refunded in
                  {/* TODO: Add link to cancellation policy in TOS here */}
                  accordance with our fair and transparent cancellation policy.
                </li>
              </ol>
              We take your security and trust very seriously. Our process is designed to ensure
              every transaction is safe, secure, and convenient for you. If you have any further
              questions or concerns, feel free to reach out to us.
            </p>
          </Modal>
        </Form>
      );
    }}
  />
);

export default compose(injectIntl)(EditBookingFormComponent);
