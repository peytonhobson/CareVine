import React, { useState } from 'react';

import { compose } from 'redux';
import { connect } from 'react-redux';

import { fetchCurrentUser } from '../../ducks/user.duck';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { ensureCurrentUser, ensureStripeCustomer, ensurePaymentMethodCard } from '../../util/data';
import { createCreditCard, fetchDefaultPayment } from '../../ducks/paymentMethods.duck';
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
  InlineTextButton,
  IconSpinner,
  Modal,
  NamedRedirect,
  GenericError,
} from '../../components';
import ReactivateSubscriptionPaymentModal from './Modals/ReactivateSubscriptionPaymentModal';
import ReactivateSubscriptionModal from './Modals/ReactivateSubscriptionModal';
import CancelSubscriptionModal from './Modals/CancelSubscriptionModal';
import { TopbarContainer } from '../../containers';
import { SaveCreditCardForm } from '../../forms';
import { retrieveUpcomingInvoice, updateSubscriptionItem } from './SubscriptionsPage.duck';
import { fetchCustomerCreditBalance } from '../ReferralPage/ReferralPage.duck';
import {
  cancelSubscription,
  updateSubscription,
  createSubscription,
  createFutureSubscription,
  cancelFutureSubscription,
} from '../../ducks/stripe.duck';
import SubscriptionCard from './SubscriptionCard';
import {
  CAREVINE_GOLD_PRICE_ID,
  CAREVINE_BASIC_PRICE_ID,
  SUBSCRIPTION_ACTIVE_TYPES,
  EMPLOYER,
} from '../../util/constants';

import css from './SubscriptionsPage.module.css';
import { useEffect } from 'react';

const VINE = 'vine';
const BASIC = 'basic';

const TODAY = new Date();
const todayTimestamp = TODAY.getTime();

const getBillingDetails = (currentUser, formValues) => {
  const { name, addressLine1, addressLine2, postal, city } = formValues;
  const addressMaybe =
    addressLine1 && postal
      ? {
          address: {
            city: city,
            country: 'US',
            line1: addressLine1,
            line2: addressLine2,
            postal_code: postal,
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
    fetchDefaultPaymentError,
    handleCardSetupError,
    intl,
    onCreateCreditCard,
    onFetchDefaultPayment,
    onManageDisableScrolling,
    scrollingDisabled,
    cancelSubscriptionInProgress,
    cancelSubscriptionError,
    onUpdateSubscription,
    onCreateSubscription,
    createSubscriptionError,
    createSubscriptionInProgress,
    updateSubscriptionError,
    updateSubscriptionInProgress,
    onFetchCurrentUser,
    onCreateFutureSubscription,
    onCancelFutureSubscription,
    onUpdateSubscriptionItem,
    currentUserListing,
    onFetchCustomerCreditBalance,
    customerCreditBalance,
    upcomingInvoice,
    upcomingInvoiceError,
    onFetchUpcomingInvoice,
    fetchDefaultPaymentInProgress,
  } = props;

  const [isEditCardModalOpen, setIsEditCardModalOpen] = useState(false);
  const [isCancelSubscriptionModalOpen, setIsCancelSubscriptionModalOpen] = useState(false);
  const [isReactivateSubscriptionModalOpen, setIsReactivateSubscriptionModalOpen] = useState(false);
  const [
    isReactivateSubscriptionPaymentModalOpen,
    setIsReactivateSubscriptionPaymentModalOpen,
  ] = useState(false);
  const [fetchingUserInterval, setFetchingUserInterval] = useState(false);

  const ensuredCurrentUser = ensureCurrentUser(currentUser);

  const card = defaultPaymentMethods?.card?.card;
  const stripeCustomer = ensureStripeCustomer(ensuredCurrentUser.stripeCustomer);
  const stripeCustomerId = stripeCustomer.attributes.stripeCustomerId;
  const backgroundCheckSubscription =
    ensuredCurrentUser.attributes.profile.metadata?.backgroundCheckSubscription;
  const backgroundCheckSubscriptionSchedule =
    ensuredCurrentUser.attributes.profile.privateData?.backgroundCheckSubscriptionSchedule;

  const handleCardSubmit = params => {
    setIsSubmitting(true);

    const { stripe, card, formValues } = params;

    const billingDetails = getBillingDetails(currentUser, formValues);

    return onCreateCreditCard(stripeCustomerId, stripe, billingDetails, card)
      .then(() => {
        // Update default payment methods

        if (stripeCustomerId) {
          onFetchDefaultPayment(stripeCustomerId);
        } else {
          onFetchCurrentUser({ include: ['stripeCustomer'] });
        }
        setIsSubmitting(false);
      })
      .catch(error => {
        console.error(error);
        setIsSubmitting(false);
      });
  };

  useEffect(() => {
    if (stripeCustomerId) {
      onFetchDefaultPayment(stripeCustomerId);
      onFetchCustomerCreditBalance();
    }
  }, [stripeCustomerId]);

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
    case 'trialing':
      bcStatusText = <FormattedMessage id="SubscriptionsPage.trialing" />;
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
    case 'incomplete':
      bcStatusText = <FormattedMessage id="SubscriptionsPage.incomplete" />;
      break;
    case 'incomplete_expired':
      bcStatusText = <FormattedMessage id="SubscriptionsPage.incompleteExpired" />;
      break;
  }

  useEffect(() => {
    if (fetchingUserInterval) {
      clearInterval(fetchingUserInterval);
      setFetchingUserInterval(null);
    }
  }, [
    backgroundCheckSubscription?.cancelAtPeriodEnd,
    backgroundCheckSubscription?.status,
    backgroundCheckSubscriptionSchedule?.status,
    backgroundCheckSubscription?.type,
  ]);

  const createFetchUserInterval = () => {
    setFetchingUserInterval(
      setInterval(() => {
        onFetchCurrentUser();
        onFetchUpcomingInvoice(stripeCustomerId);
      }, 300)
    );

    setTimeout(() => {
      clearInterval(fetchingUserInterval);
      setFetchingUserInterval(null);
    }, 5000);
  };

  // Set subscription to cancel at period end
  const handleCancelSubscription = async () => {
    if (SUBSCRIPTION_ACTIVE_TYPES.includes(bcStatus) || bcStatus === 'past_due') {
      const params = { cancel_at_period_end: true };

      try {
        const response = await onUpdateSubscription(
          backgroundCheckSubscription.subscriptionId,
          params
        );

        createFetchUserInterval();
        setIsCancelSubscriptionModalOpen(false);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleCancelFutureSubscription = async () => {
    try {
      const response = await onCancelFutureSubscription(
        backgroundCheckSubscriptionSchedule.scheduleId
      );

      createFetchUserInterval();
      setIsCancelSubscriptionModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReactivateSubscription = async () => {
    const changeSubscription = bcType !== isReactivateSubscriptionPaymentModalOpen;
    const priceId =
      isReactivateSubscriptionPaymentModalOpen === VINE
        ? CAREVINE_GOLD_PRICE_ID
        : CAREVINE_BASIC_PRICE_ID;
    const cardId =
      defaultPaymentMethods && defaultPaymentMethods.card && defaultPaymentMethods.card.id;

    // bcStatus being active indicates the user's subscription is set to cancel, but has not reached the end of the billing period.
    if (SUBSCRIPTION_ACTIVE_TYPES.includes(bcStatus)) {
      if (changeSubscription) {
        /*
         * If the user is changing their subscription type from Vine to Basic, we need to update the current subscription
         * to cancel at the end of the billing period, and then create a new subscription with the new type. If they are doing the opposite,
         * we need to cancel the current subscription immediately and create a new one.
         */
        if (isReactivateSubscriptionPaymentModalOpen === BASIC) {
          try {
            await onCreateFutureSubscription(
              stripeCustomerId,
              // Start subscription a minute after the current period ends so subscription canceled in webhook happens prior to this
              // Stripe does unix timestamps in seconds, so we add 60 seconds to the current period end
              backgroundCheckSubscription.currentPeriodEnd + 60,
              priceId,
              ensuredCurrentUser.id.uuid
            );

            createFetchUserInterval();
            setIsReactivateSubscriptionPaymentModalOpen(false);
          } catch (e) {
            console.log(e);
          }
        } else {
          // Upgrade current subscription from basic to gold
          const subscriptionId = backgroundCheckSubscription.subscriptionId;
          const subscriptionItemId = backgroundCheckSubscription.subscriptionItemId;
          const params = {
            cancel_at_period_end: false,
            items: [{ id: subscriptionItemId, price: priceId }],
            billing_cycle_anchor: 'now',
            proration_behavior: 'none',
          };

          onUpdateSubscription(subscriptionId, params).then(() => {
            createFetchUserInterval();
            setIsReactivateSubscriptionPaymentModalOpen(false);
          });
        }
      } else {
        // Reactive canceled subscription that hasn't reached the end of the billing period
        const params = { cancel_at_period_end: false };

        try {
          await onUpdateSubscription(backgroundCheckSubscription.subscriptionId, params);

          createFetchUserInterval();
          setIsReactivateSubscriptionPaymentModalOpen(false);
        } catch (e) {
          console.log(e);
        }
      }
    } else {
      // Create new subscription
      const params = { default_payment_method: cardId, cancel_at_period_end: false };

      try {
        await onCreateSubscription(
          stripeCustomerId,
          priceId,
          ensuredCurrentUser.id.uuid,
          params,
          true
        );

        createFetchUserInterval();
        onFetchUpcomingInvoice(stripeCustomerId);
        setIsReactivateSubscriptionPaymentModalOpen(false);
      } catch (e) {
        console.log(e);
      }
    }
  };

  const renewalDate =
    backgroundCheckSubscription?.currentPeriodEnd &&
    new Date(backgroundCheckSubscription.currentPeriodEnd * 1000);
  const amount = upcomingInvoice?.amount_due / 100;

  const currentSubscriptionButton = !backgroundCheckSubscriptionSchedule ? (
    SUBSCRIPTION_ACTIVE_TYPES.includes(bcStatus) && !cancelAtPeriodEnd ? (
      <>
        {bcType === BASIC && (
          <InlineTextButton
            className={css.upgradeButton}
            onClick={() => {
              setIsReactivateSubscriptionPaymentModalOpen(VINE);
            }}
          >
            <FormattedMessage id="SubscriptionsPage.upgradeButton" />
          </InlineTextButton>
        )}
        <InlineTextButton
          className={css.cancelButton}
          onClick={() => {
            setIsCancelSubscriptionModalOpen(true);
          }}
        >
          <FormattedMessage id="SubscriptionsPage.cancelButton" />
        </InlineTextButton>
      </>
    ) : (
      <InlineTextButton
        className={css.reactivateButton}
        onClick={() => {
          setIsReactivateSubscriptionModalOpen(true);
        }}
      >
        <FormattedMessage id="SubscriptionsPage.reactivateButton" />
      </InlineTextButton>
    )
  ) : null;

  const futureSubscriptionButton = (
    <InlineTextButton
      className={css.cancelButton}
      onClick={() => {
        setIsCancelSubscriptionModalOpen('future');
      }}
    >
      <FormattedMessage id="SubscriptionsPage.cancelButton" />
    </InlineTextButton>
  );

  const bcSubscriptionContent = fetchingUserInterval ? (
    <div className={css.spinnerContainer}>
      <IconSpinner />
    </div>
  ) : backgroundCheckSubscription && bcStatusText ? (
    <SubscriptionCard title={backgroundCheckTitle} headerButton={currentSubscriptionButton}>
      <div className={css.subscriptionContentContainer}>
        {upcomingInvoice?.amount_due && !backgroundCheckSubscriptionSchedule ? (
          <div className={css.chargesContainer}>
            <h3>Upcoming Charges</h3>
            <p className={css.dateText}>{renewalDate && renewalDate.toLocaleDateString()}</p>
            <p className={css.amountText}>(${amount})</p>
          </div>
        ) : null}
        <div className={css.planInfoContainer}>
          <h3>Plan Information</h3>
          <p>
            Type:&nbsp;
            {backgroundCheckSubscription.type === VINE ? (
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
      </div>
    </SubscriptionCard>
  ) : (
    <h2 className={css.title}>No Current Subscriptions</h2>
  );

  const futureSubscriptionTitle = intl.formatMessage({
    id: 'SubscriptionsPage.futureSubscriptionsTitle',
  });

  const futureSubscriptionAmountDue = upcomingInvoice?.amount_due / 100;
  const futureSubscriptionsContent = fetchingUserInterval ? null : backgroundCheckSubscriptionSchedule &&
    backgroundCheckSubscriptionSchedule?.startDate > todayTimestamp / 1000 ? (
    <div className={css.futureSubscriptions}>
      <SubscriptionCard title={futureSubscriptionTitle} headerButton={futureSubscriptionButton}>
        <div className={css.subscriptionContentContainer}>
          <div className={css.chargesContainer}>
            <h3>Upcoming Charges</h3>
            <p className={css.dateText}>
              {new Date(backgroundCheckSubscriptionSchedule?.startDate * 1000).toLocaleDateString()}
            </p>
            <p className={css.amountText}>(${futureSubscriptionAmountDue})</p>
          </div>
          <div>
            <h3>Plan Information</h3>
            <p>
              Type:&nbsp;
              {backgroundCheckSubscriptionSchedule?.type === VINE ? (
                <FormattedMessage id="SubscriptionsPage.vineCheck" />
              ) : (
                <FormattedMessage id="SubscriptionsPage.basicCheck" />
              )}
            </p>
          </div>
        </div>
      </SubscriptionCard>
    </div>
  ) : null;

  console.log(stripeCustomer);

  const cardContent = card ? (
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
      formId="PaymentMethodsForm"
      handleCardSetupError={handleCardSetupError}
      initialValues={initalValuesForStripePayment}
      inProgress={isSubmitting}
      onSubmit={handleCardSubmit}
    />
  ) : fetchDefaultPaymentInProgress ? (
    <div className={css.spinnerContainer}>
      <IconSpinner />
      <span className={css.loadingText}>Loading payment info...</span>
    </div>
  ) : null;

  if (ensuredCurrentUser?.attributes?.profile?.metadata?.userType === EMPLOYER) {
    return <NamedRedirect name="LandingPage" />;
  }

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
            <UserNav selectedPageName="SubscriptionsPage" listing={currentUserListing} />
          </LayoutWrapperTopbar>
          <LayoutWrapperAccountSettingsSideNav
            currentTab="SubscriptionsPage"
            currentUser={ensuredCurrentUser}
            currentUserListing={currentUserListing}
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
              {futureSubscriptionsContent}
              {stripeCustomer?.id ? (
                <>
                  <h2 className={css.subheading}>
                    <FormattedMessage id="SubscriptionsPage.paymentInformation" />
                  </h2>

                  {cardContent}
                </>
              ) : null}
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
            formId="PaymentMethodsForm"
            handleCardSetupError={handleCardSetupError}
            initialValues={initalValuesForStripePayment}
            inProgress={isSubmitting}
            onSubmit={values => {
              handleCardSubmit(values).then(() => {
                setTimeout(() => {
                  setIsEditCardModalOpen(false);
                }, 500);
              });
            }}
          />
        </Modal>
      ) : null}
      {onManageDisableScrolling ? (
        <CancelSubscriptionModal
          isOpen={!!isCancelSubscriptionModalOpen}
          openType={isCancelSubscriptionModalOpen}
          onManageDisableScrolling={onManageDisableScrolling}
          updateSubscriptionError={updateSubscriptionError}
          updateSubscriptionInProgress={updateSubscriptionInProgress}
          handleCancelSubscription={handleCancelSubscription}
          handleCancelFutureSubscription={handleCancelFutureSubscription}
          onClose={() => setIsCancelSubscriptionModalOpen(false)}
        />
      ) : null}
      {onManageDisableScrolling ? (
        <ReactivateSubscriptionModal
          isOpen={!!isReactivateSubscriptionModalOpen}
          onManageDisableScrolling={onManageDisableScrolling}
          bcType={bcType}
          switchPlans={() => {
            setIsReactivateSubscriptionModalOpen(false);
            setIsReactivateSubscriptionPaymentModalOpen(bcType === VINE ? BASIC : VINE);
          }}
          reactivateSubscription={() => {
            setIsReactivateSubscriptionModalOpen(false);
            setIsReactivateSubscriptionPaymentModalOpen(bcType === VINE ? VINE : BASIC);
          }}
          onClose={() => setIsReactivateSubscriptionModalOpen(false)}
        />
      ) : null}
      {onManageDisableScrolling ? (
        <ReactivateSubscriptionPaymentModal
          isOpen={!!isReactivateSubscriptionPaymentModalOpen}
          openType={isReactivateSubscriptionPaymentModalOpen}
          onClose={() => setIsReactivateSubscriptionPaymentModalOpen(false)}
          onManageDisableScrolling={onManageDisableScrolling}
          onFetchDefaultPayment={onFetchDefaultPayment}
          stripeCustomer={stripeCustomer}
          card={card}
          renewalDate={renewalDate}
          bcType={bcType}
          createSubscriptionError={createSubscriptionError}
          createSubscriptionInProgress={createSubscriptionInProgress}
          updateSubscriptionInProgress={updateSubscriptionInProgress}
          updateSubscriptionError={updateSubscriptionError}
          cancelSubscriptionInProgress={cancelSubscriptionInProgress}
          cancelSubscriptionError={cancelSubscriptionError}
          handleReactivateSubscription={handleReactivateSubscription}
          bcStatus={bcStatus}
          cancelAtPeriodEnd={cancelAtPeriodEnd}
          customerCreditBalance={customerCreditBalance}
        />
      ) : null}
      <GenericError
        show={upcomingInvoiceError}
        errorText="Failed to retrieve upcoming invoice amount."
      />
    </>
  );
};

const mapStateToProps = state => {
  const { currentUser, currentUserListing } = state.user;

  const {
    cancelSubscriptionInProgress,
    cancelSubscriptionError,
    createSubscriptionError,
    createSubscriptionInProgress,
    updateSubscriptionError,
    updateSubscriptionInProgress,
  } = state.stripe;

  const {
    createCreditCardError,
    createCreditCardInProgress,
    createCreditCardSuccess,
    createStripeCustomerError,
    defaultPaymentFetched,
    defaultPaymentMethods,
    fetchDefaultPaymentError,
    fetchDefaultPaymentInProgress,
  } = state.paymentMethods;

  const { stripeCustomerFetched, upcomingInvoice, upcomingInvoiceError } = state.SubscriptionsPage;
  const { customerCreditBalance } = state.ReferralPage;

  return {
    cancelSubscriptionError,
    cancelSubscriptionInProgress,
    createCreditCardError,
    createCreditCardInProgress,
    createCreditCardSuccess,
    createStripeCustomerError,
    createSubscriptionError,
    createSubscriptionInProgress,
    currentUser,
    defaultPaymentFetched,
    defaultPaymentMethods,
    fetchDefaultPaymentError,
    fetchDefaultPaymentInProgress,
    scrollingDisabled: isScrollingDisabled(state),
    stripeCustomerFetched,
    updateSubscriptionError,
    updateSubscriptionInProgress,
    currentUserListing,
    customerCreditBalance,
    upcomingInvoice,
    upcomingInvoiceError,
  };
};

const mapDispatchToProps = {
  onManageDisableScrolling: manageDisableScrolling,
  onFetchDefaultPayment: fetchDefaultPayment,
  onCreateCreditCard: createCreditCard,
  onCancelSubscription: cancelSubscription,
  onUpdateSubscription: updateSubscription,
  onCreateSubscription: createSubscription,
  onFetchCurrentUser: fetchCurrentUser,
  onCreateFutureSubscription: createFutureSubscription,
  onCancelFutureSubscription: cancelFutureSubscription,
  onUpdateSubscriptionItem: updateSubscriptionItem,
  onFetchCustomerCreditBalance: fetchCustomerCreditBalance,
  onFetchUpcomingInvoice: retrieveUpcomingInvoice,
};

const SubscriptionsPage = compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(SubscriptionsPageComponent);

export default SubscriptionsPage;
