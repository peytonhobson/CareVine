export const hasPayoutEnabled = currentUser =>
  currentUser?.stripeAccount?.id &&
  !currentUser.stripeAccount.attributes?.stripeAccountData?.requirements;
