import React from 'react';

import { Modal, IconClose, StripeConnectAccountStatusBox, NamedRedirect } from '../../components';

import config from '../../config';
import { FormattedMessage, injectIntl } from '../../util/reactIntl';
import { StripeConnectAccountForm } from '../../forms';
import { manageDisableScrolling } from '../../ducks/UI.duck';
import { savePayoutDetails } from './StripePayoutModal.duck';
import {
  stripeAccountClearError,
  getStripeConnectAccountLink,
} from '../../ducks/stripeConnectAccount.duck';
import routeConfiguration from '../../routeConfiguration';
import {
  createReturnURL,
  handleGetStripeConnectAccountLinkFn,
  hasRequirements,
  getStripeAccountData,
  getBankAccountLast4Digits,
} from './StripePayoutModal.helpers';
import { compose } from 'redux';
import { connect } from 'react-redux';

import stripeLogo from '../../assets/stripe-wordmark-blurple.png';

import css from './StripePayoutModal.module.css';

const STRIPE_ONBOARDING_RETURN_URL_SUCCESS = 'success';
const STRIPE_ONBOARDING_RETURN_URL_FAILURE = 'failure';

const RedirectToStripe = ({ redirectFn }) => {
  useEffect(redirectFn('custom_account_verification'), []);
  return <FormattedMessage id="StripePayoutModal.redirectingToStripe" />;
};

const StripePayoutModal = props => {
  const {
    isOpen,
    onClose,
    onManageDisableScrolling,
    payoutDetailsSaveInProgress,
    payoutDetailsSaved,
    currentUser,
    stripeAccount,
    intl,
    stripeAccountFetched,
    onPayoutDetailsFormChange,
    onGetStripeConnectAccountLink,
    onPayoutDetailsSubmit,
    getAccountLinkInProgress,
    createStripeAccountError,
    updateStripeAccountError,
    fetchStripeAccountError,
    params,
  } = props;

  const handlePayoutSubmit = values => {
    onPayoutDetailsSubmit(values)
      .then(() => {
        onManageDisableScrolling('StripePayoutModal.payoutModal', false);
      })
      .catch(() => {
        // do nothing
      });
  };

  const { returnURLType, ...pathParams } = params;

  const currentUserLoaded = currentUser.id?.uuid;
  const stripeConnected = currentUserLoaded && !!stripeAccount && !!stripeAccount.id;
  const stripeAccountData = stripeConnected ? getStripeAccountData(stripeAccount) : null;

  const formDisabled = getAccountLinkInProgress;
  const requirementsMissing =
    stripeAccount &&
    (hasRequirements(stripeAccountData, 'past_due') ||
      hasRequirements(stripeAccountData, 'currently_due'));
  const showVerificationNeeded = stripeConnected && requirementsMissing;

  const rootURL = config.canonicalRootURL;
  const routes = routeConfiguration();
  const successURL = createReturnURL(
    STRIPE_ONBOARDING_RETURN_URL_SUCCESS,
    rootURL,
    routes,
    pathParams
  );
  const failureURL = createReturnURL(
    STRIPE_ONBOARDING_RETURN_URL_FAILURE,
    rootURL,
    routes,
    pathParams
  );
  const accountId = stripeConnected ? stripeAccount.id : null;

  const handleGetStripeConnectAccountLink = handleGetStripeConnectAccountLinkFn(
    onGetStripeConnectAccountLink,
    {
      accountId,
      successURL,
      failureURL,
    }
  );

  const returnedNormallyFromStripe = returnURLType === STRIPE_ONBOARDING_RETURN_URL_SUCCESS;
  const returnedAbnormallyFromStripe = returnURLType === STRIPE_ONBOARDING_RETURN_URL_FAILURE;

  // Redirect from success URL to basic path for StripePayoutPage
  if (returnedNormallyFromStripe && stripeConnected && !requirementsMissing) {
    return <NamedRedirect name="CreateProfilePage" params={pathParams} />;
  }

  const stripeAccountError =
    createStripeAccountError || updateStripeAccountError || fetchStripeAccountError;

  return (
    <Modal
      id="StripePayoutModal.payoutModal"
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
    >
      <div className={css.modalPayoutDetailsWrapper}>
        <div className={css.modalTitleContainer}>
          <h1 className={css.modalTitle}>
            <FormattedMessage id="StripePayoutModal.payoutModalTitleOneMoreThing" />
            <br />
            <FormattedMessage id="StripePayoutModal.payoutModalTitlePayoutPreferences" />
          </h1>
          <div className={css.stripeContainer}>
            <p className={css.poweredBy}>Powered by</p>
            <img src={stripeLogo} className={css.stripeLogo} />
          </div>
        </div>
        {!currentUserLoaded ? (
          <FormattedMessage id="StripePayoutModal.loadingData" />
        ) : returnedAbnormallyFromStripe ? (
          <p className={css.modalMessage}>
            <RedirectToStripe redirectFn={handleGetStripeConnectAccountLink} />
          </p>
        ) : (
          <>
            <p className={css.modalMessage}>
              <FormattedMessage
                id="StripePayoutModal.payoutModalInfo"
                values={{
                  closeButtonText: (
                    <span rootClassName={css.close} title="CLOSE">
                      <span className={css.closeText}>CLOSE</span>
                      <IconClose rootClassName={css.closeIcon} />
                    </span>
                  ),
                }}
              />
            </p>
            <StripeConnectAccountForm
              disabled={formDisabled}
              inProgress={payoutDetailsSaveInProgress}
              ready={payoutDetailsSaved}
              currentUser={currentUser}
              stripeBankAccountLastDigits={getBankAccountLast4Digits(stripeAccountData)}
              savedCountry="US"
              submitButtonText={intl.formatMessage({
                id: 'StripePayoutModal.submitButtonText',
              })}
              stripeAccountError={stripeAccountError}
              stripeAccountFetched={stripeAccountFetched}
              onChange={onPayoutDetailsFormChange}
              onSubmit={handlePayoutSubmit}
              onGetStripeConnectAccountLink={handleGetStripeConnectAccountLink}
              stripeConnected={stripeConnected}
            >
              {stripeConnected && !returnedAbnormallyFromStripe && showVerificationNeeded ? (
                <StripeConnectAccountStatusBox
                  type="verificationNeeded"
                  inProgress={getAccountLinkInProgress}
                  onGetStripeConnectAccountLink={handleGetStripeConnectAccountLink(
                    'custom_account_verification'
                  )}
                />
              ) : stripeConnected && !returnedAbnormallyFromStripe ? (
                <StripeConnectAccountStatusBox
                  type="verificationSuccess"
                  inProgress={getAccountLinkInProgress}
                  disabled={payoutDetailsSaveInProgress}
                  onGetStripeConnectAccountLink={handleGetStripeConnectAccountLink(
                    'custom_account_update'
                  )}
                />
              ) : null}
            </StripeConnectAccountForm>
          </>
        )}
      </div>
    </Modal>
  );
};

const mapStateToProps = state => {
  const {
    getAccountLinkInProgress,
    createStripeAccountError,
    updateStripeAccountError,
    fetchStripeAccountError,
    stripeAccount,
    stripeAccountFetched,
  } = state.stripeConnectAccount;

  const { payoutDetailsSaveInProgress, payoutDetailsSaved } = state.StripePayoutModal;

  const { currentUser } = state.user;

  return {
    createStripeAccountError,
    fetchStripeAccountError,
    getAccountLinkInProgress,
    stripeAccount,
    stripeAccountFetched,
    updateStripeAccountError,
    currentUser,
    payoutDetailsSaveInProgress,
    payoutDetailsSaved,
  };
};

const mapDispatchToProps = {
  onGetStripeConnectAccountLink: getStripeConnectAccountLink,
  onPayoutDetailsFormChange: stripeAccountClearError,
  onPayoutDetailsSubmit: savePayoutDetails,
  onManageDisableScrolling: manageDisableScrolling,
  onGetStripeConnectAccountLink: getStripeConnectAccountLink,
};

export default compose(injectIntl, connect(mapStateToProps, mapDispatchToProps))(StripePayoutModal);
