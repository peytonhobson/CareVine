import React, { useState, useEffect, Fragment, useRef } from 'react';

import { arrayOf, bool, func, object, oneOfType, shape, string } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import classNames from 'classnames';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { injectIntl, intlShape, FormattedMessage } from '../../util/reactIntl';
import { Modal, UserListingPreview, IconConfirm, Button } from '../../components';
import { userDisplayNameAsString } from '../../util/data';
import { PaymentForm, PaymentDetailsForm } from '../../forms';
import {
  createPaymentIntent,
  confirmPayment,
  setInitialValues,
  initialState,
  hasStripeAccount,
  stripeCustomer,
  fetchDefaultPayment,
  sendNotifyForPayment,
} from './StripePaymentModal.duck';
import { propTypes } from '../../util/types';
import { manageDisableScrolling } from '../../ducks/UI.duck';
import NotifyForPaymentContainer from './NotifyForPaymentContainer';
import config from '../../config';

import css from './StripePaymentModal.module.css';

const stripePromise = loadStripe(config.stripe.publishableKey);

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

const StripePaymentModalComponent = props => {
  const {
    channelContext,
    channelUrl,
    confirmPaymentError,
    confirmPaymentInProgress,
    confirmPaymentSuccess,
    createPaymentIntentError,
    createPaymentIntentInProgress,
    currentUser,
    defaultPaymentMethods,
    defaultPaymentFetched,
    fetchDefaultPaymentError,
    fetchDefaultPaymentInProgress,
    fetchHasStripeAccount,
    fetchStripeCustomer,
    hasStripeAccount,
    hasStripeAccountError,
    hasStripeAccountFetched,
    hasStripeAccountInProgress,
    intl,
    isOpen,
    onClose,
    onConfirmPayment,
    onCreatePaymentIntent,
    onFetchDefaultPayment,
    onManageDisableScrolling,
    onSendNotifyForPayment,
    onSetInitialState,
    paymentIntent,
    provider,
    providerListing,
    sendbirdContext,
    sendNotifyForPaymentInProgress,
    sendNotifyForPaymentSuccess,
  } = props;

  const [clientSecret, setClientSecret] = useState(null);
  const [rootClass, setRootClass] = useState(classNames(css.root, css.single));
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const paymentFormRef = useRef(null);

  //TODO: Move this to load data?
  useEffect(() => {
    fetchStripeCustomer();
  }, []);

  useEffect(() => {
    provider && provider.id && fetchHasStripeAccount(provider.id);
  }, [provider]);

  useEffect(() => {
    if (paymentIntent) {
      setClientSecret(paymentIntent.client_secret);
      setRootClass(classNames(css.root, css.double));
      setTimeout(() => {
        setShowPaymentForm(true);
      }, '1500');
    }

    if (confirmPaymentSuccess) {
      setRootClass(classNames(css.root, css.confirmation));
    }
  }, [paymentIntent, confirmPaymentSuccess]);

  const onElementReady = () => {
    if (isMobile && paymentFormRef?.current) {
      setTimeout(() => {
        paymentFormRef.current.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }, 500);
    }
  };

  const onHandleReviewPayment = values => {
    const { amount, paymentMethod } = values;

    setSelectedPaymentMethod(paymentMethod);

    const isCard = paymentMethod === 'creditCard';

    const providerName = userDisplayNameAsString(provider);

    onCreatePaymentIntent(
      amount?.amount,
      provider?.id,
      currentUser,
      isCard,
      providerName,
      channelUrl
    );
  };

  const onHandlePaymentSubmit = (
    stripe,
    elements,
    saveMethodAsDefault,
    useDefaultMethod,
    methodType
  ) => {
    const defaultPaymentId =
      methodType === 'creditCard'
        ? defaultPaymentMethods?.card?.id
        : defaultPaymentMethods?.bankAccount?.id;
    const currentUserId = currentUser?.id?.uuid;
    const providerName = userDisplayNameAsString(provider);
    onConfirmPayment(
      stripe,
      elements,
      saveMethodAsDefault,
      defaultPaymentId,
      paymentIntent.id,
      useDefaultMethod,
      currentUserId,
      providerName,
      channelUrl,
      sendbirdContext,
      providerListing,
      methodType
    ).then(() => {
      if (isMobile) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  };

  const onHandleClose = () => {
    onClose();
    onSetInitialState();
  };

  const onHandleEditPaymentDetails = () => {
    setClientSecret(null);
    setRootClass(classNames(css.root, css.single));
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#568a6e',
      fontFamily: '"poppins", Helvetica, Arial, sans-serif',
      borderRadius: '2px',
    },
    rules: {
      '.Input': {
        display: 'flex',
        width: '100%',
        margin: '0',
        paddingLeft: '0',
        paddingBlock: isMobile ? '5px' : '4px',
        height: '24px',
        boxShadow: 'none',

        /* Borders */
        border: 'none',
        borderBottomWidth: '2px',
        borderBottomStyle: 'solid',
        borderBottomColor: '#4a4a4a',
        borderRadius: 0,
        transition: 'border-bottom-color ease-in 0.2s',
        fontFamily: '"poppins", Helvetica, Arial, sans-serif',
        fontSize: '16px',
        lineHeight: isMobile ? '24px' : '32px;',
        letterSpacing: '-0.1px',
        fontWeight: '500',
      },
      '.Input:hover, .Input:focus': {
        boxShadow: 'none',
        borderColor: '#568a6e',
      },
      '.Input::placeholder': {
        color: '#b2b2b2',
        fontWeight: '500',
        fontFamily: '"poppins", Helvetica, Arial, sans-serif',
      },
      '.Input--invalid': {
        boxShadow: 'none',
        borderBottomColor: '#ff0000',
        color: '#ff0000',
      },
      '.Error': {
        color: '#ff0000',
        fontFamily: '"poppins", Helvetica, Arial, sans-serif',
      },
      '.Label': {
        fontFamily: '"poppins", Helvetica, Arial, sans-serif',
        display: 'block',
        fontWeight: '600',
        fontSize: '14px',
        lineHeight: isMobile ? '18px' : '16px',
        letterSpacing: 0,
        marginTop: 0,
        marginBottom: 0,
        paddingTop: isMobile ? '0px' : '6px',
        color: '#4a4a4a',
      },
    },
  };

  const options = {
    clientSecret,
    appearance,
  };
  const closeButtonMessage = intl.formatMessage({ id: 'StripePaymentModal.closeButtonMessage' });
  const paymentConfirmedMessage = intl.formatMessage({
    id: 'StripePaymentModal.paymentConfirmedMessage',
  });

  return (
    <Fragment>
      {(hasStripeAccountFetched || confirmPaymentSuccess) && (
        <Modal
          closeButtonMessage={closeButtonMessage}
          containerClassName={css.modalContainer}
          id="stripePaymentModal"
          isOpen={isOpen}
          onClose={onHandleClose}
          onManageDisableScrolling={onManageDisableScrolling}
          usePortal
        >
          {(hasStripeAccount || confirmPaymentSuccess) && (
            <div className={rootClass}>
              {!confirmPaymentSuccess && (
                <div className={css.leftColumnContainer}>
                  <PaymentDetailsForm
                    clientSecret={clientSecret}
                    createPaymentIntentError={createPaymentIntentError}
                    createPaymentIntentInProgress={createPaymentIntentInProgress}
                    onEditPaymentDetails={onHandleEditPaymentDetails}
                    onSubmit={onHandleReviewPayment}
                    provider={provider}
                  />
                </div>
              )}
              {clientSecret && !confirmPaymentSuccess && (
                <div className={css.paymentElements} ref={paymentFormRef}>
                  {showPaymentForm && (
                    <Elements options={options} stripe={stripePromise}>
                      <PaymentForm
                        confirmPaymentError={confirmPaymentError}
                        confirmPaymentInProgress={confirmPaymentInProgress}
                        confirmPaymentSuccess={confirmPaymentSuccess}
                        currentUser={currentUser}
                        defaultPaymentMethods={defaultPaymentMethods}
                        defaultPaymentFetched={defaultPaymentFetched}
                        fetchDefaultPaymentError={fetchDefaultPaymentError}
                        fetchDefaultPaymentInProgress={fetchDefaultPaymentInProgress}
                        intl={intl}
                        onFetchDefaultPayment={onFetchDefaultPayment}
                        onManageDisableScrolling={onManageDisableScrolling}
                        onPaymentSubmit={onHandlePaymentSubmit}
                        paymentIntent={paymentIntent}
                        selectedPaymentMethod={selectedPaymentMethod}
                        onElementReady={onElementReady}
                      />
                    </Elements>
                  )}
                </div>
              )}
              {confirmPaymentSuccess && (
                <div className={css.confirmationContainer}>
                  <IconConfirm />
                  <div className={css.confirmationText}>{paymentConfirmedMessage}</div>
                  <p className={classNames(css.confirmationText, css.small)}>
                    Once your payment is confirmed, we will send you an email.
                  </p>
                </div>
              )}
            </div>
          )}
          {!hasStripeAccount && hasStripeAccountFetched && !confirmPaymentSuccess && (
            <NotifyForPaymentContainer
              channelContext={channelContext}
              channelUrl={channelUrl}
              currentUser={currentUser}
              intl={intl}
              onSendNotifyForPayment={onSendNotifyForPayment}
              provider={provider}
              providerListing={providerListing}
              sendbirdContext={sendbirdContext}
              sendNotifyForPaymentInProgress={sendNotifyForPaymentInProgress}
              sendNotifyForPaymentSuccess={sendNotifyForPaymentSuccess}
            />
          )}
        </Modal>
      )}
    </Fragment>
  );
};

StripePaymentModalComponent.defaultProps = {
  confirmPaymentError: null,
  confirmPaymentInProgress: false,
  confirmPaymentSuccess: false,
  createPaymentIntentError: null,
  createPaymentIntentInProgress: false,
  defaultPaymentMethods: null,
  defaultPaymentFetched: false,
  fetchDefaultPaymentError: null,
  fetchDefaultPaymentInProgress: false,
  hasStripeAccount: false,
  hasStripeAccountError: null,
  hasStripeAccountFetched: false,
  hasStripeAccountInProgress: false,
  paymentIntent: null,
  sendNotifyForPaymentError: null,
  sendNotifyForPaymentInProgress: false,
  sendNotifyForPaymentSuccess: false,
  stripeCustomerFetched: false,
};

StripePaymentModalComponent.propTypes = {
  confirmPaymentError: propTypes.error,
  confirmPaymentInProgress: bool,
  confirmPaymentSuccess: bool,
  createPaymentIntentError: propTypes.error,
  createPaymentIntentInProgress: bool,
  currentUser: propTypes.currentUser.isRequired,
  defaultPaymentMethods: arrayOf(object),
  defaultPaymentFetched: bool,
  fetchDefaultPaymentError: propTypes.error,
  fetchDefaultPaymentInProgress: bool,
  hasStripeAccount: bool,
  hasStripeAccountError: propTypes.error,
  hasStripeAccountFetched: bool,
  hasStripeAccountInProgress: bool,
  paymentIntent: object,
  sendNotifyForPaymentError: propTypes.error,
  sendNotifyForPaymentInProgress: bool,
  sendNotifyForPaymentSuccess: bool,
  stripeCustomerFetched: bool,
  params: shape({
    id: string,
    slug: string,
  }),

  fetchHasStripeAccount: func,
  fetchStripeCustomer: func,
  onConfirmPayment: func,
  onCreatePaymentIntent: func,
  onFetchDefaultPayment: func,
  onSendMessage: func,
  onSendNotifyForPayment: func,
  onSetInitialState: func,

  // from connect
  dispatch: func,

  // from injectIntl
  intl: intlShape.isRequired,

  // from withRouter
  history: shape({
    push: func.isRequired,
  }).isRequired,

  // eslint-disable-next-line react/no-unused-prop-types
  onManageDisableScrolling: func.isRequired,
};

const mapStateToProps = state => {
  const {
    confirmPaymentError,
    confirmPaymentInProgress,
    confirmPaymentSuccess,
    createPaymentIntentError,
    createPaymentIntentInProgress,
    defaultPaymentMethods,
    defaultPaymentFetched,
    fetchDefaultPaymentError,
    fetchDefaultPaymentInProgress,
    hasStripeAccount,
    hasStripeAccountError,
    hasStripeAccountFetched,
    hasStripeAccountInProgress,
    paymentIntent,
    sendNotifyForPaymentError,
    sendNotifyForPaymentInProgress,
    sendNotifyForPaymentSuccess,
    stripeCustomerFetched,
  } = state.StripePaymentModal;
  const { currentUser } = state.user;

  return {
    confirmPaymentError,
    confirmPaymentInProgress,
    confirmPaymentSuccess,
    createPaymentIntentError,
    createPaymentIntentInProgress,
    currentUser,
    defaultPaymentMethods,
    defaultPaymentFetched,
    fetchDefaultPaymentError,
    fetchDefaultPaymentInProgress,
    hasStripeAccount,
    hasStripeAccountError,
    hasStripeAccountFetched,
    hasStripeAccountInProgress,
    paymentIntent,
    sendNotifyForPaymentError,
    sendNotifyForPaymentInProgress,
    sendNotifyForPaymentSuccess,
    stripeCustomerFetched,
  };
};

const mapDispatchToProps = dispatch => ({
  onCreatePaymentIntent: (amount, stripeAccountId, sender, isCard, caregiverName, channelUrl) =>
    dispatch(
      createPaymentIntent(amount, stripeAccountId, sender, isCard, caregiverName, channelUrl)
    ),
  onConfirmPayment: (
    stripe,
    elements,
    saveCardAsDefault,
    defaultMethodId,
    paymentIntentId,
    useDefaultCard,
    currentUserId,
    providerName,
    channelUrl,
    sendbirdContext,
    providerListing,
    methodType
  ) =>
    dispatch(
      confirmPayment(
        stripe,
        elements,
        saveCardAsDefault,
        defaultMethodId,
        paymentIntentId,
        useDefaultCard,
        currentUserId,
        providerName,
        channelUrl,
        sendbirdContext,
        providerListing,
        methodType
      )
    ),
  fetchHasStripeAccount: userId => dispatch(hasStripeAccount(userId)),
  fetchStripeCustomer: () => dispatch(stripeCustomer()),
  onFetchDefaultPayment: stripeCustomerId => dispatch(fetchDefaultPayment(stripeCustomerId)),
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
  onSendNotifyForPayment: (
    currentUser,
    providerName,
    channelUrl,
    sendbirdContext,
    providerListing
  ) =>
    dispatch(
      sendNotifyForPayment(currentUser, providerName, channelUrl, sendbirdContext, providerListing)
    ),
  onSetInitialState: () => dispatch(setInitialValues(initialState)),
});

const StripePaymentModal = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(StripePaymentModalComponent);

export default StripePaymentModal;
