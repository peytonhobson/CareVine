import React, { useState } from 'react';

import { bool, func, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { fetchCurrentUser } from '../../ducks/user.duck';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { ensureCurrentUser, ensureStripeCustomer, ensurePaymentMethodCard } from '../../util/data';
import { propTypes } from '../../util/types';
import {
  deletePaymentMethod,
  createBankAccount,
  createCreditCard,
} from '../../ducks/paymentMethods.duck';
import { manageDisableScrolling, isScrollingDisabled } from '../../ducks/UI.duck';
import {
  SavedCardDetails,
  LayoutSideNavigation,
  LayoutWrapperMain,
  LayoutWrapperAccountSettingsSideNav,
  LayoutWrapperTopbar,
  LayoutWrapperFooter,
  Footer,
  Page,
  UserNav,
  ButtonTabNavHorizontal,
  InlineTextButton,
  SavedBankDetails,
  IconSpinner,
  Modal,
  SecondaryButton,
  Button,
} from '../../components';
import ReactivateInfo from './ReactivateInfo';
import { timestampToDate } from '../../util/dates';
import { TopbarContainer } from '../../containers';
import { SaveBankAccountForm, SaveCreditCardForm } from '../../forms';
import { fetchDefaultPayment } from './SubscriptionsPage.duck.js';
import config from '../../config';
import {
  cancelSubscription,
  updateSubscription,
  createSubscription,
} from '../../ducks/stripe.duck';
import SubscriptionCard from './SubscriptionCard';
import { VINE_CHECK_PRICE_ID, BASIC_CHECK_PRICE_ID } from '../../util/constants';

import css from './SubscriptionsPage.module.css';

const stripePromise = loadStripe(config.stripe.publishableKey);

const TODAY = new Date();

const SubscriptionsPageComponent = props => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    createCreditCardError,
    createCreditCardInProgress,
    createCreditCardSuccess,
    createStripeCustomerError,
    currentUser,
    defaultPaymentFetched,
    defaultPaymentMethods,
    deletePaymentMethodError,
    deletePaymentMethodInProgress,
    deletePaymentMethodSuccess,
    fetchDefaultPaymentError,
    handleCardSetupError,
    intl,
    onCreateCreditCard,
    onDeletePaymentMethod,
    onFetchDefaultPayment,
    onManageDisableScrolling,
    scrollingDisabled,
    cancelSubscriptionInProgress,
    cancelSubscriptionError,
    onCancelSubscription,
    onUpdateSubscription,
    onCreateSubscription,
    createSubscriptionError,
    createSubscriptionInProgress,
    updateSubscriptionError,
    updateSubscriptionInProgress,
    newSubscription,
    onFetchCurrentUser,
  } = props;

  const [isEditCardModalOpen, setIsEditCardModalOpen] = useState(false);
  const [isCancelSubscriptionModalOpen, setIsCancelSubscriptionModalOpen] = useState(false);
  const [isReactivateSubscriptionModalOpen, setIsReactivateSubscriptionModalOpen] = useState(false);
  const [
    isReactivateSubscriptionPaymentModalOpen,
    setIsReactivateSubscriptionPaymentModalOpen,
  ] = useState(false);

  const ensuredCurrentUser = ensureCurrentUser(currentUser);

  const card =
    !!defaultPaymentMethods && !!defaultPaymentMethods.card && defaultPaymentMethods.card.card;
  const stripeCustomer = ensureStripeCustomer(ensuredCurrentUser.stripeCustomer);
  const stripeCustomerId = stripeCustomer.attributes.stripeCustomerId;
  const backgroundCheckSubscription =
    ensuredCurrentUser.attributes.profile.metadata &&
    ensuredCurrentUser.attributes.profile.metadata.backgroundCheckSubscription;

  const getBillingDetails = (currentUser, formValues) => {
    const { name, addressLine1, addressLine2, postal, state, city, country } = formValues;
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

    return billingDetails;
  };

  const handleCardSubmit = params => {
    setIsSubmitting(true);

    const { stripe, card, formValues } = params;

    const billingDetails = getBillingDetails(currentUser, formValues);

    onCreateCreditCard(stripeCustomerId, stripe, billingDetails, card)
      .then(() => {
        // Update default payment methods
        onFetchDefaultPayment(stripeCustomerId);
        setIsSubmitting(false);
      })
      .catch(error => {
        console.error(error);
        setIsSubmitting(false);
      });
  };

  const title = intl.formatMessage({ id: 'SubscriptionsPage.title' });

  const currentUserLoaded = !!ensuredCurrentUser.id;

  // Get first and last name of the current user and use it in the StripePaymentForm to autofill the name field
  const userName = currentUserLoaded
    ? `${ensuredCurrentUser.attributes.profile.firstName} ${ensuredCurrentUser.attributes.profile.lastName}`
    : null;

  const initalValuesForStripePayment = { name: userName };

  const fetchDefaultPaymentErrorMessage = (
    <p className={css.error}>
      <FormattedMessage id="SubscriptionsPage.fetchDefaultPaymentErrorMessage" />
    </p>
  );

  const bcStatus = backgroundCheckSubscription ? backgroundCheckSubscription.status : null;
  const cancelAtPeriodEnd = backgroundCheckSubscription
    ? backgroundCheckSubscription.cancelAtPeriodEnd
    : null;
  const bcType = backgroundCheckSubscription ? backgroundCheckSubscription.type : null;

  const backgroundCheckTitle = intl.formatMessage({ id: 'SubscriptionsPage.backgroundCheckTitle' });
  let bcStatusText = null;

  switch (bcStatus) {
    case 'active':
      bcStatusText = <FormattedMessage id="SubscriptionsPage.active" />;
      break;
    case 'past_due':
      bcStatusText = <FormattedMessage id="SubscriptionsPage.pastDue" />;
      break;
    case 'canceled':
      bcStatusText = <FormattedMessage id="SubscriptionsPage.canceled" />;
      break;
    case 'unpaid':
      bcStatusText = <FormattedMessage id="SubscriptionsPage.unpaid" />;
      break;
  }

  const handleCancelSubscription = () => {
    if (bcStatus === 'active' || bcStatus === 'past_due') {
      const params = { cancel_at_period_end: true };
      onUpdateSubscription(backgroundCheckSubscription.subscriptionId, params).then(() => {
        setTimeout(() => {
          onFetchCurrentUser();
        }, 500);
        setIsCancelSubscriptionModalOpen(false);
      });
    }
  };

  const handleReactivateSubscription = () => {
    const changeSubscription = bcType !== isReactivateSubscriptionPaymentModalOpen;
    const priceId =
      isReactivateSubscriptionPaymentModalOpen == 'vine'
        ? VINE_CHECK_PRICE_ID
        : BASIC_CHECK_PRICE_ID;
    const cardId =
      defaultPaymentMethods && defaultPaymentMethods.card && defaultPaymentMethods.card.id;

    if (bcStatus === 'active') {
      if (changeSubscription) {
        const params =
          isReactivateSubscriptionPaymentModalOpen === 'basic'
            ? {
                billing_cycle_anchor: backgroundCheckSubscription.currentPeriodEnd - 1,
                default_payment_method: cardId,
                cancel_at_period_end: false,
              }
            : { default_payment_method: cardId, cancel_at_period_end: false };

        onCancelSubscription(backgroundCheckSubscription.subscriptionId).then(() => {
          onCreateSubscription(stripeCustomerId, priceId, currentUser.id.uuid, params).then(() => {
            setTimeout(() => {
              onFetchCurrentUser();
            }, 500);

            setIsReactivateSubscriptionPaymentModalOpen(false);
          });
        });
      } else {
        const params = { cancel_at_period_end: false };
        onUpdateSubscription(backgroundCheckSubscription.subscriptionId, params).then(() => {
          setTimeout(() => {
            onFetchCurrentUser();
          }, 500);
          setIsReactivateSubscriptionPaymentModalOpen(false);
        });
      }
    } else {
      const params = { default_payment_method: cardId, cancel_at_period_end: false };
      onCreateSubscription(stripeCustomerId, priceId, currentUser.id.uuid, params).then(() => {
        setTimeout(() => {
          onFetchCurrentUser();
        }, 500);
        setIsReactivateSubscriptionPaymentModalOpen(false);
      });
    }
  };

  const renewalDate =
    backgroundCheckSubscription &&
    backgroundCheckSubscription.currentPeriodEnd &&
    new Date(backgroundCheckSubscription.currentPeriodEnd * 1000);

  const amount = backgroundCheckSubscription && backgroundCheckSubscription.amount;

  const cancelButton =
    bcStatus === 'active' && !cancelAtPeriodEnd ? (
      <InlineTextButton
        className={css.cancelButton}
        onClick={() => {
          setIsCancelSubscriptionModalOpen(true);
        }}
      >
        <FormattedMessage id="SubscriptionsPage.cancelButton" />
      </InlineTextButton>
    ) : (
      <InlineTextButton
        className={css.reactivateButton}
        onClick={() => {
          setIsReactivateSubscriptionModalOpen(true);
        }}
      >
        <FormattedMessage id="SubscriptionsPage.reactivateButton" />
      </InlineTextButton>
    );

  const bcSubscriptionContent =
    backgroundCheckSubscription && bcStatusText ? (
      <SubscriptionCard title={backgroundCheckTitle} headerButton={cancelButton}>
        {bcStatus === 'active' && !cancelAtPeriodEnd ? (
          <div className={css.chargesContainer}>
            <h3>Upcoming Charges</h3>
            <p className={css.dateText}>{renewalDate && renewalDate.toLocaleDateString()}</p>
            <p className={css.amountText}>(${amount / 100})</p>
          </div>
        ) : null}
        <div className={css.planInfoContainer}>
          <h3>Plan Information</h3>
          <p>
            Type:&nbsp;
            {backgroundCheckSubscription.type === 'vine' ? (
              <FormattedMessage id="SubscriptionsPage.vineCheck" />
            ) : (
              <FormattedMessage id="SubscriptionsPage.basicCheck" />
            )}
          </p>
          <p>Status: {bcStatusText}</p>
          {renewalDate && renewalDate > TODAY && cancelAtPeriodEnd && (
            <p className={css.greenText}>
              Your subscription will be canceled&nbsp;
              {renewalDate.toLocaleDateString()} and you won't be charged for any additional billing
              periods.
            </p>
          )}
        </div>
      </SubscriptionCard>
    ) : (
      <h2 className={css.title}>No Current Subscriptions</h2>
    );

  const cardContent = !!card ? (
    <SavedCardDetails
      card={ensurePaymentMethodCard(card)}
      onEditCard={() => setIsEditCardModalOpen(true)}
      onFetchDefaultPayment={onFetchDefaultPayment}
      onManageDisableScrolling={onManageDisableScrolling}
      stripeCustomer={stripeCustomer}
    />
  ) : fetchDefaultPaymentError ? (
    fetchDefaultPaymentErrorMessage
  ) : defaultPaymentFetched ? (
    <SaveCreditCardForm
      className={css.paymentForm}
      createCreditCardError={createCreditCardError}
      createCreditCardInProgress={createCreditCardInProgress}
      createCreditCardSuccess={createCreditCardSuccess}
      createStripeCustomerError={createStripeCustomerError}
      deletePaymentMethodError={deletePaymentMethodError}
      formId="PaymentMethodsForm"
      handleCardSetupError={handleCardSetupError}
      initialValues={initalValuesForStripePayment}
      inProgress={isSubmitting}
      onSubmit={handleCardSubmit}
    />
  ) : (
    <div className={css.spinnerContainer}>
      <IconSpinner />
      <span className={css.loadingText}>Loading payment info...</span>
    </div>
  );

  // const options = {
  //   clientSecret: subscription && subscription.latest_invoice.payment_intent.client_secret,
  //   appearance,
  // };

  // TODO: Add back as create susbcription or update errors
  const reactivateSubscriptionError = null;

  return (
    <>
      <Page title={title} scrollingDisabled={scrollingDisabled}>
        <LayoutSideNavigation>
          <LayoutWrapperTopbar>
            <TopbarContainer
              currentPage="SubscriptionsPage"
              desktopClassName={css.desktopTopbar}
              mobileClassName={css.mobileTopbar}
            />
            <UserNav selectedPageName="SubscriptionsPage" />
          </LayoutWrapperTopbar>
          <LayoutWrapperAccountSettingsSideNav
            currentTab="SubscriptionsPage"
            currentUser={currentUser}
          />
          <LayoutWrapperMain>
            <div className={css.content}>
              <h1 className={css.title}>
                <FormattedMessage id="SubscriptionsPage.heading" />
              </h1>
              {bcSubscriptionContent}
              {bcStatus === 'past_due' ? (
                <p className={css.pastDueText}>
                  <FormattedMessage id="SubscriptionsPage.pastDueText" />
                </p>
              ) : null}
              <h2 className={css.subheading}>
                <FormattedMessage id="SubscriptionsPage.paymentInformation" />
              </h2>
              {cardContent}
            </div>
          </LayoutWrapperMain>
          <LayoutWrapperFooter>
            <Footer />
          </LayoutWrapperFooter>
        </LayoutSideNavigation>
      </Page>
      {onManageDisableScrolling ? (
        <Modal
          id="EditCardModal"
          isOpen={isEditCardModalOpen}
          onClose={() => setIsEditCardModalOpen(false)}
          onManageDisableScrolling={onManageDisableScrolling}
          containerClassName={css.modalContainer}
          usePortal
        >
          <SaveCreditCardForm
            className={css.paymentForm}
            createCreditCardError={createCreditCardError}
            createCreditCardInProgress={createCreditCardInProgress}
            createCreditCardSuccess={createCreditCardSuccess}
            createStripeCustomerError={createStripeCustomerError}
            deletePaymentMethodError={deletePaymentMethodError}
            formId="PaymentMethodsForm"
            handleCardSetupError={handleCardSetupError}
            initialValues={initalValuesForStripePayment}
            inProgress={isSubmitting}
            onSubmit={() => {
              handleCardSubmit();
              setIsEditCardModalOpen(false);
            }}
          />
        </Modal>
      ) : null}
      {onManageDisableScrolling ? (
        <Modal
          id="cancelSubscriptionModal"
          isOpen={isCancelSubscriptionModalOpen}
          onClose={() => setIsCancelSubscriptionModalOpen(false)}
          onManageDisableScrolling={onManageDisableScrolling}
          containerClassName={css.modalContainer}
          usePortal
        >
          <p className={css.modalTitle}>
            <FormattedMessage id="SubscriptionsPage.cancelSubscriptionModalTitle" />
          </p>
          <p className={css.modalMessage}>
            When you cancel, your profile listing will be removed and you'll lose access to
            messaging families at the end of your billing cycle(s).
          </p>
          {cancelSubscriptionError ? (
            <p className={css.modalError}>
              <FormattedMessage id="SubscriptionsPage.cancelSubscriptionError" />
            </p>
          ) : null}
          <div className={css.modalButtonContainer}>
            <SecondaryButton
              onClick={() => setIsCancelSubscriptionModalOpen(false)}
              className={css.cancelModalButton}
            >
              Back
            </SecondaryButton>
            <SecondaryButton
              inProgress={cancelSubscriptionInProgress}
              onClick={handleCancelSubscription}
              className={css.cancelModalButton}
              style={{ backgroundColor: 'var(--failColor)', color: 'white' }}
            >
              Cancel
            </SecondaryButton>
          </div>
        </Modal>
      ) : null}
      {onManageDisableScrolling ? (
        <Modal
          id="reactivateSubscriptionModal"
          isOpen={isReactivateSubscriptionModalOpen}
          onClose={() => setIsReactivateSubscriptionModalOpen(false)}
          onManageDisableScrolling={onManageDisableScrolling}
          containerClassName={css.modalContainer}
          usePortal
        >
          <p className={css.modalTitle}>
            <FormattedMessage id="SubscriptionsPage.reactivateSubscriptionModalTitle" />
          </p>
          <p className={css.modalMessage}>
            <FormattedMessage id="SubscriptionsPage.reactivateSubscriptionModalMessage" />
          </p>
          <div className={css.modalButtonContainer}>
            <SecondaryButton
              onClick={() => {
                setIsReactivateSubscriptionModalOpen(false);
                setIsReactivateSubscriptionPaymentModalOpen(bcType === 'vine' ? 'basic' : 'vine');
              }}
              className={css.reactivateModalButton}
            >
              Switch to {bcType === 'vine' ? 'Basic' : 'Vine Check'}
            </SecondaryButton>
            <Button
              // inProgress={cancelSubscriptionInProgress}
              onClick={() => {
                setIsReactivateSubscriptionModalOpen(false);
                setIsReactivateSubscriptionPaymentModalOpen(bcType === 'vine' ? 'vine' : 'basic');
              }}
              className={css.reactivateModalButton}
            >
              Reactivate
            </Button>
          </div>
        </Modal>
      ) : null}
      {onManageDisableScrolling ? (
        <Modal
          id="reactivateSubscriptionPaymentModal"
          isOpen={!!isReactivateSubscriptionPaymentModalOpen}
          onClose={() => setIsReactivateSubscriptionPaymentModalOpen(false)}
          onManageDisableScrolling={onManageDisableScrolling}
          containerClassName={css.modalContainer}
          usePortal
        >
          <p className={css.modalTitle}>
            <FormattedMessage id="SubscriptionsPage.reactivateSubscriptionModalTitle" />
          </p>
          <div className={css.paymentContainer}>
            <div className={css.paymentCard}>
              <h2> Payment Method </h2>
              {card && (
                <SavedCardDetails
                  card={ensurePaymentMethodCard(card)}
                  onFetchDefaultPayment={onFetchDefaultPayment}
                  onManageDisableScrolling={onManageDisableScrolling}
                  stripeCustomer={stripeCustomer}
                />
              )}
            </div>
            <ReactivateInfo backgroundCheckType={isReactivateSubscriptionPaymentModalOpen} />
            {renewalDate &&
            renewalDate > TODAY &&
            !(isReactivateSubscriptionPaymentModalOpen === 'vine' && bcType === 'basic') ? (
              <div className={css.greenText}>
                <FormattedMessage
                  id="SubscriptionsPage.wontChargeUntil"
                  values={{ renewalDate: renewalDate.toLocaleDateString() }}
                />
              </div>
            ) : null}
          </div>

          {createSubscriptionError && (
            <p className={css.error}>
              <FormattedMessage id="SubscriptionsPage.reactivateSubscriptionError" />
            </p>
          )}
          <Button
            inProgress={createSubscriptionInProgress || updateSubscriptionInProgress}
            onClick={handleReactivateSubscription}
            // className={css.reactivateModalButton}
          >
            Reactivate
          </Button>
        </Modal>
      ) : null}
    </>
  );
};

SubscriptionsPageComponent.defaultProps = {
  createBankAccountError: null,
  createBankAccountInProgress: false,
  createBankAccountSuccess: false,
  createCreditCardError: null,
  createCreditCardInProgress: false,
  createCreditCardSuccess: false,
  createStripeCustomerError: null,
  currentUser: null,
  defaultPaymentFetched: false,
  defaultPaymentMethods: null,
  deletePaymentMethodError: null,
  deletePaymentMethodInProgress: false,
  deletePaymentMethodSuccess: false,
  fetchDefaultPaymentError: null,
  fetchDefaultPaymentInProgress: false,
  stripeCustomerFetched: false,
};

SubscriptionsPageComponent.propTypes = {
  createBankAccountError: propTypes.error,
  createBankAccountInProgress: bool,
  createBankAccountSuccess: bool,
  createCreditCardError: propTypes.error,
  createCreditCardInProgress: bool,
  createCreditCardSuccess: bool,
  createStripeCustomerError: propTypes.error,
  currentUser: propTypes.currentUser,
  defaultPaymentFetched: bool,
  defaultPaymentMethods: object,
  deletePaymentMethodError: propTypes.error,
  deletePaymentMethodInProgress: bool,
  deletePaymentMethodSuccess: bool,
  fetchDefaultPaymentError: propTypes.error,
  fetchDefaultPaymentInProgress: bool,
  scrollingDisabled: bool.isRequired,
  stripeCustomerFetched: bool,

  onManageDisableScrolling: func.isRequired,
  onDeletePaymentMethod: func.isRequired,
  onFetchDefaultPayment: func.isRequired,
  onCreateCreditCard: func.isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  const { currentUser } = state.user;

  const {
    cancelSubscriptionInProgress,
    cancelSubscriptionError,
    createSubscriptionError,
    createSubscriptionInProgress,
    subscription,
    updateSubscriptionError,
    updateSubscriptionInProgress,
  } = state.stripe;

  const {
    createCreditCardError,
    createCreditCardInProgress,
    createCreditCardSuccess,
    createStripeCustomerError,
    deletePaymentMethodError,
    deletePaymentMethodInProgress,
    deletePaymentMethodSuccess,
  } = state.paymentMethods;

  const {
    defaultPaymentFetched,
    defaultPaymentMethods,
    fetchDefaultPaymentError,
    fetchDefaultPaymentInProgress,
    stripeCustomerFetched,
  } = state.SubscriptionsPage;

  return {
    createCreditCardError,
    createCreditCardInProgress,
    createCreditCardSuccess,
    createStripeCustomerError,
    currentUser,
    defaultPaymentFetched,
    defaultPaymentMethods,
    deletePaymentMethodError,
    deletePaymentMethodInProgress,
    deletePaymentMethodSuccess,
    fetchDefaultPaymentError,
    fetchDefaultPaymentInProgress,
    scrollingDisabled: isScrollingDisabled(state),
    stripeCustomerFetched,
    cancelSubscriptionInProgress,
    cancelSubscriptionError,
    createSubscriptionError,
    createSubscriptionInProgress,
    newSubscription: subscription,
    updateSubscriptionError,
    updateSubscriptionInProgress,
  };
};

const mapDispatchToProps = dispatch => ({
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
  onDeletePaymentMethod: paymentMethodId => dispatch(deletePaymentMethod(paymentMethodId)),
  onFetchDefaultPayment: stripeCustomerId => dispatch(fetchDefaultPayment(stripeCustomerId)),
  onCreateCreditCard: (stripeCustomerId, stripe, billingDetails, card) =>
    dispatch(createCreditCard(stripeCustomerId, stripe, billingDetails, card)),
  onCancelSubscription: subscriptionId => dispatch(cancelSubscription(subscriptionId)),
  onUpdateSubscription: (subscriptionId, params) =>
    dispatch(updateSubscription(subscriptionId, params)),
  onCreateSubscription: (stripeCustomerId, stripe, card, params) =>
    dispatch(createSubscription(stripeCustomerId, stripe, card, params)),
  onFetchCurrentUser: () => dispatch(fetchCurrentUser()),
});

const SubscriptionsPage = compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(SubscriptionsPageComponent);

export default SubscriptionsPage;
