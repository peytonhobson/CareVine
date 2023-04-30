import React from 'react';

import { FormattedMessage } from 'react-intl';

import css from './Modals.module.css';

const BASIC = 'basic';

const ReactivateInfo = props => {
  const { backgroundCheckType, customerCreditBalance } = props;

  const renewalTerm = backgroundCheckType === BASIC ? 'yearly' : 'monthly';
  const feeName = backgroundCheckType === BASIC ? 'screening fee' : 'subscription';

  //   const latestInvoice = subscription.latest_invoice;

  const planAmount = backgroundCheckType === BASIC ? 1499 : 999;
  const totalMinusBalance = planAmount + customerCreditBalance * 100;

  const amountDue = totalMinusBalance > 0 ? totalMinusBalance : '0.00';
  //   let tax = 0;
  //   latestInvoice.total_tax_amounts.forEach(taxAmount => {
  //     tax += taxAmount.amount;
  //   });
  const total = amountDue;

  return (
    <div className={css.reactivateInfo}>
      <h2>Order Summary</h2>
      <div className={css.spreadSection}>
        <h3>{backgroundCheckType === BASIC ? 'Screening Fee' : '1-Month Subscription'}:</h3>
        {amountDue !== planAmount ? (
          <h3>
            <span className={css.greyedtext}>${planAmount / 100} </span>
            <span className={css.newDiscount}>${amountDue / 100}</span>
          </h3>
        ) : (
          <h3>${amountDue / 100}</h3>
        )}
      </div>
      <div className={css.spreadSection}>
        <h3>Estimated Sales Tax (0%):</h3>
        {/* Will need to adjust this when we're past the nexus */}
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
      {amountDue !== planAmount ? (
        <p className={css.marketplaceColor}>
          <FormattedMessage id="EditListingBackgroundCheckPanel.planAmountWarning" />
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

export default ReactivateInfo;
