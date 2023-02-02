import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { Modal, IconConfirm, Button, IconClose, IconSpinner } from '../';
import { ensureOwnListing } from '../../util/data';
import { LISTING_STATE_DRAFT } from '../../util/types';
import { FormattedMessage } from 'react-intl';
import {
  ConsentModalForm,
  EditListingBackgroundCheckForm,
  SaveCreditCardForm,
  IdentityProofForm,
  PayCreditCardForm,
} from '../../forms';
import moment from 'moment';
import config from '../../config';
import ScreeningDescription from './ScreeningDescription';
import { ensureCurrentUser } from '../../util/data';
import { updateUserMetadata } from '../../util/api';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import css from './EditListingBackgroundCheckPanel.module.css';
import { I } from '@sendbird/uikit-react/index-c45e5f15';

const stripePromise = loadStripe(config.stripe.publishableKey);
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

const INITIAL = 'INITIAL';
const PAYMENT = 'PAYMENT';
const CONFIRM_PAYMENT = 'CONFIRM_PAYMENT';
const CREATE_USER = 'CREATE_USER';
const SUBMIT_CONSENT = 'SUBMIT_CONSENT';
const IDENTITY_PROOF_QUIZ = 'IDENTITY_PROOF_QUIZ';
const LOADING = 'LOADING';
const BACKGROUND_CHECK_COMPLETE = 'BACKGROUND_CHECK_COMPLETE';
const BACKGROUND_CHECK_IN_REVIEW = 'BACKGROUND_CHECK_IN_REVIEW';
const BACKGROUND_CHECK_REJECTED = 'BACKGROUND_CHECK_REJECTED';
const UPDATE_USER = 'UPDATE_USER';
const QUIZ_MAX_ATTEMPTS_FAILED = 'QUIZ_MAX_ATTEMPTS_FAILED';

const BACKGROUND_CHECK_PRICE = 499;
const MAX_QUIZ_ATTEMPTS = 3;

const EditListingBackgroundCheckPanel = props => {
  const {
    className,
    rootClassName,
    listing,
    onAuthenticateCreateUser,
    disabled,
    ready,
    onSubmit,
    onChange,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    errors,
    intl,
    currentUser,
    onManageDisableScrolling,
    onAuthenticateSubmitConsent,
    onCreatePayment,
    onGetIdentityProofQuiz,
    onVerifyIdentityProofQuiz,
    onNextTab,
    onCreatePaymentIntent,
    createPaymentIntentError,
    createPaymentIntentInProgress,
    paymentIntent,
    authenticate,
    onAuthenticateUpdateUser,
    createPaymentInProgress,
    createPaymentError,
    createPaymentSuccess,
    onGetAuthenticateTestResult,
    onGenerateCriminalBackground,
    onGet7YearHistory,
  } = props;

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
  } = authenticate;

  const [stage, setStage] = useState(INITIAL);

  const classes = classNames(rootClassName || css.root, className);
  const currentListing = ensureOwnListing(listing);
  const { description, title, publicData } = currentListing.attributes;
  const {
    profile: { firstName, lastName, metadata, privateData },
    email,
  } = currentUser.attributes;

  const isPublished = currentListing.id && currentListing.attributes.state !== LISTING_STATE_DRAFT;
  const panelTitle = <FormattedMessage id="EditListingBackgroundCheckPanel.createListingTitle" />;

  const authenticateUserAccessCode = metadata && metadata.authenticateUserAccessCode;
  const authenticateConsent = metadata && metadata.authenticateConsent;
  const backgroundCheckPaid = metadata && metadata.backgroundCheckPaid;
  const identityProofQuiz = metadata && metadata.identityProofQuiz;
  const identityProofQuizVerification = metadata && metadata.identityProofQuizVerification;
  const authenticateCriminalBackgroundGenerated =
    metadata && metadata.authenticateCriminalBackgroundGenerated;
  const authenticateUserTestResult = metadata && metadata.authenticateUserTestResult;
  const authenticate7YearHistory = metadata && metadata.authenticate7YearHistory;
  const backgroundCheckApproved = metadata && metadata.backgroundCheckApproved;
  const backgroundCheckRejected = metadata && metadata.backgroundCheckRejected;
  const stripeCustomerId =
    currentUser.stripeCustomer && currentUser.stripeCustomer.attributes.stripeCustomerId;
  const identityProofQuizAttempts = metadata && metadata.identityProofQuizAttempts;

  // Need to add data to user that they paid for background check
  useEffect(() => {
    if (backgroundCheckRejected) {
      setStage(BACKGROUND_CHECK_REJECTED);
    } else if (backgroundCheckApproved) {
      setStage(BACKGROUND_CHECK_COMPLETE);
    } else if (authenticate7YearHistory) {
      setStage(BACKGROUND_CHECK_IN_REVIEW);
    } else if (identityProofQuizAttempts >= MAX_QUIZ_ATTEMPTS) {
      setStage(QUIZ_MAX_ATTEMPTS_FAILED);
    } else if (identityProofQuiz) {
      setStage(IDENTITY_PROOF_QUIZ);
    } else if (authenticateConsent && !getIdentityProofQuizInProgress) {
      setStage(UPDATE_USER);
    } else if (authenticateUserAccessCode) {
      setStage(SUBMIT_CONSENT);
    } else if (backgroundCheckPaid) {
      setStage(CREATE_USER);
    } else if (createPaymentSuccess && stage === PAYMENT) {
      setStage(CONFIRM_PAYMENT);
      setTimeout(() => {
        setStage(CREATE_USER);
      }, 3000);
    }
  }, [
    backgroundCheckPaid,
    authenticateUserAccessCode,
    authenticateConsent,
    createPaymentSuccess,
    identityProofQuiz,
    authenticateUserTestResult,
    authenticate7YearHistory,
    backgroundCheckApproved,
    backgroundCheckRejected,
  ]);

  useEffect(() => {
    const errorStatuses = [400, 417];
    if (getIdentityProofQuizError && errorStatuses.includes(getIdentityProofQuizError.status)) {
      setStage(UPDATE_USER);
    }
  }, [getIdentityProofQuizError]);

  useEffect(() => {
    if (
      verifyIdentityProofQuizError &&
      verifyIdentityProofQuizError.statusText.includes('Expired')
    ) {
      onGetIdentityProofQuiz(authenticateUserAccessCode, currentUser.id.uuid);
    }
  }, [verifyIdentityProofQuizError]);

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

    const userInfo = {
      firstName,
      middleName,
      lastName,
      dob: moment(dob.date).format('DD-MM-YYYY'),
      email,
      phone: `+1${phone.replace(/-/g, '')}`,
      streetName: addressLine1,
      address: `${addressLine1}${addressLine2String}`,
      city,
      state,
      zipCode,
      ssn: ssn.replace(/-/g, ''),
    };

    if (stage === CREATE_USER) {
      onAuthenticateCreateUser(userInfo, currentUser.id.uuid);
    } else if (stage === UPDATE_USER) {
      onAuthenticateUpdateUser(userInfo, authenticateUserAccessCode).then(() => {
        onGetIdentityProofQuiz(authenticateUserAccessCode, currentUser.id.uuid);
      });
    }
  };

  const handleConsentSubmit = values => {
    const fullName = privateData && privateData.authenticateFullName;
    const userId = currentUser.id.uuid;
    onAuthenticateSubmitConsent(authenticateUserAccessCode, fullName, userId).then(() => {
      onGetIdentityProofQuiz(authenticateUserAccessCode, userId);
    });
  };

  const handleCardSubmit = (stripe, elements) => {
    const userId = currentUser.id.uuid;
    const params = {
      stripe,
      elements,
    };
    onCreatePayment(params).then(() => {
      updateUserMetadata({
        userId,
        metadata: {
          backgroundCheckPaid: {
            paid: true,
            date: moment().format('MM-DD-YYYY'),
          },
        },
      });
    });
  };

  const handleIdentityQuizSubmit = answers => {
    const IDMSessionId = identityProofQuiz.data.IDMSessionId;
    const currentAttempts = !!identityProofQuizAttempts ? identityProofQuizAttempts : 0;
    if (!identityProofQuizVerification) {
      onVerifyIdentityProofQuiz(
        IDMSessionId,
        authenticateUserAccessCode,
        currentUser.id.uuid,
        answers,
        currentAttempts
      );
    } else if (!authenticateCriminalBackgroundGenerated) {
      onGenerateCriminalBackground(authenticateUserAccessCode, currentUser.id.uuid);
    } else if (!authenticateUserTestResult) {
      onGetAuthenticateTestResult(authenticateUserAccessCode, currentUser.id.uuid);
    } else if (
      !authenticate7YearHistory &&
      authenticateUserTestResult.backgroundCheck.hasCriminalRecord
    ) {
      onGet7YearHistory(authenticateUserAccessCode, currentUser.id.uuid);
    }
  };

  const initialValues = {
    firstName,
    lastName,
    email,
    city: publicData.location.city,
    state: publicData.location.state,
    zipCode: publicData.location.zipcode,
  };

  const formProps = {
    className: css.form,
    onChange,
    disabled,
    initialValues,
    ready,
    updated: panelUpdated,
    updateInProgress,
    fetchErrors: errors,
    intl,
  };

  let content = null;

  switch (stage) {
    case INITIAL:
      content = (
        <ScreeningDescription
          onPayForBC={() => {
            setStage(PAYMENT);
            onCreatePaymentIntent(
              BACKGROUND_CHECK_PRICE,
              currentUser.id,
              stripeCustomerId,
              true,
              true
            );
          }}
        />
      );
      break;
    case PAYMENT:
      const options = {
        clientSecret: paymentIntent && paymentIntent.client_secret,
        appearance,
      };

      content =
        paymentIntent && paymentIntent.client_secret ? (
          <div className={css.paymentContainer}>
            <div className={css.paymentForm}>
              <Elements options={options} stripe={stripePromise}>
                <PayCreditCardForm
                  createPaymentError={createPaymentError}
                  createPaymentInProgress={createPaymentInProgress}
                  formId="PayCreditCardForm"
                  intl={intl}
                  onSubmit={handleCardSubmit}
                />
              </Elements>
            </div>
            <div className={css.paymentInfo}>
              <h2>Order Summary</h2>
              <div className={css.spreadSection}>
                <h3>Screening Fee:</h3>
                <h3>$4.99</h3>
              </div>
              <div className={css.spreadSection}>
                <h3>Estimated Sales Tax (0%):</h3>
                <h3>$0.00</h3>
              </div>
              <hr></hr>
              <div className={css.spreadSection}>
                <h3>Total:</h3>
                <h3>$4.99</h3>
              </div>
              <p className={css.textSm}>
                By submitting this form, you agree that your credit card will be charged $4.99, plus
                applicable sales tax.
              </p>
              <p className={css.textSm}>
                You also agree that your screening fee will automatically renew and you authorize us
                to charge your credit card $4.99 every 3 months, plus any applicable sales tax,
                unless you cancel your subscription before the renewal date via your Account
                Settings. Once charged, all purchases, including renewals, are non-refundable.
              </p>
            </div>
          </div>
        ) : (
          <div className={css.spinnerContainer}>
            <IconSpinner className={css.spinner} />
          </div>
        );
      break;
    case CONFIRM_PAYMENT:
      const paymentConfirmedMessage = intl.formatMessage({
        id: 'StripePaymentModal.paymentConfirmedMessage',
      });
      content = (
        <div className={css.confirmationContainer}>
          <div className={css.iconContainer}>
            <IconConfirm />
          </div>
          <div className={css.confirmationText}>{paymentConfirmedMessage}</div>
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
          />
        </div>
      );
      break;
    case IDENTITY_PROOF_QUIZ:
      // TODO: Add identity proof errors
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
        <div className={css.content}>
          <h1 className={css.quizTitle}>
            Verify your <span className={css.identityText}>identity</span>
          </h1>
          <div className={css.attemptsContainer}>
            <h3 className={css.attemptsHeader}>Maximum Attempts: {MAX_QUIZ_ATTEMPTS}</h3>
            <h3 className={css.attemptsHeader}>
              {' '}
              Attempts Remaining:{' '}
              {!!identityProofQuizAttempts ? MAX_QUIZ_ATTEMPTS - identityProofQuizAttempts : 3}
            </h3>
          </div>
          <IdentityProofForm
            saveActionMsg="Submit"
            onSubmit={() => {}}
            identityProofQuiz={identityProofQuiz}
            fetchErrors={quizErrors}
            onVerify={handleIdentityQuizSubmit}
            inProgress={quizInProgress}
            identityProofQuizAttempts={identityProofQuizAttempts}
            identityProofQuizVerification={identityProofQuizVerification}
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
          <p className={css.confirmationText}>
            Your background check is complete. You can now finish your profile.
          </p>
          {!isPublished && (
            <Button className={css.goToNextTabButton} onClick={onNextTab}>
              {submitButtonText}
            </Button>
          )}
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
    <div className={classes}>
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
    </div>
  );
};

export default EditListingBackgroundCheckPanel;
