/**
 * Export reducers from ducks modules of different containers (i.e. default export)
 * We are following Ducks module proposition:
 * https://github.com/erikras/ducks-modular-redux
 */
import CheckoutPage from './CheckoutPage/CheckoutPage.duck';
import ContactDetailsPage from './ContactDetailsPage/ContactDetailsPage.duck';
import ContactUsPage from './ContactUsPage/ContactUsPage.duck';
import EditListingPage from './EditListingPage/EditListingPage.duck';
import FeedbackPage from './FeedbackPage/FeedbackPage.duck';
import InboxPage from './InboxPage/InboxPage.duck';
import ListingPage from './ListingPage/ListingPage.duck';
import ManageListingsPage from './ManageListingsPage/ManageListingsPage.duck';
import NotificationsPage from './NotificationsPage/NotificationsPage.duck';
import PasswordChangePage from './PasswordChangePage/PasswordChangePage.duck';
import PasswordRecoveryPage from './PasswordRecoveryPage/PasswordRecoveryPage.duck';
import PasswordResetPage from './PasswordResetPage/PasswordResetPage.duck';
import PaymentMethodsPage from './PaymentMethodsPage/PaymentMethodsPage.duck';
import ProfilePage from './ProfilePage/ProfilePage.duck';
import ProfileSettingsPage from './ProfileSettingsPage/ProfileSettingsPage.duck';
import ReferralPage from './ReferralPage/ReferralPage.duck';
import SearchPage from './SearchPage/SearchPage.duck';
import StripePaymentModal from './StripePaymentModal/StripePaymentModal.duck';
import StripePayoutPage from './StripePayoutPage/StripePayoutPage.duck';
import SubscriptionsPage from './SubscriptionsPage/SubscriptionsPage.duck';
import TopbarContainer from './TopbarContainer/TopbarContainer.duck';
import TransactionPage from './TransactionPage/TransactionPage.duck';
import UserTypePage from './UserTypePage/UserTypePage.duck';

export {
  CheckoutPage,
  ContactDetailsPage,
  ContactUsPage,
  EditListingPage,
  FeedbackPage,
  InboxPage,
  ListingPage,
  ManageListingsPage,
  NotificationsPage,
  PasswordChangePage,
  PasswordRecoveryPage,
  PasswordResetPage,
  PaymentMethodsPage,
  ProfilePage,
  ProfileSettingsPage,
  ReferralPage,
  SearchPage,
  StripePaymentModal,
  StripePayoutPage,
  SubscriptionsPage,
  TopbarContainer,
  TransactionPage,
  UserTypePage,
};
