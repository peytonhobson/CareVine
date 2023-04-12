import React, { useEffect, useState } from 'react';

import { FormattedMessage } from 'react-intl';
import { Button } from '..';
import { PROMO_CODES } from '../../util/constants';

import css from './EditListingBackgroundCheckPanel.module.css';

const BASIC = 'basic';
const GOLD = 'gold';

const PaymentInfo = props => {
  const {
    backgroundCheckType,
    subscription,
    currentUser,
    onUpdateSubscription,
    updateSubscriptionError,
    updateSubscriptionInProgress,
  } = props;

  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState(false);

  const handleApplyPromoCode = () => {
    setPromoError(false);

    const promotionCode = PROMO_CODES.find(
      code => code.key === promoCode.toLocaleUpperCase() && code.type === backgroundCheckType
    )?.value;
    if (!promotionCode) {
      setPromoError(true);
      return;
    }
    onUpdateSubscription(subscription.id, {
      promotion_code: promotionCode,
    });
  };

  useEffect(() => {
    if (subscription?.discount?.promotion_code) {
      setPromoApplied(true);
    }
  }, [subscription]);

  useEffect(() => {
    if (updateSubscriptionError) {
      setPromoError(true);
    }
  }, [updateSubscriptionError]);

  const renewalTerm = backgroundCheckType === BASIC ? 'yearly' : 'monthly';
  const feeName = backgroundCheckType === BASIC ? 'screening fee' : 'subscription';

  const latestInvoice = subscription.latest_invoice;

  const subTotal = latestInvoice?.total_excluding_tax || subscription?.plan?.amount;
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
        {promoApplied ? (
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
        {promoApplied ? (
          <h3>
            <span className={css.greyedtext}>${total / 100} </span>
            <span className={css.newDiscount}>$0.00</span>
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
            disabled={promoApplied}
          />
        </div>
        <Button
          className={css.applyButton}
          onClick={handleApplyPromoCode}
          inProgress={updateSubscriptionInProgress}
          ready={promoApplied}
          disabled={promoCode === '' || promoApplied}
        >
          Apply
        </Button>
      </div>
      {promoApplied ? (
        <p className={css.success}>
          <FormattedMessage id="EditListingBackgroundCheckPanel.discountApplied" />
        </p>
      ) : null}
      {promoError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingBackgroundCheckPanel.nullPromoError" />
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
