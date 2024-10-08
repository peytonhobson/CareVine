/**
 * Export loadData calls from ducks modules of different containers
 */
import { loadData as BookingsPageLoader } from './BookingsPage/BookingsPage.duck';
import { setInitialValues as CheckoutPageInitialValues } from './CheckoutPage/CheckoutPage.duck';
import { loadData as CheckoutPageLoader } from './CheckoutPage/CheckoutPage.duck';
import { loadData as ContactDetailsPageLoader } from './ContactDetailsPage/ContactDetailsPage.duck';
import { loadData as EditListingPageLoader } from './EditListingPage/EditListingPage.duck';
import { loadData as EmailVerificationPageLoader } from './EmailVerificationPage/EmailVerificationPage.duck';
// import { loadData as InboxPageLoader } from './InboxPage/InboxPage.duck';
import { loadData as ListingPageLoader } from './ListingPage/ListingPage.duck';
import { loadData as ManageListingsPageLoader } from './ManageListingsPage/ManageListingsPage.duck';
import { loadData as PaymentMethodsPageLoader } from './PaymentMethodsPage/PaymentMethodsPage.duck';
import { loadData as ProfilePageLoader } from './ProfilePage/ProfilePage.duck';
import { loadData as SearchPageLoader } from './SearchPage/SearchPage.duck';
import { loadData as StripePayoutPageLoader } from './StripePayoutPage/StripePayoutPage.duck';
import { loadData as TopbarContainerLoader } from './TopbarContainer/TopbarContainer.duck';
import { loadData as SubscriptionsPageLoader } from './SubscriptionsPage/SubscriptionsPage.duck';
import {
  loadData as TransactionPageLoader,
  setInitialValues as TransactionPageInitialValues,
} from './TransactionPage/TransactionPage.duck';
import { loadData as UserTypePageLoader } from './UserTypePage/UserTypePage.duck';
import { loadData as NotificationsPageLoader } from './NotificationsPage/NotificationsPage.duck';
import { loadData as InboxPageLoader } from './InboxPage/InboxPage.duck';
import { loadData as ListingTrackingPageLoader } from './ListingTrackingPage/ListingTrackingPage.duck';

const getPageDataLoadingAPI = () => {
  return {
    BookingsPage: {
      loadData: BookingsPageLoader,
    },
    ListingTrackingPage: {
      loadData: ListingTrackingPageLoader,
    },
    CheckoutPage: {
      setInitialValues: CheckoutPageInitialValues,
      loadData: CheckoutPageLoader,
    },
    ContactDetailsPage: {
      loadData: ContactDetailsPageLoader,
    },
    EditListingPage: {
      loadData: EditListingPageLoader,
    },
    EmailVerificationPage: {
      loadData: EmailVerificationPageLoader,
    },
    InboxPage: {
      loadData: InboxPageLoader,
    },
    ListingPage: {
      loadData: ListingPageLoader,
    },
    ManageListingsPage: {
      loadData: ManageListingsPageLoader,
    },
    PaymentMethodsPage: {
      loadData: PaymentMethodsPageLoader,
    },
    ProfilePage: {
      loadData: ProfilePageLoader,
    },
    SearchPage: {
      loadData: SearchPageLoader,
    },
    StripePayoutPage: {
      loadData: StripePayoutPageLoader,
    },
    SubscriptionsPage: {
      loadData: SubscriptionsPageLoader,
    },
    TopbarContainer: {
      loadData: TopbarContainerLoader,
    },
    TransactionPage: {
      loadData: TransactionPageLoader,
      setInitialValues: TransactionPageInitialValues,
    },
    UserTypePage: {
      loadData: UserTypePageLoader,
    },
    NotificationsPage: {
      loadData: NotificationsPageLoader,
    },
  };
};

export default getPageDataLoadingAPI;
