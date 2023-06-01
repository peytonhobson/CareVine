import { createResourceLocatorString } from '../../util/routes';

export const createReturnURL = (returnURLType, rootURL, routes, pathParams) => {
  if (returnURLType === 'success') {
    const path = createResourceLocatorString('SignupPage', routes, pathParams);
    const root = rootURL.replace(/\/$/, '');
    return `${root}${path}`;
  }

  const path = createResourceLocatorString(
    'EditListingStripeOnboardingPage',
    routes,
    { ...pathParams, returnURLType },
    {}
  );

  const root = rootURL.replace(/\/$/, '');
  return `${root}${path}`;
};

export const handleGetStripeConnectAccountLinkFn = (getLinkFn, commonParams) => type => () => {
  getLinkFn({ type, ...commonParams })
    .then(url => {
      window.location.href = url;
    })
    .catch(err => console.error(err));
};

export const hasRequirements = (stripeAccountData, requirementType) =>
  stripeAccountData != null &&
  stripeAccountData.requirements &&
  Array.isArray(stripeAccountData.requirements[requirementType]) &&
  stripeAccountData.requirements[requirementType].length > 0;

// Get attribute: stripeAccountData
export const getStripeAccountData = stripeAccount =>
  stripeAccount.attributes.stripeAccountData || null;

// Get last 4 digits of bank account returned in Stripe account
export const getBankAccountLast4Digits = stripeAccountData =>
  stripeAccountData && stripeAccountData.external_accounts.data.length > 0
    ? stripeAccountData.external_accounts.data[0].last4
    : null;
