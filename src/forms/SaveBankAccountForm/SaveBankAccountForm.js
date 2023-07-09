import React, { useEffect } from 'react';

import { bool, func, shape, string } from 'prop-types';
import { injectIntl, intlShape } from '../../util/reactIntl';
import { useStripe } from '@stripe/react-stripe-js';
import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';

import { Button, IconSpinner } from '../../components';
import { propTypes } from '../../util/types';

import css from './SaveBankAccountForm.module.css';

const SaveBankAccountForm = props => {
  const stripe = useStripe();

  const {
    className,
    createBankAccountError,
    createBankAccountInProgress,
    createBankAccountSuccess,
    currentUser,
    fetchDefaultPaymentInProgress,
    intl,
    onFetchDefaultPayment,
    onSubmit,
  } = props;

  const stripeCustomer = currentUser && currentUser.stripeCustomer;

  useEffect(() => {
    if (createBankAccountSuccess && stripeCustomer) {
      onFetchDefaultPayment(stripeCustomer.attributes.stripeCustomerId);
    }
  }, [createBankAccountSuccess, stripeCustomer?.id.uuid]);

  const classes = classNames(css.root, className);

  const createBankAccountErrorMessage = intl.formatMessage({
    id: 'SaveBankAccountForm.createBankAccountErrorMessage',
  });
  const hasErrors = !!createBankAccountError;

  const submitInProgress = createBankAccountInProgress || fetchDefaultPaymentInProgress;
  const submitDisabled = !stripe || !currentUser;

  return (
    <div className={classes}>
      {hasErrors && <span className={css.errorMessage}>{createBankAccountErrorMessage}</span>}
      {fetchDefaultPaymentInProgress ? (
        <IconSpinner />
      ) : (
        <Button
          className={css.submitButton}
          type="submit"
          inProgress={submitInProgress}
          disabled={submitDisabled}
          onClick={() => onSubmit(stripe)}
        >
          <FormattedMessage id="SaveBankAccountForm.submitPaymentInfo" />
        </Button>
      )}
    </div>
  );
};

SaveBankAccountForm.defaultProps = {
  className: null,
  createBankAccountError: null,
  createBankAccountInProgress: false,
  createBankAccountSuccess: false,
  currentUser: null,
  fetchDefaultPaymentInProgress: false,
  intl: null,
  onFetchDefaultPayment: null,
  onSubmit: null,
};

SaveBankAccountForm.propTypes = {
  className: string,
  createBankAccountError: propTypes.error,
  createBankAccountInProgress: bool,
  createBankAccountSuccess: bool,
  currentUser: propTypes.currentUser,
  fetchDefaultPaymentInProgress: bool,
  intl: intlShape.isRequired,
  onFetchDefaultPayment: func,
  onSubmit: func,
};

export default injectIntl(SaveBankAccountForm);
