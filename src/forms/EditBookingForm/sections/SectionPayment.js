import React, { useState } from 'react';

import { PaymentMethods, Button, Modal } from '../../../components';
import classNames from 'classnames';

import css from '../EditBookingForm.module.css';

const SectionPayment = props => {
  const {
    isLarge,
    onChangePaymentMethod,
    onManageDisableScrolling,
    setGoToRequestError,
    onGoToRequest,
    goToRequestError,
    hideDisclaimer,
    className,
    booking,
  } = props;

  const [isPaymentLearnMoreModalOpen, setIsPaymentLearnMoreModalOpen] = useState(false);

  const classes = classNames(css.paymentContentContainer, className);

  const initialPaymentMethodId = booking?.attributes.metadata.paymentMethodId;

  return (
    <div className={classes}>
      <section className={css.paymentContainer}>
        {isLarge && goToRequestError ? <p className={css.error}>{goToRequestError}</p> : null}
        {hideDisclaimer ? null : (
          <p>
            We understand the importance of trust and security, particularly when it comes to your
            financial information. Click{' '}
            <span
              className={css.paymentLearnMore}
              onClick={() => setIsPaymentLearnMoreModalOpen(true)}
            >
              here
            </span>{' '}
            to learn more about why we ask for your payment details upfront when you request to book
            a caregiver.
          </p>
        )}
        <div className={css.processingFees}>
          <p className={css.tinyNoMargin}>*Processing Fees</p>
          <ul className={css.processingFeesList}>
            <li className={css.tinyNoMargin}>Bank Accounts: 0.8%</li>
            <li className={css.tinyNoMargin}>Payment Cards: 2.9% + $0.30</li>
          </ul>
        </div>
        <PaymentMethods
          onChangePaymentMethod={method => {
            if (onChangePaymentMethod) {
              onChangePaymentMethod(method);
            }

            if (setGoToRequestError) {
              setGoToRequestError(null);
            }
          }}
          className={css.paymentMethods}
          removeDisabled
          initialPaymentMethodId={initialPaymentMethodId}
        />
        {!isLarge && onGoToRequest ? (
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
        <div className={css.modalMessage}>
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
              you covered. If you need to cancel the booking, you'll be refunded in accordance with
              our fair and transparent{' '}
              <NamedLink
                name="TermsOfServicePage"
                target="_blank"
                to={{ hash: '#cancellation-policy' }}
              >
                cancellation policy
              </NamedLink>
              .
            </li>
          </ol>
          We take your security and trust very seriously. Our process is designed to ensure every
          transaction is safe, secure, and convenient for you. If you have any further questions or
          concerns, feel free to reach out to us.
        </div>
      </Modal>
    </div>
  );
};

export default SectionPayment;
