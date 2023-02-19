import React, { useEffect, useState } from 'react';

import { FormattedMessage } from 'react-intl';
import { Button } from '..';
import { FREE_FIRST_PERIOD_ID } from '../../util/constants';

import css from './EditListingBackgroundCheckPanel.module.css';

const BASIC = 'basic';
const VINE_CHECK = 'vineCheck';

const PaymentInfo = props => {
  const {
    backgroundCheckType,
    subscription,
    currentUser,
    onApplyBCPromoCode,
    applyBCPromoInProgress,
    applyBCPromoError,
    bcPromo,
    backgroundCheckPromo,
    onUpdateSubscription,
    updateSubscriptionError,
    updateSubscriptionInProgress,
  } = props;

  const [promoCode, setPromoCode] = useState('');

  useEffect(() => {
    if (bcPromo?.discount === FREE_FIRST_PERIOD_ID) {
      onUpdateSubscription(subscription.id, { coupon: bcPromo?.discount });
    }
  }, [bcPromo]);

  const renewalTerm = backgroundCheckType === BASIC ? 'yearly' : 'monthly';
  const feeName = backgroundCheckType === BASIC ? 'screening fee' : 'subscription';

  const latestInvoice = subscription.latest_invoice;

  const subTotal = latestInvoice.total_excluding_tax;
  //   let tax = 0;
  //   latestInvoice.total_tax_amounts.forEach(taxAmount => {
  //     tax += taxAmount.amount;
  //   });
  const total = latestInvoice.total;

  const userId = currentUser.id.uuid;
  const freeFirstPeriod = backgroundCheckPromo?.discount === FREE_FIRST_PERIOD_ID;

  return (
    <div className={css.paymentInfo}>
      <h2>Order Summary</h2>
      <div className={css.spreadSection}>
        <h3>{backgroundCheckType === BASIC ? 'Screening Fee' : '1-Month Subscription'}:</h3>
        {freeFirstPeriod && backgroundCheckType === VINE_CHECK ? (
          <h3>
            <span className={css.greyedtext}>${subTotal / 100}</span>
            <span className={css.newDiscount}>$0.00</span>
          </h3>
        ) : (
          <h3>${subTotal / 100}</h3>
        )}
      </div>
      <div className={css.spreadSection}>
        <h3>Estimated Sales Tax (0%):</h3>
        {/* Will need to adjust this when were past the nexus */}
        <h3>$0.00</h3>
      </div>
      <hr></hr>
      <div className={css.spreadSection}>
        <h3>Total:</h3>
        {freeFirstPeriod && backgroundCheckType === VINE_CHECK ? (
          <h3>
            <span className={css.greyedtext}>${total / 100} </span>
            <span className={css.newDiscount}>$0.00</span>
          </h3>
        ) : (
          <h3>${total / 100}</h3>
        )}
      </div>
      {backgroundCheckType === VINE_CHECK && (
        <div className={css.promoContainer}>
          <div>
            <label htmlFor="promo-code">Promo Code</label>
            <input
              className={css.promoInput}
              id="promo-code"
              type="text"
              onChange={e => setPromoCode(e?.target?.value)}
            />
          </div>
          <Button
            className={css.applyButton}
            onClick={() => onApplyBCPromoCode(promoCode, userId)}
            inProgress={applyBCPromoInProgress || updateSubscriptionInProgress}
            ready={bcPromo && bcPromo.discount !== null}
            disabled={promoCode === ''}
          >
            Apply
          </Button>
        </div>
      )}
      {applyBCPromoError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingBackgroundCheckPanel.applyPromoError" />
        </p>
      ) : null}
      {bcPromo && bcPromo.discount === null ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingBackgroundCheckPanel.nullPromoError" />
        </p>
      ) : null}
      {bcPromo && bcPromo.discount === FREE_FIRST_PERIOD_ID ? (
        <p className={css.success}>
          <FormattedMessage id="EditListingBackgroundCheckPanel.discountApplied" />
        </p>
      ) : null}
      {updateSubscriptionError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingBackgroundCheckPanel.updateSubscriptionError" />
        </p>
      ) : null}
      <p className={css.textSm}>
        <FormattedMessage
          id="EditListingBackgroundCheckPanel.submitFormText"
          values={{
            paymentAmount: subTotal / 100,
          }}
        />
      </p>
      <p className={css.textSm}>
        <FormattedMessage
          id="EditListingBackgroundCheckPanel.feeAgreementMessage"
          values={{ paymentAmount: subTotal / 100, renewalTerm, feeName }}
        />
      </p>
    </div>
  );
};

export default PaymentInfo;
