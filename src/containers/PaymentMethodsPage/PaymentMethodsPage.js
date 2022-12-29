import React, { useState, useEffect } from 'react';
import { bool, func, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { ensureCurrentUser, ensureStripeCustomer, ensurePaymentMethodCard } from '../../util/data';
import { propTypes } from '../../util/types';
import { savePaymentMethod, deletePaymentMethod } from '../../ducks/paymentMethods.duck';
import { handleCardSetup } from '../../ducks/stripe.duck';
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
  SavedBankDetails,
} from '../../components';
import { TopbarContainer } from '../../containers';
import { PaymentMethodsForm, SaveBankAccountForm } from '../../forms';
import {
  createStripeSetupIntent,
  stripeCustomer,
  fetchDefaultPayment,
} from './PaymentMethodsPage.duck.js';
import config from '../../config';

import css from './PaymentMethodsPage.module.css';

const BANK_ACCOUNT = 'Bank Account';
const CREDIT_CARD = 'Payment Card';

const stripePromise = loadStripe(config.stripe.publishableKey);

const PaymentMethodsPageComponent = props => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    currentUser,
    addPaymentMethodError,
    deletePaymentMethodError,
    createStripeCustomerError,
    handleCardSetupError,
    deletePaymentMethodInProgress,
    onCreateSetupIntent,
    onHandleCardSetup,
    onSavePaymentMethod,
    onDeletePaymentMethod,
    fetchStripeCustomer,
    scrollingDisabled,
    onManageDisableScrolling,
    intl,
    stripeCustomerFetched,
    defaultPaymentMethods,
    defaultPaymentFetched,
    fetchDefaultPaymentError,
    fetchDefaultPaymentInProgress,
    onFetchDefaultPayment,
  } = props;

  const ensuredCurrentUser = ensureCurrentUser(currentUser);

  const getClientSecret = setupIntent => {
    return setupIntent && setupIntent.attributes ? setupIntent.attributes.clientSecret : null;
  };
  const getPaymentParams = (currentUser, formValues) => {
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

    const paymentParams = {
      payment_method_data: {
        billing_details: billingDetails,
      },
    };

    return paymentParams;
  };

  const card =
    !!defaultPaymentMethods && !!defaultPaymentMethods.card && defaultPaymentMethods.card.card;
  const bankAccount =
    !!defaultPaymentMethods &&
    !!defaultPaymentMethods.bankAccount &&
    defaultPaymentMethods.bankAccount.us_bank_account;

  const handleSubmit = params => {
    setIsSubmitting(true);
    const stripeCustomer = ensuredCurrentUser.stripeCustomer;
    const { stripe, card, formValues } = params;

    onCreateSetupIntent()
      .then(setupIntent => {
        const stripeParams = {
          stripe,
          card,
          setupIntentClientSecret: getClientSecret(setupIntent),
          paymentParams: getPaymentParams(currentUser, formValues),
        };

        return onHandleCardSetup(stripeParams);
      })
      .then(result => {
        const newPaymentMethod = result.setupIntent.payment_method;
        // Note: stripe.handleCardSetup might return an error inside successful call (200), but those are rejected in thunk functions.

        return onSavePaymentMethod(stripeCustomer, newPaymentMethod);
      })
      .then(() => {
        // Update currentUser entity and its sub entities: stripeCustomer and defaultPaymentMethod
        fetchStripeCustomer();
        setIsSubmitting(false);
      })
      .catch(error => {
        console.error(error);
        setIsSubmitting(false);
      });
  };

  const handleRemovePaymentMethod = methodType => {
    if (methodType === 'card') {
      onDeletePaymentMethod(
        !!defaultPaymentMethods && !!defaultPaymentMethods.card && defaultPaymentMethods.card.id
      );
    } else {
      onDeletePaymentMethod(
        !!defaultPaymentMethods &&
          !!defaultPaymentMethods.bankAccount &&
          defaultPaymentMethods.bankAccount.id
      );
    }
  };

  const title = intl.formatMessage({ id: 'PaymentMethodsPage.title' });

  const currentUserLoaded = !!ensuredCurrentUser.id;

  const hasDefaultPaymentMethod =
    currentUser &&
    ensureStripeCustomer(currentUser.stripeCustomer).attributes.stripeCustomerId &&
    ensurePaymentMethodCard(currentUser.stripeCustomer.defaultPaymentMethod).id;

  // Get first and last name of the current user and use it in the StripePaymentForm to autofill the name field
  const userName = currentUserLoaded
    ? `${ensuredCurrentUser.attributes.profile.firstName} ${ensuredCurrentUser.attributes.profile.lastName}`
    : null;

  const initalValuesForStripePayment = { name: userName };

  const [selectedTab, setSelectedTab] = useState(BANK_ACCOUNT);

  const handleSelectedTab = e => {
    setSelectedTab(e.target.textContent);
  };

  const tabs = [
    {
      text: BANK_ACCOUNT,
      selected: selectedTab === BANK_ACCOUNT,
      onClick: handleSelectedTab,
    },
    {
      text: CREDIT_CARD,
      selected: selectedTab === CREDIT_CARD,
      onClick: handleSelectedTab,
    },
  ];

  useEffect(() => {
    ensuredCurrentUser.stripeCustomer &&
      onFetchDefaultPayment(currentUser.stripeCustomer.attributes.stripeCustomerId);
  }, [ensuredCurrentUser.stripeCustomer]);

  const showBankForm = !bankAccount && defaultPaymentFetched;
  const showCardForm = !card && defaultPaymentFetched;

  let tabContentPanel = null;

  switch (selectedTab) {
    case BANK_ACCOUNT:
      tabContentPanel = (
        <>
          {!!bankAccount ? (
            <SavedBankDetails
              bank={ensurePaymentMethodCard(bankAccount)}
              onManageDisableScrolling={onManageDisableScrolling}
              onDeleteAccount={handleRemovePaymentMethod}
              deletePaymentMethodInProgress={deletePaymentMethodInProgress}
            />
          ) : null}
          {showBankForm ? (
            <Elements stripe={stripePromise}>
              <SaveBankAccountForm onSubmit={() => {}} />
            </Elements>
          ) : null}
        </>
      );
      break;
    case CREDIT_CARD:
      tabContentPanel = (
        <>
          {!!card ? (
            <SavedCardDetails
              card={ensurePaymentMethodCard(card)}
              onManageDisableScrolling={onManageDisableScrolling}
              onDeleteCard={handleRemovePaymentMethod}
              deletePaymentMethodInProgress={deletePaymentMethodInProgress}
            />
          ) : null}
          {showCardForm ? (
            <PaymentMethodsForm
              className={css.paymentForm}
              formId="PaymentMethodsForm"
              initialValues={initalValuesForStripePayment}
              onSubmit={handleSubmit}
              handleRemovePaymentMethod={handleRemovePaymentMethod}
              hasDefaultPaymentMethod={hasDefaultPaymentMethod}
              addPaymentMethodError={addPaymentMethodError}
              deletePaymentMethodError={deletePaymentMethodError}
              createStripeCustomerError={createStripeCustomerError}
              handleCardSetupError={handleCardSetupError}
              inProgress={isSubmitting}
            />
          ) : null}
        </>
      );
      break;
    default:
      tabContentPanel = null;
      break;
  }

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSideNavigation>
        <LayoutWrapperTopbar>
          <TopbarContainer
            currentPage="PaymentMethodsPage"
            desktopClassName={css.desktopTopbar}
            mobileClassName={css.mobileTopbar}
          />
          <UserNav selectedPageName="PaymentMethodsPage" />
        </LayoutWrapperTopbar>
        <LayoutWrapperAccountSettingsSideNav
          currentTab="PaymentMethodsPage"
          currentUser={currentUser}
        />
        <LayoutWrapperMain>
          <div className={css.content}>
            <h1 className={css.title}>
              <FormattedMessage id="PaymentMethodsPage.heading" />
            </h1>
            <ButtonTabNavHorizontal
              tabs={tabs}
              rootClassName={css.nav}
              tabRootClassName={css.tabRoot}
              tabContentClass={css.tabContent}
              tabClassName={css.tab}
            />
            {!defaultPaymentFetched ? null : (
              <div className={css.tabContentPanel}>{tabContentPanel}</div>
            )}
          </div>
        </LayoutWrapperMain>
        <LayoutWrapperFooter>
          <Footer />
        </LayoutWrapperFooter>
      </LayoutSideNavigation>
    </Page>
  );
};

PaymentMethodsPageComponent.defaultProps = {
  currentUser: null,
  addPaymentMethodError: null,
  deletePaymentMethodError: null,
  createStripeCustomerError: null,
  handleCardSetupError: null,
  defaultPaymentMethods: null,
  defaultPaymentFetched: false,
  fetchDefaultPaymentError: null,
  fetchDefaultPaymentInProgress: false,
};

PaymentMethodsPageComponent.propTypes = {
  currentUser: propTypes.currentUser,
  scrollingDisabled: bool.isRequired,
  addPaymentMethodError: object,
  deletePaymentMethodError: object,
  createStripeCustomerError: object,
  handleCardSetupError: object,
  defaultPaymentMethods: object,
  defaultPaymentFetched: bool,
  fetchDefaultPaymentError: propTypes.error,
  fetchDefaultPaymentInProgress: bool,
  onCreateSetupIntent: func.isRequired,
  onHandleCardSetup: func.isRequired,
  onSavePaymentMethod: func.isRequired,
  onDeletePaymentMethod: func.isRequired,
  fetchStripeCustomer: func.isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  const { currentUser } = state.user;

  const {
    deletePaymentMethodInProgress,
    addPaymentMethodError,
    deletePaymentMethodError,
    createStripeCustomerError,
  } = state.paymentMethods;

  const {
    stripeCustomerFetched,
    defaultPaymentMethods,
    defaultPaymentFetched,
    fetchDefaultPaymentError,
    fetchDefaultPaymentInProgress,
  } = state.PaymentMethodsPage;

  const { handleCardSetupError } = state.stripe;
  return {
    currentUser,
    scrollingDisabled: isScrollingDisabled(state),
    deletePaymentMethodInProgress,
    addPaymentMethodError,
    deletePaymentMethodError,
    createStripeCustomerError,
    handleCardSetupError,
    stripeCustomerFetched,
    defaultPaymentMethods,
    defaultPaymentFetched,
    fetchDefaultPaymentError,
    fetchDefaultPaymentInProgress,
  };
};

const mapDispatchToProps = dispatch => ({
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
  fetchStripeCustomer: () => dispatch(stripeCustomer()),
  onHandleCardSetup: params => dispatch(handleCardSetup(params)),
  onCreateSetupIntent: params => dispatch(createStripeSetupIntent(params)),
  onSavePaymentMethod: (stripeCustomer, newPaymentMethod) =>
    dispatch(savePaymentMethod(stripeCustomer, newPaymentMethod)),
  onDeletePaymentMethod: paymentMethodId => dispatch(deletePaymentMethod(paymentMethodId)),
  onFetchDefaultPayment: stripeCustomerId => dispatch(fetchDefaultPayment(stripeCustomerId)),
});

const PaymentMethodsPage = compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(PaymentMethodsPageComponent);

export default PaymentMethodsPage;
