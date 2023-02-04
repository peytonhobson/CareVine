/**
 * This file contains server side endpoints that can be used to perform backend
 * tasks that can not be handled in the browser.
 *
 * The endpoints should not clash with the application routes. Therefore, the
 * endpoints are prefixed in the main server where this file is used.
 */

const express = require('express');
const bodyParser = require('body-parser');
const { deserialize } = require('./api-util/sdk');

const initiateLoginAs = require('./api/initiate-login-as');
const loginAs = require('./api/login-as');
const transactionLineItems = require('./api/transaction-line-items');
const initiatePrivileged = require('./api/initiate-privileged');
const transitionPrivileged = require('./api/transition-privileged');
const updateUserMetadata = require('./api/update-user-metadata');
const updateListingMetadata = require('./api/update-listing-metadata');
const deleteAccount = require('./api/delete-account');
const createPaymentIntent = require('./api/stripe-create-payment-intent');
const createSetupIntent = require('./api/stripe-create-setup-intent');
const fetchHasStripeAccount = require('./api/fetch-has-stripe-account');
const stripePaymentMethods = require('./api/stripe-payment-methods');
const stripeDetachPaymentMethod = require('./api/stripe-detach-payment-method');
const stripeUpdatePaymentIntent = require('./api/stripe-update-payment-intent');
const userEmail = require('./api/user-email');
const sendbirdUser = require('./api/sb-user');
const authenticateCreateUser = require('./api/authenticate-create-user');
const authenticateSubmitConsent = require('./api/authenticate-submit-consent');
const getIdentityProofQuiz = require('./api/identity-proof-quiz');
const verifyIdentityProofQuiz = require('./api/verify-identity-proof-quiz');
const authenticateTestResult = require('./api/authenticate-test-result');
const authenticate7YearHistory = require('./api/authenticate-7-year-history');
const authenticateGenerateCriminalBackground = require('./api/authenticate-generate-criminal-background');
const authenticateUpdateUser = require('./api/authenticate-update-user');
const authenticateEnrollTCM = require('./api/authenticate-enroll-tcm');
const stripeCreateSubscription = require('./api/stripe-create-subscription');
const stripeUpdateCustomer = require('./api/stripe-update-customer');
const stripeWebhook = require('./api/stripe-webhook');
const stripeCancelSubscription = require('./api/stripe-cancel-subscription');
const stripeUpdateSubscription = require('./api/stripe-update-subscription');
const stripeConfirmPayment = require('./api/stripe-confirm-payment');
const authenticateDeenrollTCM = require('./api/authenticate-deenroll-tcm');

const createUserWithIdp = require('./api/auth/createUserWithIdp');

const { authenticateFacebook, authenticateFacebookCallback } = require('./api/auth/facebook');
const { authenticateGoogle, authenticateGoogleCallback } = require('./api/auth/google');

const router = express.Router();

// ================ API router middleware: ================ //

// Parse Transit body first to a string
router.use(
  bodyParser.text({
    type: 'application/transit+json',
  })
);

// Deserialize Transit body string to JS data
router.use((req, res, next) => {
  if (req.originalUrl === '/stripe-webhook') {
    next(); // Do nothing with the body because I need it in a raw state.
  } else {
    if (req.get('Content-Type') === 'application/transit+json' && typeof req.body === 'string') {
      try {
        req.body = deserialize(req.body);
      } catch (e) {
        console.error('Failed to parse request body as Transit:');
        console.error(e);
        res.status(400).send('Invalid Transit in request body.');
        return;
      }
    }
    next();
  }
});

// ================ API router endpoints: ================ //

router.get('/initiate-login-as', initiateLoginAs);
router.get('/login-as', loginAs);
router.post('/transaction-line-items', transactionLineItems);
router.post('/initiate-privileged', initiatePrivileged);
router.post('/transition-privileged', transitionPrivileged);
router.post('/update-user-metadata', updateUserMetadata);
router.post('/update-listing-metadata', updateListingMetadata);
router.post('/delete-account', deleteAccount);
router.post('/create-payment-intent', createPaymentIntent);
router.post('/has-stripe-account', fetchHasStripeAccount);
router.post('/stripe-payment-methods', stripePaymentMethods);
router.post('/stripe-detach-payment-method', stripeDetachPaymentMethod);
router.post('/stripe-update-payment-intent', stripeUpdatePaymentIntent);
router.post('/user-email', userEmail);
router.post('/sb-user', sendbirdUser);
router.post('/stripe-create-setup-intent', createSetupIntent);
router.post('/authenticate-create-user', authenticateCreateUser);
router.post('/authenticate-submit-consent', authenticateSubmitConsent);
router.post('/get-identity-proof-quiz', getIdentityProofQuiz);
router.post('/verify-identity-proof-quiz', verifyIdentityProofQuiz);
router.post('/authenticate-test-result', authenticateTestResult);
router.post('/authenticate-7-year-history', authenticate7YearHistory);
router.post('/authenticate-generate-criminal-background', authenticateGenerateCriminalBackground);
router.post('/authenticate-update-user', authenticateUpdateUser);
router.post('/authenticate-enroll-tcm', authenticateEnrollTCM);
router.post('/stripe-create-subscription', stripeCreateSubscription);
router.post('/stripe-update-customer', stripeUpdateCustomer);
router.post('/stripe-webhook', express.json(), stripeWebhook);
router.post('/stripe-cancel-subscription', stripeCancelSubscription);
router.post('/stripe-update-subscription', stripeUpdateSubscription);
router.post('/stripe-confirm-payment', stripeConfirmPayment);
router.post('/authenticate-deenroll-tcm', authenticateDeenrollTCM);

// Create user with identity provider (e.g. Facebook or Google)
// This endpoint is called to create a new user after user has confirmed
// they want to continue with the data fetched from IdP (e.g. name and email)
router.post('/auth/create-user-with-idp', createUserWithIdp);

// Facebook authentication endpoints

// This endpoint is called when user wants to initiate authenticaiton with Facebook
router.get('/auth/facebook', authenticateFacebook);

// This is the route for callback URL the user is redirected after authenticating
// with Facebook. In this route a Passport.js custom callback is used for calling
// loginWithIdp endpoint in Flex API to authenticate user to Flex
router.get('/auth/facebook/callback', authenticateFacebookCallback);

// Google authentication endpoints

// This endpoint is called when user wants to initiate authenticaiton with Google
router.get('/auth/google', authenticateGoogle);

// This is the route for callback URL the user is redirected after authenticating
// with Google. In this route a Passport.js custom callback is used for calling
// loginWithIdp endpoint in Flex API to authenticate user to Flex
router.get('/auth/google/callback', authenticateGoogleCallback);

module.exports = router;
