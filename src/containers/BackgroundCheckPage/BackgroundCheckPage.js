import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal,
  IconConfirm,
  Button,
  IconClose,
  IconSpinner,
  NamedRedirect,
  LayoutSideNavigation,
  LayoutWrapperMain,
  LayoutWrapperAccountSettingsSideNav,
  LayoutWrapperTopbar,
  LayoutWrapperFooter,
  Footer,
  Page,
  UserNav,
} from '../../components';
import { TopbarContainer } from '../../containers';
import { ensureCurrentUser, ensureOwnListing } from '../../util/data';
import { LISTING_STATE_DRAFT } from '../../util/types';
import { FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import {
  ConsentModalForm,
  EditListingBackgroundCheckForm,
  IdentityProofForm,
  PayCreditCardForm,
} from '../../forms';
import moment from 'moment';
import config from '../../config';
import ScreeningDescription from './ScreeningDescription';
import PaymentInfo from './PaymentInfo';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import {
  CAREVINE_GOLD_PRICE_ID,
  CAREVINE_BASIC_PRICE_ID,
  CAREVINE_8_OFF_3_MONTHS_COUPON,
  BACKGROUND_CHECK_APPROVED,
  BACKGROUND_CHECK_REJECTED,
  BACKGROUND_CHECK_PENDING,
  SUBSCRIPTION_ACTIVE_TYPES,
  EMPLOYER,
} from '../../util/constants';
import {
  authenticateCreateUser,
  authenticateSubmitConsent,
  identityProofQuiz,
  verifyIdentityProofQuiz,
  authenticateUpdateUser,
  getAuthenticateTestResult,
  authenticateGenerateCriminalBackground,
  authenticate7YearHistory,
  addQuizAttempt,
} from '../../ducks/authenticate.duck';
import {
  createPayment,
  createSubscription,
  updateSubscription,
  updateCustomerCreditBalance,
} from '../../ducks/stripe.duck';
import { createSetupIntent, confirmSetupIntent } from '../../ducks/paymentMethods.duck';
import { fetchCurrentUser } from '../../ducks/user.duck';
import { claimReferral } from '../../containers/ReferralPage/ReferralPage.duck';
import { useCheckMobileScreen } from '../../util/hooks';
import parser from 'parse-address';
import { manageDisableScrolling, isScrollingDisabled } from '../../ducks/UI.duck';

import css from './BackgroundCheckPage.module.css';

const stripePromise = loadStripe(config.stripe.publishableKey);

const INITIAL = 'INITIAL';
const PAYMENT = 'PAYMENT';
const CONFIRM_PAYMENT = 'CONFIRM_PAYMENT';
const CREATE_USER = 'CREATE_USER';
const SUBMIT_CONSENT = 'SUBMIT_CONSENT';
const IDENTITY_PROOF_QUIZ = 'IDENTITY_PROOF_QUIZ';
const BACKGROUND_CHECK_COMPLETE = 'BACKGROUND_CHECK_COMPLETE';
const BACKGROUND_CHECK_IN_REVIEW = 'BACKGROUND_CHECK_IN_REVIEW';
const UPDATE_USER = 'UPDATE_USER';
const QUIZ_MAX_ATTEMPTS_FAILED = 'QUIZ_MAX_ATTEMPTS_FAILED';

const MAX_QUIZ_ATTEMPTS = 3;

const BASIC = 'basic';
const GOLD = 'gold';

const BackgroundCheckPage = props => {
  const {
    authenticate7YearHistoryError,
    authenticate7YearHistoryInProgress,
    authenticateCreateUserError,
    authenticateCreateUserInProgress,
    authenticateGenerateCriminalBackgroundError,
    authenticateGenerateCriminalBackgroundInProgress,
    authenticateSubmitConsentError,
    authenticateSubmitConsentInProgress,
    authenticateUpdateUserError,
    authenticateUpdateUserInProgress,
    confirmSetupIntentError,
    confirmSetupIntentInProgress,
    createdPaymentMethod,
    createPaymentError,
    createPaymentInProgress,
    createPaymentSuccess,
    createSetupIntentError,
    createSetupIntentInProgress,
    createSubscriptionError,
    createSubscriptionInProgress,
    getAuthenticateTestResultError,
    getAuthenticateTestResultInProgress,
    getIdentityProofQuizError,
    getIdentityProofQuizInProgress,
    identityProofQuizData,
    intl,
    listing,
    onAddQuizAttempt,
    onAuthenticateCreateUser,
    onAuthenticateSubmitConsent,
    onAuthenticateUpdateUser,
    onClaimReferral,
    onConfirmSetupIntent,
    onCreatePayment,
    onCreateSetupIntent,
    onCreateSubscription,
    onFetchCurrentUser,
    onGenerateCriminalBackground,
    onGet7YearHistory,
    onGetAuthenticateTestResult,
    onGetIdentityProofQuiz,
    onManageDisableScrolling,
    onUpdateCustomerCreditBalance,
    onVerifyIdentityProofQuiz,
    scrollingDisabled,
    setupIntent,
    subscription,
    user,
    verifyIdentityProofQuizError,
    verifyIdentityProofQuizFailure,
    verifyIdentityProofQuizInProgress,
  } = props;

  const currentUser = ensureCurrentUser(user);

  if (currentUser?.id?.uuid && currentUser.attributes.profile.metadata.userType === EMPLOYER) {
    return <NamedRedirect name="LandingPage" />;
  }

  const isMobile = useCheckMobileScreen();

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#568a6e',
      fontFamily: '"poppins", Helvetica, Arial, sans-serif',
      borderRadius: '2px',
    },
    rules: {
      '.Input': {
        display: 'block',
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

  const [stage, setStage] = useState(INITIAL);
  const [backgroundCheckType, setBackgroundCheckType] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [setupIntentClientSecret, setSetupIntentClientSecret] = useState(null);
  const [updateUserSubmitted, setUpdateUserSubmitted] = useState(false);

  const currentListing = ensureOwnListing(listing);
  const {
    profile: { firstName, lastName, metadata, privateData },
    email,
  } = currentUser.attributes;

  const isPublished = currentListing.id && currentListing.attributes.state !== LISTING_STATE_DRAFT;

  // Get all authenticate related data from user
  const authenticateUserAccessCode = privateData?.authenticateUserAccessCode;
  const authenticateConsent = privateData?.authenticateConsent;
  const backgroundCheckSubscription = metadata?.backgroundCheckSubscription;
  const identityProofQuizVerification = privateData?.identityProofQuizVerification;
  const authenticateCriminalBackgroundGenerated =
    privateData?.authenticateCriminalBackgroundGenerated;
  const authenticateUserTestResult = privateData?.authenticateUserTestResult;
  const authenticate7YearHistory = privateData?.authenticate7YearHistory;
  const backgroundCheckApproved = metadata?.backgroundCheckApproved;
  const backgroundCheckRejected = privateData?.backgroundCheckRejected;
  const stripeCustomerId = currentUser?.stripeCustomer?.attributes?.stripeCustomerId;
  const identityProofQuizAttempts = privateData?.identityProofQuizAttempts;
  const identityProofQuiz = identityProofQuizData || privateData?.identityProofQuiz;
  const signupReferralCode = metadata?.signupReferralCode;
  const isFreeForever =
    subscription?.discount?.coupon?.percent_off === 100 &&
    subscription?.discount?.coupon?.duration === 'forever';
  const isFreeTrial = subscription?.status === 'trialing';

  // This checks what step of the process the user should be in based on the data we have
  useEffect(() => {
    if (backgroundCheckApproved?.status === BACKGROUND_CHECK_REJECTED) {
      setStage(BACKGROUND_CHECK_REJECTED);
    } else if (backgroundCheckApproved?.status === BACKGROUND_CHECK_APPROVED) {
      setStage(BACKGROUND_CHECK_COMPLETE);
    } else if (backgroundCheckApproved?.status === BACKGROUND_CHECK_PENDING) {
      setStage(BACKGROUND_CHECK_IN_REVIEW);
    } else if (identityProofQuizAttempts >= MAX_QUIZ_ATTEMPTS) {
      setStage(QUIZ_MAX_ATTEMPTS_FAILED);
    } else if (authenticateConsent && getIdentityProofQuizError) {
      setStage(UPDATE_USER);
    } else if (authenticateConsent) {
      setStage(IDENTITY_PROOF_QUIZ);
    } else if (authenticateUserAccessCode) {
      setStage(SUBMIT_CONSENT);
    } else if (SUBSCRIPTION_ACTIVE_TYPES.includes(backgroundCheckSubscription?.status)) {
      setStage(CREATE_USER);
    } else if (
      (createPaymentSuccess || subscription?.trial_end || isFreeForever) &&
      stage === PAYMENT
    ) {
      setStage(CONFIRM_PAYMENT);
      setTimeout(() => {
        setStage(CREATE_USER);
      }, 3000);
    }
  }, [
    backgroundCheckSubscription,
    authenticateUserAccessCode,
    authenticateConsent,
    createPaymentSuccess,
    identityProofQuiz,
    authenticateUserTestResult,
    authenticate7YearHistory,
    backgroundCheckApproved,
    backgroundCheckRejected,
    subscription,
  ]);

  useEffect(() => {
    if (createPaymentSuccess && signupReferralCode && backgroundCheckType === GOLD) {
      onUpdateCustomerCreditBalance(signupReferralCode, -500).then(() => {
        const email = currentUser.attributes.email;
        onClaimReferral(email, signupReferralCode);
      });
    }
  }, [createPaymentSuccess]);

  // These error codes indicate the user needs to be updated to get identity proof quiz
  useEffect(() => {
    const errorStatuses = [400, 417, 404];
    if (getIdentityProofQuizError && errorStatuses.includes(getIdentityProofQuizError.status)) {
      setStage(UPDATE_USER);
    }
  }, [getIdentityProofQuizError]);

  // Set client secret for subscription payment
  useEffect(() => {
    if (subscription?.latest_invoice?.payment_intent?.client_secret) {
      setClientSecret(subscription?.latest_invoice?.payment_intent?.client_secret);
    }
  }, [subscription]);

  // Set setup intent secret for when user is using promo code
  useEffect(() => {
    setSetupIntentClientSecret(setupIntent?.client_secret);
  }, [setupIntent]);

  // After user has created payment method in promo code flow, create subscription with 1 month trial
  useEffect(() => {
    if (createdPaymentMethod) {
      onCreateSubscription(
        stripeCustomerId,
        backgroundCheckType === BASIC ? CAREVINE_BASIC_PRICE_ID : CAREVINE_GOLD_PRICE_ID,
        currentUser?.id?.uuid,
        {
          default_payment_method: createdPaymentMethod,
          trial_end: moment()
            .add(setupIntent?.metadata?.monthsFree ?? 1, 'month')
            .unix(),
        }
      );
    }
  }, [createdPaymentMethod]);

  // If current quiz session has expired, fetch a new quiz
  useEffect(() => {
    if (
      verifyIdentityProofQuizError?.status === 400 &&
      authenticateUserAccessCode &&
      currentUser?.id?.uuid
    ) {
      onGetIdentityProofQuiz(authenticateUserAccessCode, currentUser?.id?.uuid);
    }
  }, [verifyIdentityProofQuizError, authenticateUserAccessCode, currentUser?.id?.uuid]);

  // Submit user form (create of update) for authenticate user
  const handleSubmit = values => {
    const {
      firstName,
      middleName,
      lastName,
      dob,
      email,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      zipCode,
      ssn,
    } = values;

    const addressLine2String = addressLine2 ? `, ${addressLine2}` : '';

    const phoneString = `+1${phone.replace(/-/g, '')}`;
    const fullAddress = `${addressLine1}${addressLine2String}`;

    const parsedAddress = parser.parseLocation(addressLine1);

    const userInfo = {
      firstName: firstName.trim(),
      middleName: middleName ? middleName.trim() : '',
      lastName: lastName.trim(),
      dob: moment(dob.date).format('DD-MM-YYYY'),
      email: email.trim(),
      phone: phoneString.trim(),
      streetName: `${parsedAddress?.street} ${parsedAddress?.type}`.trim(),
      address: fullAddress.trim(),
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      ssn: ssn.replace(/-/g, '').trim(),
      houseNumber: parsedAddress?.number,
    };

    if (stage === CREATE_USER) {
      onAuthenticateCreateUser(userInfo, currentUser?.id?.uuid).then(() =>
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
      );
    } else if (stage === UPDATE_USER) {
      onAuthenticateUpdateUser(userInfo, authenticateUserAccessCode).then(() => {
        setUpdateUserSubmitted(true);
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      });
    }
  };

  // Submit authenticate consent
  const handleConsentSubmit = values => {
    const fullName = privateData?.authenticateFullName;
    const userId = currentUser?.id?.uuid;
    onAuthenticateSubmitConsent(authenticateUserAccessCode, fullName, userId).then(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    });
  };

  // This creates payment or setup intent, depending on if user is using promo code
  const handleCardSubmit = (stripe, elements) => {
    const userId = currentUser?.id?.uuid;
    const stripeCustomerId = currentUser.stripeCustomer?.attributes?.stripeCustomerId;
    const params = {
      stripe,
      elements,
      userId,
      saveMethodAsDefault: true,
      stripeCustomerId,
    };

    if (
      setupIntentClientSecret &&
      setupIntent?.metadata?.backgroundCheckType === backgroundCheckType
    ) {
      onConfirmSetupIntent(stripe, setupIntentClientSecret, elements).then(() =>
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
      );
    } else {
      onCreatePayment(params).then(() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }));
    }
  };

  /*
   * This function is called when user submits identity proof quiz
   * If quiz is not verified, verify quiz
   * If quiz is verified, generate criminal background
   * If criminal background is generated, get test result
   * If test result is received and user has criminal record, get 7 year history
   * TODO: Need a way to handle when user has already verified quiz. They shouldn't need to submit quiz again, but other calls should happen on load.
   */
  const handleIdentityQuizSubmit = (answers, form) => {
    const IDMSessionId = identityProofQuiz.data.IDMSessionId;
    const currentAttempts = !!identityProofQuizAttempts ? identityProofQuizAttempts : 0;
    if (!identityProofQuizVerification) {
      onVerifyIdentityProofQuiz(
        IDMSessionId,
        authenticateUserAccessCode,
        currentUser?.id?.uuid,
        answers,
        currentAttempts
      ).then(() => {
        form.restart();
      });
    } else if (!authenticateCriminalBackgroundGenerated) {
      onGenerateCriminalBackground(authenticateUserAccessCode, currentUser?.id?.uuid);
    } else if (!authenticateUserTestResult) {
      onGetAuthenticateTestResult(authenticateUserAccessCode, currentUser?.id?.uuid);
    } else if (
      !authenticate7YearHistory &&
      authenticateUserTestResult?.backgroundCheck?.hasCriminalRecord
    ) {
      onGet7YearHistory(authenticateUserAccessCode, currentUser?.id?.uuid);
    }
  };

  const handlePayForBC = useCallback(
    bcType => {
      setStage(PAYMENT);
      setBackgroundCheckType(bcType);

      onCreateSubscription(
        stripeCustomerId,
        bcType === BASIC ? CAREVINE_BASIC_PRICE_ID : CAREVINE_GOLD_PRICE_ID,
        currentUser?.id?.uuid,
        {
          coupon: bcType === BASIC ? null : CAREVINE_8_OFF_3_MONTHS_COUPON,
          proration_behavior: 'none',
        }
      ).then(() => {
        onFetchCurrentUser();
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      });
    },
    [
      setStage,
      setBackgroundCheckType,
      onCreateSubscription,
      stripeCustomerId,
      currentUser?.id?.uuid,
    ]
  );

  const address = listing.attributes.privateData.address;
  const initialValues = {
    firstName,
    lastName,
    email,
    city: address?.city,
    state: address?.state,
    zipCode: address?.zip,
    addressLine1: `${address?.number || ''} ${address?.street || ''} ${address?.type || ''}`,
  };

  const formProps = {
    className: css.form,
    initialValues,
  };

  let content = null;

  switch (stage) {
    case INITIAL:
      content = <ScreeningDescription onPayForBC={handlePayForBC} />;
      break;
    case PAYMENT:
      const options = {
        clientSecret,
        appearance,
      };

      const setupIntentOptions = {
        clientSecret: setupIntentClientSecret,
        appearance,
      };

      content =
        clientSecret && !createSubscriptionInProgress ? (
          <div className={css.paymentContainer}>
            <div className={css.paymentForm}>
              {!createSubscriptionError &&
                (!setupIntentClientSecret ||
                  (setupIntentClientSecret &&
                    setupIntent &&
                    setupIntent.metadata?.backgroundCheckType !== backgroundCheckType)) && (
                  <Elements options={options} stripe={stripePromise} key={clientSecret}>
                    <PayCreditCardForm
                      createPaymentError={createPaymentError}
                      createPaymentInProgress={createPaymentInProgress}
                      formId="PayCreditCardForm"
                      intl={intl}
                      onSubmit={handleCardSubmit}
                    />
                  </Elements>
                )}
              {setupIntentClientSecret &&
                (setupIntent
                  ? setupIntent.metadata?.backgroundCheckType === backgroundCheckType
                  : true) && (
                  <Elements options={setupIntentOptions} stripe={stripePromise}>
                    <PayCreditCardForm
                      confirmSetupIntentInProgress={confirmSetupIntentInProgress}
                      confirmSetupIntentError={confirmSetupIntentError}
                      createSubscriptionError={createSubscriptionError}
                      createSubscriptionInProgress={createSubscriptionInProgress}
                      formId="PayCreditCardForm"
                      intl={intl}
                      onSubmit={handleCardSubmit}
                    />
                  </Elements>
                )}
            </div>
            <PaymentInfo
              backgroundCheckType={backgroundCheckType}
              subscription={subscription}
              stripeCustomerId={stripeCustomerId}
              currentUser={currentUser}
              onCreateSetupIntent={onCreateSetupIntent}
              setupIntent={setupIntent}
              createSetupIntentInProgress={createSetupIntentInProgress}
              createSetupIntentError={createSetupIntentError}
              onCreateSubscription={onCreateSubscription}
              createSubscriptionInProgress={createSubscriptionInProgress}
              createSubscriptionError={createSubscriptionError}
            />
          </div>
        ) : (
          <div className={css.spinnerContainer}>
            {createSubscriptionError ? (
              <p className={css.error}>
                <FormattedMessage id="EditListingBackgroundCheckPanel.createSubscriptionError" />
              </p>
            ) : (
              <IconSpinner className={css.spinner} />
            )}
          </div>
        );
      break;
    case CONFIRM_PAYMENT:
      content = (
        <div className={css.confirmationContainer}>
          <div className={css.iconContainer}>
            <IconConfirm />
          </div>
          <div className={css.confirmationText}>Subscription Confirmed</div>
          <p className={css.redirectingText}>Redirecting you to provide your info...</p>
        </div>
      );
      break;
    case CREATE_USER:
      content = (
        <div className={css.content}>
          <EditListingBackgroundCheckForm
            {...formProps}
            authenticateCreateUserError={authenticateCreateUserError}
            authenticateCreateUserInProgress={authenticateCreateUserInProgress}
            authenticateUserAccessCode={authenticateUserAccessCode}
            onSubmit={handleSubmit}
            saveActionMsg="Submit"
            initialValuesEqual={() => true}
          />
        </div>
      );
      break;
    case UPDATE_USER:
      content = (
        <div className={css.content}>
          <EditListingBackgroundCheckForm
            {...formProps}
            authenticateUpdateUserError={authenticateUpdateUserError}
            authenticateUpdateUserInProgress={authenticateUpdateUserInProgress}
            onSubmit={handleSubmit}
            saveActionMsg="Submit"
            update
            getIdentityProofQuizError={getIdentityProofQuizError}
            updateUserSubmitted={updateUserSubmitted}
            initialValuesEqual={() => true}
          />
        </div>
      );
      break;
    case IDENTITY_PROOF_QUIZ:
      const quizErrors = {
        getIdentityProofQuizError,
        verifyIdentityProofQuizError,
        authenticate7YearHistoryError,
        authenticateGenerateCriminalBackgroundError,
        getAuthenticateTestResultError,
        verifyIdentityProofQuizFailure,
      };
      const quizInProgress =
        verifyIdentityProofQuizInProgress ||
        authenticate7YearHistoryInProgress ||
        authenticateGenerateCriminalBackgroundInProgress ||
        getAuthenticateTestResultInProgress;
      content = (
        <div className={css.quizContent}>
          <IdentityProofForm
            saveActionMsg="Submit"
            onSubmit={() => {}}
            identityProofQuiz={identityProofQuiz}
            fetchErrors={quizErrors}
            onVerify={handleIdentityQuizSubmit}
            inProgress={quizInProgress}
            identityProofQuizAttempts={identityProofQuizAttempts}
            identityProofQuizVerification={identityProofQuizVerification}
            authenticateUserAccessCode={authenticateUserAccessCode}
            currentUserId={currentUser?.id?.uuid}
            onGetIdentityProofQuiz={onGetIdentityProofQuiz}
            getIdentityProofQuizInProgress={getIdentityProofQuizInProgress}
            onManageDisableScrolling={onManageDisableScrolling}
            onAddQuizAttempt={onAddQuizAttempt}
            currentUser={currentUser}
          />
        </div>
      );
      break;
    case BACKGROUND_CHECK_IN_REVIEW:
      content = (
        <div className={css.confirmationContainer}>
          <div className={css.iconContainer}>
            <IconConfirm />
          </div>
          <p className={css.confirmationText}>
            Your background check is in review. You will receive an email when it is complete.
          </p>
        </div>
      );
      break;
    case BACKGROUND_CHECK_COMPLETE:
      content = (
        <div className={css.confirmationContainer}>
          <div className={css.iconContainer}>
            <IconConfirm className={css.confirmIcon} />
          </div>
          <p className={css.confirmationText}>Your background check is complete.</p>
        </div>
      );
      break;
    case BACKGROUND_CHECK_REJECTED:
      content = (
        <div className={css.rejectedContainer}>
          <div className={css.rejectedIconContainer}>
            <IconClose pixelHeight="40" className={css.rejectedIcon} />
          </div>
          <p className={css.rejectedText}>
            Your background check didn't meet the requirements for our site.
          </p>
          <p className={css.rejectedText}>
            If you believe this was a mistake, please contact support.
          </p>
        </div>
      );
      break;
    case QUIZ_MAX_ATTEMPTS_FAILED:
      content = (
        <div className={css.rejectedContainer}>
          <div className={css.rejectedIconContainer}>
            <IconClose pixelHeight="40" className={css.rejectedIcon} />
          </div>
          <p className={css.rejectedText}>
            You have exceeded the maximum number of attempts for the quiz.
          </p>
          <p className={css.rejectedText}>
            If you believe this was a mistake, please contact support.
          </p>
        </div>
      );
      break;

    default:
      content = null;
  }

  return (
    //   TODO: Make title
    <Page title="" scrollingDisabled={scrollingDisabled}>
      <LayoutSideNavigation>
        <LayoutWrapperTopbar>
          <TopbarContainer
            currentPage="BackgroundCheckPage"
            desktopClassName={css.desktopTopbar}
            mobileClassName={css.mobileTopbar}
          />
          <UserNav selectedPageName="BackgroundCheckPage" listing={listing} />
        </LayoutWrapperTopbar>
        <LayoutWrapperAccountSettingsSideNav
          currentTab="BackgroundCheckPage"
          currentUser={currentUser}
          currentUserListing={listing}
        />
        <LayoutWrapperMain className={css.root}>
          {content}
          <Modal
            id="EditListingBackgroundCheckPanel.consentModal"
            isOpen={stage === SUBMIT_CONSENT}
            onClose={() => {}}
            onManageDisableScrolling={onManageDisableScrolling}
            containerClassName={css.consentModal}
            noClose
            usePortal
          >
            <ConsentModalForm
              onSubmit={handleConsentSubmit}
              currentUser={currentUser}
              onAuthenticateSubmitConsent={onAuthenticateSubmitConsent}
              authenticateSubmitConsentInProgress={authenticateSubmitConsentInProgress}
              authenticateSubmitConsentError={authenticateSubmitConsentError}
            />
          </Modal>
        </LayoutWrapperMain>
        <LayoutWrapperFooter>
          <Footer />
        </LayoutWrapperFooter>
      </LayoutSideNavigation>
    </Page>
  );
};

const mapStateToProps = state => {
  const {
    authenticateCreateUserError,
    authenticateCreateUserInProgress,
    authenticateUpdateUserError,
    authenticateUpdateUserInProgress,
    authenticateSubmitConsentInProgress,
    authenticateSubmitConsentError,
    verifyIdentityProofQuizInProgress,
    verifyIdentityProofQuizError,
    getIdentityProofQuizInProgress,
    getIdentityProofQuizError,
    authenticate7YearHistoryError,
    authenticate7YearHistoryInProgress,
    authenticateGenerateCriminalBackgroundError,
    authenticateGenerateCriminalBackgroundInProgress,
    getAuthenticateTestResultError,
    getAuthenticateTestResultInProgress,
    verifyIdentityProofQuizFailure,
    identityProofQuiz: identityProofQuizData,
  } = state.Authenticate;

  const { currentUser, currentUserListing } = state.user;
  const { updateStripeAccountError } = state.stripeConnectAccount;

  const {
    createPaymentInProgress,
    createPaymentError,
    createPaymentSuccess,
    createSubscriptionError,
    createSubscriptionInProgress,
    subscription,
    updateSubscriptionError,
    updateSubscriptionInProgress,
  } = state.stripe;

  const {
    setupIntent,
    createSetupIntentInProgress,
    createSetupIntentError,
    confirmSetupIntentInProgress,
    confirmSetupIntentError,
    createdPaymentMethod,
  } = state.paymentMethods;

  return {
    authenticate7YearHistoryError,
    authenticate7YearHistoryInProgress,
    authenticateCreateUserError,
    authenticateCreateUserInProgress,
    authenticateGenerateCriminalBackgroundError,
    authenticateGenerateCriminalBackgroundInProgress,
    authenticateSubmitConsentError,
    authenticateSubmitConsentInProgress,
    authenticateUpdateUserError,
    authenticateUpdateUserInProgress,
    confirmSetupIntentError,
    confirmSetupIntentInProgress,
    createdPaymentMethod,
    createPaymentError,
    createPaymentInProgress,
    createPaymentSuccess,
    createSetupIntentError,
    createSetupIntentInProgress,
    createSubscriptionError,
    createSubscriptionInProgress,
    getAuthenticateTestResultError,
    getAuthenticateTestResultInProgress,
    getIdentityProofQuizError,
    getIdentityProofQuizInProgress,
    identityProofQuiz: identityProofQuizData,
    listing: currentUserListing,
    scrollingDisabled: isScrollingDisabled(state),
    setupIntent,
    subscription,
    updateStripeAccountError,
    updateSubscriptionError,
    updateSubscriptionInProgress,
    user: currentUser,
    verifyIdentityProofQuizError,
    verifyIdentityProofQuizFailure,
    verifyIdentityProofQuizInProgress,
  };
};

const mapDispatchToProps = {
  onFetchCurrentUser: fetchCurrentUser,
  onAuthenticateCreateUser: authenticateCreateUser,
  onAuthenticateSubmitConsent: authenticateSubmitConsent,
  onAuthenticateUpdateUser: authenticateUpdateUser,
  onConfirmSetupIntent: confirmSetupIntent,
  onCreatePayment: createPayment,
  onCreateSetupIntent: createSetupIntent,
  onCreateSubscription: createSubscription,
  onGenerateCriminalBackground: authenticateGenerateCriminalBackground,
  onGet7YearHistory: authenticate7YearHistory,
  onGetAuthenticateTestResult: getAuthenticateTestResult,
  onGetIdentityProofQuiz: identityProofQuiz,
  onUpdateSubscription: updateSubscription,
  onVerifyIdentityProofQuiz: verifyIdentityProofQuiz,
  onAddQuizAttempt: addQuizAttempt,
  onUpdateCustomerCreditBalance: updateCustomerCreditBalance,
  onClaimReferral: claimReferral,
  onManageDisableScrolling: manageDisableScrolling,
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(BackgroundCheckPage);
