import React, { useEffect, useState } from 'react';

import { FormattedMessage } from 'react-intl';
import { Button } from '..';
import {
  PROMO_CODES,
  CAREVINE_GOLD_PRICE_ID,
  CAREVINE_BASIC_PRICE_ID,
  CAREVINE_GOLD_HALF_OFF_COUPON,
} from '../../util/constants';
import moment from 'moment';

import css from './EditListingBackgroundCheckPanel.module.css';

const BASIC = 'basic';
const GOLD = 'gold';

const PaymentInfo = props => {
  const {
    backgroundCheckType,
    subscription,
    currentUser,
    stripeCustomerId,
    onCreateSetupIntent,
    setupIntent,
    onUpdateSubscription,
    onCreateSubscription,
    createSetupIntentInProgress,
    createSetupIntentError,
    createSubscriptionInProgress,
    createSubscriptionError,
  } = props;

  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState(false);

  const handleApplyPromoCode = async () => {
    setPromoError(false);

    const promotionCode = PROMO_CODES.find(
      code => code.key === promoCode.toLocaleUpperCase() && code.type === backgroundCheckType
    );
    if (!promotionCode) {
      setPromoError(true);
      return;
    }

    if (promotionCode?.type === BASIC) {
      onCreateSetupIntent(stripeCustomerId, {
        payment_method_types: ['card'],
        metadata: { backgroundCheckType },
      });
    } else {
      onCreateSubscription(
        stripeCustomerId,
        backgroundCheckType === BASIC ? CAREVINE_BASIC_PRICE_ID : CAREVINE_GOLD_PRICE_ID,
        currentUser.id?.uuid,
        {
          coupon: promotionCode.value,
          proration_behavior: 'none',
        }
      );
    }
  };

  useEffect(() => {
    if (
      setupIntent?.metadata?.backgroundCheckType === backgroundCheckType ||
      subscription?.latest_invoice?.discount
    ) {
      setPromoApplied(true);
    }
  }, [setupIntent, subscription?.id]);

  const renewalTerm = backgroundCheckType === BASIC ? 'yearly' : 'monthly';
  const feeName = backgroundCheckType === BASIC ? 'screening fee' : 'subscription';

  const latestInvoice = subscription.latest_invoice;

  const amountDue = latestInvoice?.amount_due;
  const planAmount = subscription?.plan?.amount;
  //   let tax = 0;
  //   latestInvoice.total_tax_amounts.forEach(taxAmount => {
  //     tax += taxAmount.amount;
  //   });
  const total = latestInvoice.total || subscription?.plan?.amount;

  return (
    <div className={css.paymentInfo}>
      <h2>Order Summary</h2>
      <div className={css.spreadSection}>
        <h3>{backgroundCheckType === BASIC ? 'Screening Fee' : '1-Month Subscription'}:</h3>
        {amountDue !== planAmount ? (
          <h3>
            <span className={css.greyedtext}>${planAmount / 100}</span>
            <span className={css.newDiscount}>${amountDue / 100}</span>
          </h3>
        ) : (
          <h3>${amountDue / 100}</h3>
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
        {amountDue !== planAmount ? (
          <h3>
            <span className={css.greyedtext}>${planAmount / 100} </span>
            <span className={css.newDiscount}>${amountDue / 100}</span>
          </h3>
        ) : (
          <h3>${total / 100}</h3>
        )}
      </div>
      <div className={css.promoContainer}>
        <div style={{ width: '100%' }}>
          <label htmlFor="promo-code">Promo Code</label>
          <input
            className={css.promoInput}
            id="promo-code"
            type="text"
            onChange={e => {
              setPromoError(false);
              setPromoCode(e?.target?.value);
            }}
            // disabled={promoApplied}
          />
        </div>
        <Button
          className={css.applyButton}
          onClick={handleApplyPromoCode}
          // inProgress={createSetupIntentInProgress || createSubscriptionInProgress}
          // ready={promoApplied}
          disabled={promoCode === ''}
        >
          Apply
        </Button>
      </div>
      {/* {promoApplied ? (
        <p className={css.success}>
          <FormattedMessage id="EditListingBackgroundCheckPanel.discountApplied" />
        </p>
      ) : null} */}
      {amountDue !== planAmount ? (
        <p className={css.marketplaceColor}>
          <FormattedMessage id="EditListingBackgroundCheckPanel.planAmountWarning" />
        </p>
      ) : null}
      {promoError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingBackgroundCheckPanel.nullPromoError" />
        </p>
      ) : null}
      {createSetupIntentError || createSubscriptionError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingBackgroundCheckPanel.createSetupIntentError" />
        </p>
      ) : null}
      <p className={css.textSm}>
        <FormattedMessage
          id="EditListingBackgroundCheckPanel.submitFormText"
          values={{
            paymentAmount: amountDue / 100,
          }}
        />
      </p>
      <p className={css.textSm}>
        <FormattedMessage
          id="EditListingBackgroundCheckPanel.feeAgreementMessage"
          values={{ paymentAmount: planAmount / 100, renewalTerm, feeName }}
        />
      </p>
    </div>
  );
};

export default PaymentInfo;
