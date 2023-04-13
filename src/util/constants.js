export const EMPLOYER = 'employer';
export const CAREGIVER = 'caregiver';

// Price IDs for Stripe
export const CAREVINE_GOLD_PRICE_ID =
  process.env.REACT_APP_ENV === 'development'
    ? 'price_1MXTvhJsU2TVwfKBFEkLhUKp'
    : 'price_1MXTyYJsU2TVwfKBrzI6O23S';
export const CAREVINE_BASIC_PRICE_ID =
  process.env.REACT_APP_ENV === 'development'
    ? 'price_1MXTzRJsU2TVwfKBbucAL3ns'
    : 'price_1MXTz5JsU2TVwfKB0Dt67n8s';
export const HOURLY_RATE_PRICE_ID =
  process.env.REACT_APP_ENV === 'development'
    ? 'price_1MefLwJsU2TVwfKBJmeA4Bew'
    : 'price_1MefMNJsU2TVwfKBzID0s85E';
export const PROMO_CODES =
  process.env.REACT_APP_ENV === 'development'
    ? [
        { key: 'YOUAREGOLDEN', type: 'gold', value: 'promo_1Mw6CqJsU2TVwfKBlNBPaNho' },
        { key: 'CAREMORE', type: 'basic', value: 'promo_1Mw6JgJsU2TVwfKBD4XQLkIl' },
      ]
    : [
        { key: 'YOUAREGOLDEN', type: 'gold', value: 'promo_1MwOuEJsU2TVwfKBKv2vigZ8' },
        { key: 'CAREMORE', type: 'basic', value: 'promo_1MwOvfJsU2TVwfKBd7il1NXq' },
      ];

// Modal Missing Information Types
export const EMAIL_VERIFICATION = 'EMAIL_VERIFICATION';
export const PAYMENT_DETAILS = 'PAYMENT_DETAILS';
export const MISSING_REQUIREMENTS = 'MISSING_REQUIREMENTS';
export const MISSING_SUBSCRIPTION = 'MISSING_SUBSCRIPTION';

// Availability Plan Types
export const AVAILABILITY_PLAN_ONE_TIME = 'oneTime';
export const AVAILABILITY_PLAN_REPEAT = 'repeat';
export const AVAILABILITY_PLAN_24_HOUR = '24hour';

export const timeOrderMap = new Map([
  ['12:00am', 0],
  ['1:00am', 1],
  ['2:00am', 2],
  ['3:00am', 3],
  ['4:00am', 4],
  ['5:00am', 5],
  ['6:00am', 6],
  ['7:00am', 7],
  ['8:00am', 8],
  ['9:00am', 9],
  ['10:00am', 10],
  ['11:00am', 11],
  ['12:00pm', 12],
  ['1:00pm', 13],
  ['2:00pm', 14],
  ['3:00pm', 15],
  ['4:00pm', 16],
  ['5:00pm', 17],
  ['6:00pm', 18],
  ['7:00pm', 19],
  ['8:00pm', 20],
  ['9:00pm', 21],
  ['10:00pm', 22],
  ['11:00pm', 23],
]);

// Background check statuses
export const BACKGROUND_CHECK_APPROVED = 'approved';
export const BACKGROUND_CHECK_REJECTED = 'rejected';
export const BACKGROUND_CHECK_PENDING = 'pending';

// Notification types
export const NOTIFICATION_TYPE_PAYMENT_RECEIVED = 'paymentReceived';
export const NOTIFICATION_TYPE_NOTIFY_FOR_PAYMENT = 'notifyForPayment';
export const NOTIFICATION_TYPE_PAYMENT_REQUESTED = 'paymentRequested';
export const NOTIFICATION_TYPE_LISTING_OPENED = 'listingOpened';
export const NOTIFICATION_TYPE_LISTING_REMOVED = 'listingRemoved';
export const NOTIFICATION_TYPE_NEW_MESSAGE = 'newMessage';
