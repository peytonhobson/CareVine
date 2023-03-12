import React, { useState } from 'react';

import { compose } from 'redux';
import { connect } from 'react-redux';

import { fetchCurrentUser } from '../../ducks/user.duck';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { ensureCurrentUser, ensureStripeCustomer, ensurePaymentMethodCard } from '../../util/data';
import { createCreditCard } from '../../ducks/paymentMethods.duck';
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
} from '../../components';
import ReactivateSubscriptionPaymentModal from './Modals/ReactivateSubscriptionPaymentModal';
import ReactivateSubscriptionModal from './Modals/ReactivateSubscriptionModal';
import CancelSubscriptionModal from './Modals/CancelSubscriptionModal';
import { TopbarContainer } from '../../containers';
import { SaveCreditCardForm } from '../../forms';
import { fetchDefaultPayment } from './SubscriptionsPage.duck.js';
import {
  cancelSubscription,
  updateSubscription,
  createSubscription,
  createFutureSubscription,
  cancelFutureSubscription,
} from '../../ducks/stripe.duck';
import SubscriptionCard from './SubscriptionCard';
import { CAREVINE_GOLD_PRICE_ID, BASIC_CHECK_PRICE_ID } from '../../util/constants';

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
    onCancelSubscription,
    onUpdateSubscription,
    onCreateSubscription,
    createSubscriptionError,
    createSubscriptionInProgress,
    updateSubscriptionError,
    updateSubscriptionInProgress,
    onFetchCurrentUser,
    onCreateFutureSubscription,
    onCancelFutureSubscription,
  } = props;

  const [isEditCardModalOpen, setIsEditCardModalOpen] = useState(false);
  const [isCancelSubscriptionModalOpen, setIsCancelSubscriptionModalOpen] = useState(false);
  const [isReactivateSubscriptionModalOpen, setIsReactivateSubscriptionModalOpen] = useState(false);
  const [
    isReactivateSubscriptionPaymentModalOpen,
    setIsReactivateSubscriptionPaymentModalOpen,
  ] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(false);

  const ensuredCurrentUser = ensureCurrentUser(currentUser);

  const card =
    !!defaultPaymentMethods && !!defaultPaymentMethods.card && defaultPaymentMethods.card.card;
  const stripeCustomer = ensureStripeCustomer(ensuredCurrentUser.stripeCustomer);
  const stripeCustomerId = stripeCustomer.attributes.stripeCustomerId;
  const backgroundCheckSubscription =
    ensuredCurrentUser.attributes.profile.metadata &&
    ensuredCurrentUser.attributes.profile.metadata.backgroundCheckSubscription;
  const backgroundCheckSubscriptionSchedule =
    ensuredCurrentUser.attributes.profile.privateData &&
    ensuredCurrentUser.attributes.profile.privateData.backgroundCheckSubscriptionSchedule;

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
    stripeCustomerId && onFetchDefaultPayment(stripeCustomerId);
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

  // Set subscription to cancel at period end
  const handleCancelSubscription = () => {
    if (bcStatus === 'active' || bcStatus === 'past_due') {
      const params = { cancel_at_period_end: true };
      onUpdateSubscription(backgroundCheckSubscription.subscriptionId, params).then(() => {
        setFetchingUser(true);
        setTimeout(() => {
          onFetchCurrentUser().then(() => {
            setFetchingUser(false);
          });
        }, 1000);
        setIsCancelSubscriptionModalOpen(false);
      });
    }
  };

  const handleCancelFutureSubscription = () => {
    onCancelFutureSubscription(backgroundCheckSubscriptionSchedule.scheduleId).then(() => {
      setFetchingUser(true);
      setTimeout(() => {
        onFetchCurrentUser().then(() => {
          setFetchingUser(false);
        });
      }, 1000);
      setIsCancelSubscriptionModalOpen(false);
    });
  };

  const handleReactivateSubscription = () => {
    const changeSubscription = bcType !== isReactivateSubscriptionPaymentModalOpen;
    const priceId =
      isReactivateSubscriptionPaymentModalOpen == VINE
        ? CAREVINE_GOLD_PRICE_ID
        : BASIC_CHECK_PRICE_ID;
    const cardId =
      defaultPaymentMethods && defaultPaymentMethods.card && defaultPaymentMethods.card.id;

    // bcStatus being active indicates the user's subscription is set to cancel, but has not reached the end of the billing period.
    if (bcStatus === 'active') {
      if (changeSubscription) {
        /*
         * If the user is changing their subscription type from Vine to Basic, we need to update the current subscription
         * to cancel at the end of the billing period, and then create a new subscription with the new type. If they are doing the opposite,
         * we need to cancel the current subscription immediately and create a new one.
         */
        if (isReactivateSubscriptionPaymentModalOpen === BASIC) {
          const updateParams = {
            cancel_at_period_end: true,
          };

          onUpdateSubscription(backgroundCheckSubscription.subscriptionId, updateParams).then(
            () => {
              onCreateFutureSubscription(
                stripeCustomerId,
                backgroundCheckSubscription.currentPeriodEnd + 1000,
                priceId,
                ensuredCurrentUser.id.uuid
              )
                .then(() => {
                  setFetchingUser(true);
                  setTimeout(() => {
                    onFetchCurrentUser().then(() => {
                      setFetchingUser(false);
                    });
                  }, 1000);

                  setIsReactivateSubscriptionPaymentModalOpen(false);
                })
                .catch(e => console.log(e));
            }
          );
        } else {
          const params = { default_payment_method: cardId, cancel_at_period_end: false };

          onCancelSubscription(backgroundCheckSubscription.subscriptionId).then(() => {
            onCreateSubscription(
              stripeCustomerId,
              priceId,
              ensuredCurrentUser.id.uuid,
              params,
              true
            ).then(() => {
              setFetchingUser(true);
              setTimeout(() => {
                onFetchCurrentUser().then(() => {
                  setFetchingUser(false);
                });
              }, 1000);

              setIsReactivateSubscriptionPaymentModalOpen(false);
            });
          });
        }
      } else {
        const params = { cancel_at_period_end: false };
        onUpdateSubscription(backgroundCheckSubscription.subscriptionId, params).then(() => {
          setFetchingUser(true);
          setTimeout(() => {
            onFetchCurrentUser().then(() => {
              setFetchingUser(false);
            });
          }, 1000);
          setIsReactivateSubscriptionPaymentModalOpen(false);
        });
      }
    } else {
      const params = { default_payment_method: cardId, cancel_at_period_end: false };
      onCreateSubscription(
        stripeCustomerId,
        priceId,
        ensuredCurrentUser.id.uuid,
        params,
        true
      ).then(() => {
        setFetchingUser(true);
        setTimeout(() => {
          onFetchCurrentUser().then(() => {
            setFetchingUser(false);
          });
        }, 1000);
        setIsReactivateSubscriptionPaymentModalOpen(false);
      });
    }
  };

  const renewalDate =
    backgroundCheckSubscription &&
    backgroundCheckSubscription.currentPeriodEnd &&
    new Date(backgroundCheckSubscription.currentPeriodEnd * 1000);
  const amount = backgroundCheckSubscription && backgroundCheckSubscription.amount;

  const currentSubscriptionButton = !backgroundCheckSubscriptionSchedule ? (
    bcStatus === 'active' && !cancelAtPeriodEnd ? (
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

  const bcSubscriptionContent = fetchingUser ? (
    <div className={css.spinnerContainer}>
      <IconSpinner />
    </div>
  ) : backgroundCheckSubscription && bcStatusText ? (
    <SubscriptionCard title={backgroundCheckTitle} headerButton={currentSubscriptionButton}>
      <div className={css.subscriptionContentContainer}>
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

  const futureSubscriptionsContent = fetchingUser ? null : backgroundCheckSubscriptionSchedule &&
    backgroundCheckSubscriptionSchedule.startDate > todayTimestamp / 1000 ? (
    <div className={css.futureSubscriptions}>
      <SubscriptionCard title={futureSubscriptionTitle} headerButton={futureSubscriptionButton}>
        <div className={css.subscriptionContentContainer}>
          <div className={css.chargesContainer}>
            <h3>Upcoming Charges</h3>
            <p className={css.dateText}>
              {new Date(backgroundCheckSubscriptionSchedule.startDate * 1000).toLocaleDateString()}
            </p>
            <p className={css.amountText}>(${backgroundCheckSubscriptionSchedule.amount / 100})</p>
          </div>
          <div>
            <h3>Plan Information</h3>
            <p>
              Type:&nbsp;
              {backgroundCheckSubscriptionSchedule.type === VINE ? (
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
            currentUser={ensuredCurrentUser}
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
        />
      ) : null}
    </>
  );
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
  } = state.paymentMethods;

  const {
    defaultPaymentFetched,
    defaultPaymentMethods,
    fetchDefaultPaymentError,
    fetchDefaultPaymentInProgress,
    stripeCustomerFetched,
  } = state.SubscriptionsPage;

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
    newSubscription: subscription,
    scrollingDisabled: isScrollingDisabled(state),
    stripeCustomerFetched,
    updateSubscriptionError,
    updateSubscriptionInProgress,
  };
};

const mapDispatchToProps = dispatch => ({
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
  onFetchDefaultPayment: stripeCustomerId => dispatch(fetchDefaultPayment(stripeCustomerId)),
  onCreateCreditCard: (stripeCustomerId, stripe, billingDetails, card) =>
    dispatch(createCreditCard(stripeCustomerId, stripe, billingDetails, card)),
  onCancelSubscription: subscriptionId => dispatch(cancelSubscription(subscriptionId)),
  onUpdateSubscription: (subscriptionId, params) =>
    dispatch(updateSubscription(subscriptionId, params)),
  onCreateSubscription: (stripeCustomerId, stripe, card, params, payImmediate) =>
    dispatch(createSubscription(stripeCustomerId, stripe, card, params, payImmediate)),
  onFetchCurrentUser: () => dispatch(fetchCurrentUser()),
  onCreateFutureSubscription: (stripeCustomerId, startDate, priceId, userId) =>
    dispatch(createFutureSubscription(stripeCustomerId, startDate, priceId, userId)),
  onCancelFutureSubscription: scheduleId => dispatch(cancelFutureSubscription(scheduleId)),
});

const SubscriptionsPage = compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(SubscriptionsPageComponent);

export default SubscriptionsPage;
