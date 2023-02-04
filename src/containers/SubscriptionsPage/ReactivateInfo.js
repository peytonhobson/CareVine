import React from 'react';

import { FormattedMessage } from 'react-intl';

import css from './ReactivateInfo.module.css';

const BASIC = 'basic';
const VINE_CHECK = 'vineCheck';

const ReactivateInfo = props => {
  const { backgroundCheckType, subscription } = props;

  const renewalTerm = backgroundCheckType === BASIC ? 'yearly' : 'monthly';
  const feeName = backgroundCheckType === BASIC ? 'screening fee' : 'subscription';

  //   const latestInvoice = subscription.latest_invoice;

  const subTotal = backgroundCheckType === BASIC ? 1499 : 499;
  //   let tax = 0;
  //   latestInvoice.total_tax_amounts.forEach(taxAmount => {
  //     tax += taxAmount.amount;
  //   });
  const total = subTotal;

  return (
    <div className={css.reactivateInfo}>
      <h2>Order Summary</h2>
      <div className={css.spreadSection}>
        <h3>{backgroundCheckType === BASIC ? 'Screening Fee' : '1-Month Subscription'}:</h3>
        <h3>${subTotal / 100}</h3>
      </div>
      <div className={css.spreadSection}>
        <h3>Estimated Sales Tax (0%):</h3>
        {/* Will need to adjust this when were past the nexus */}
        <h3>$0.00</h3>
      </div>
      <hr></hr>
      <div className={css.spreadSection}>
        <h3>Total:</h3>
        <h3>${total / 100}</h3>
      </div>
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

export default ReactivateInfo;
