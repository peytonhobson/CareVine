import React, { useState } from 'react';

import { PaymentMethods, Button, Modal } from '../../../components';

import css from '../EditBookingForm.module.css';

const SectionPayment = props => {
  const {
    isLarge,
    showPaymentForm,
    defaultPaymentFetched,
    fetchDefaultPaymentError,
    fetchDefaultPaymentInProgress,
    stripeCustomerFetched,
    onChangePaymentMethod,
    onManageDisableScrolling,
    defaultPaymentMethods,
    setGoToRequestError,
    onGoToRequest,
    goToRequestError,
  } = props;

  const [isPaymentLearnMoreModalOpen, setIsPaymentLearnMoreModalOpen] = useState(false);

  return (
    <div className={css.paymentContentContainer}>
      <section className={css.paymentContainer}>
        {isLarge && goToRequestError ? <p className={css.error}>{goToRequestError}</p> : null}
        <p>
          We understand the importance of trust and security, particularly when it comes to your
          financial information. Click{' '}
          <span
            className={css.paymentLearnMore}
            onClick={() => setIsPaymentLearnMoreModalOpen(true)}
          >
            here
          </span>{' '}
          to learn more about why we ask for your payment details upfront when you request to book a
          caregiver.
        </p>
        <div className={css.processingFees}>
          <p className={css.tinyNoMargin}>*Processing Fees</p>
          <ul className={css.processingFeesList}>
            <li className={css.tinyNoMargin}>Bank Accounts: 0.8%</li>
            <li className={css.tinyNoMargin}>Payment Cards: 2.9% + $0.30</li>
          </ul>
        </div>
        {showPaymentForm ? (
          <PaymentMethods
            defaultPaymentFetched={defaultPaymentFetched}
            defaultPaymentMethods={defaultPaymentMethods}
            fetchDefaultPaymentError={fetchDefaultPaymentError}
            fetchDefaultPaymentInProgress={fetchDefaultPaymentInProgress}
            stripeCustomerFetched={stripeCustomerFetched}
            onChangePaymentMethod={method => {
              onChangePaymentMethod(method);
              setGoToRequestError(null);
            }}
            className={css.paymentMethods}
            removeDisabled
          />
        ) : null}
        {!isLarge ? (
          <div className={css.nextButton}>
            {goToRequestError ? <p className={css.error}>{goToRequestError}</p> : null}
            <Button onClick={onGoToRequest} type="button">
              Next: Request
            </Button>
          </div>
        ) : null}
      </section>
      <Modal
        id="EditBookingDatesModal"
        isOpen={isPaymentLearnMoreModalOpen}
        onClose={() => setIsPaymentLearnMoreModalOpen(false)}
        onManageDisableScrolling={onManageDisableScrolling}
        containerClassName={css.modalContainer}
        className={css.modalContent}
      >
        <p className={css.modalTitle}>Why do we ask for payment details upfront?</p>
        <p className={css.modalMessage}>
          <ol>
            <li className={css.learnMoreListItem}>
              <strong>Payment Upon Confirmation</strong>: Your selected payment method (either a
              bank account or a payment card) is used to ensure a seamless transaction. Rest
              assured, it is only charged once the caregiver accepts your booking request. Until
              that happens, no charges are applied.
            </li>
            <li className={css.learnMoreListItem}>
              <strong>Escrow Protection</strong>: To further protect your interests, we hold your
              payment in a secure escrow account. This process ensures your payment is safeguarded
              throughout the duration of the service and the caregiver won't receive the funds until
              the booking is complete.
            </li>
            <li className={css.learnMoreListItem}>
              <strong>Dispute Resolution</strong>: If anything goes awry during the booking, you
              have a 48-hour window to raise a dispute. Our dedicated review team will evaluate the
              situation thoroughly and refund the amount we find appropriate based on the
              circumstances.
            </li>
            <li className={css.learnMoreListItem}>
              <strong>Flexible Cancellation</strong>: We understand that plans change, and we've got
              you covered. If you need to cancel the booking, you'll be refunded in
              {/* TODO: Add link to cancellation policy in TOS here */}
              accordance with our fair and transparent cancellation policy.
            </li>
          </ol>
          We take your security and trust very seriously. Our process is designed to ensure every
          transaction is safe, secure, and convenient for you. If you have any further questions or
          concerns, feel free to reach out to us.
        </p>
      </Modal>
    </div>
  );
};

export default SectionPayment;
