// This dotenv import is required for the `.env` file to be read
require('dotenv').config();
const moment = require('moment');
const { getTrustedSdk } = require('./sdk');
const {
  constructBookingMetadataRecurring,
  constructBookingMetadataOneTime,
} = require('../server/bookingHelpers');
const isDev = false;
const ISO_OFFSET_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSZ';

const employerUserTokenLocal = {
  access_token:
    'eyJhbGciOiJIUzI1NiJ9.eyJjbGllbnQtaWQiOiJjM2Q1NWZhMy04OGJjLTQ1YjItOTkyYS0yZTdmNTNiNGQ2MWIiLCJ0ZW5hbmN5LWlkIjoiNjM1MWE0Y2YtMjU4OS00YjIxLWI2NGUtNThjZjg4NzI0MDI4Iiwic2NvcGUiOiJ1c2VyIiwiZXhwIjoxNjk2MTk1OTU1LCJlbnYiOiJkZW1vIiwiaWRlbnQiOiJjYXJlZ2l2ZXItdGVzdCIsInVzZXItaWQiOiI2MzUyZTFmNi1jMDdjLTQwM2MtODRhYy00OGJiYWVmNTg2YTIiLCJ1c2VyLXJvbGVzIjpbInVzZXIucm9sZS9wcm92aWRlciIsInVzZXIucm9sZS9jdXN0b21lciJdfQ.NpKULyuqDTRpzMYiWtJnZZE8SclXcWWpix-1a8KDHqc',
  scope: 'user',
  token_type: 'bearer',
  expires_in: 600,
  refresh_token:
    'v2--1eafb7ab-cdad-4923-937d-0a64ef1f1e3a--ee6f7648826080f628bc4ae066810370118f79b2',
};
const providerUserTokenLocal = {
  access_token:
    'eyJhbGciOiJIUzI1NiJ9.eyJjbGllbnQtaWQiOiJjM2Q1NWZhMy04OGJjLTQ1YjItOTkyYS0yZTdmNTNiNGQ2MWIiLCJ0ZW5hbmN5LWlkIjoiNjM1MWE0Y2YtMjU4OS00YjIxLWI2NGUtNThjZjg4NzI0MDI4Iiwic2NvcGUiOiJ1c2VyIiwiZXhwIjoxNjk2MTk2MTUzLCJlbnYiOiJkZW1vIiwiaWRlbnQiOiJjYXJlZ2l2ZXItdGVzdCIsInVzZXItaWQiOiI2MzliYmM5ZC05ZGFiLTRjMWQtYWYyYi1hY2QyNWYzNTAzMzQiLCJ1c2VyLXJvbGVzIjpbInVzZXIucm9sZS9wcm92aWRlciIsInVzZXIucm9sZS9jdXN0b21lciJdfQ.H8vabmxyVqzMQrrzf-ByYzXULeRFpAM3S4o9C6X1NmY',
  scope: 'user',
  token_type: 'bearer',
  expires_in: 600,
  refresh_token:
    'v2--c646614d-157f-43e1-a93d-1ed9fc3d8727--2a7e9628cc3b74094e7acd0fe00d22342f2b98e8',
};
const employerUserTokenDev = {
  access_token:
    'eyJhbGciOiJIUzI1NiJ9.eyJjbGllbnQtaWQiOiJjODdlZTY0ZS0yMDMwLTQ0ZjMtYjUwNS1jNDkyYjUyMjAzNmEiLCJ0ZW5hbmN5LWlkIjoiNjM1MWE0Y2YtMGNhYy00MzA5LTgyYjktN2UwNjYzMjI3OTllIiwic2NvcGUiOiJ1c2VyIiwiZXhwIjoxNjk1ODI0OTYxLCJlbnYiOiJkZXYiLCJpZGVudCI6ImNhcmVnaXZlci1kZXYiLCJ1c2VyLWlkIjoiNjM1MWE4OTQtNTI1Ni00OTViLWJkMDItOWFjYTFmNjk3ODk2IiwidXNlci1yb2xlcyI6WyJ1c2VyLnJvbGUvcHJvdmlkZXIiLCJ1c2VyLnJvbGUvY3VzdG9tZXIiXX0.9mPe19ypw1YQlK1l8-l_p-4UvNFK2UEjiakLkOdisHw',
  scope: 'user',
  token_type: 'bearer',
  expires_in: 600,
  refresh_token:
    'v2--871fa99a-f36a-4fe7-9686-b483dd725b51--3ba435be8faaf03ed99eaad03c16e0eb1291eec0',
};
const providerUserTokenDev = {
  access_token:
    'eyJhbGciOiJIUzI1NiJ9.eyJjbGllbnQtaWQiOiJjODdlZTY0ZS0yMDMwLTQ0ZjMtYjUwNS1jNDkyYjUyMjAzNmEiLCJ0ZW5hbmN5LWlkIjoiNjM1MWE0Y2YtMGNhYy00MzA5LTgyYjktN2UwNjYzMjI3OTllIiwic2NvcGUiOiJ1c2VyIiwiZXhwIjoxNjk1ODI1MTE3LCJlbnYiOiJkZXYiLCJpZGVudCI6ImNhcmVnaXZlci1kZXYiLCJ1c2VyLWlkIjoiNjQ0NDUzMTItMzhiOS00OGM0LTk5ZmUtY2EwNWI0MmI0ZTRmIiwidXNlci1yb2xlcyI6WyJ1c2VyLnJvbGUvcHJvdmlkZXIiLCJ1c2VyLnJvbGUvY3VzdG9tZXIiXX0.N2P9VXrV-4IiSBD_RCRxMut__KxEg0IisL4Mt1urIO0',
  scope: 'user',
  token_type: 'bearer',
  expires_in: 600,
  refresh_token:
    'v2--9653699c-6d1e-432e-9db9-697ac8326d80--863734432580f4d39000b9598110a0bf97f707a6',
};

const EMPLOYER_USER_TOKEN = isDev ? employerUserTokenDev : employerUserTokenLocal;
const PROVIDER_USER_TOKEN = isDev ? providerUserTokenDev : providerUserTokenLocal;

const LISTING_ID = isDev
  ? '64445318-2c84-4e24-9511-d4fe2ca745d6'
  : '63de6118-d981-4bbd-a6aa-074ceee7d5fd';
const now = moment();
const startOfDay = now.clone().startOf('day');
const start = now
  .clone()
  .add(5 - (now.minute() % 5), 'minutes')
  .set({ second: 0, millisecond: 0 });

const bookingStart = moment(start)
  .clone()
  .format(ISO_OFFSET_FORMAT);
const bookingEnd = moment(bookingStart)
  .clone()
  .add(5, 'minutes')
  .format(ISO_OFFSET_FORMAT);

console.log(bookingStart);

const exceptions = {
  addedDays: [
    // {
    //   date: startOfDay.add(3, 'days').format(ISO_OFFSET_FORMAT),
    //   startTime: '12:00am',
    //   endTime: '9:00am',
    //   type: 'addDate',
    //   day: 'mon',
    // },
  ],
  removedDays: [
    // {
    //   date: startOfDay
    //     .clone()
    //     .add(7, 'days')
    //     .format(ISO_OFFSET_FORMAT),
    //   type: 'removeDate',
    //   day: 'fri',
    // },
  ],
  changedDays: [
    // {
    //   date: startOfDay.add(7, 'days').format(ISO_OFFSET_FORMAT),
    //   startTime: '5:00pm',
    //   endTime: '7:00pm',
    //   type: 'changeDate',
    //   day: 'fri',
    // },
  ],
};

const bookingSchedule = [
  {
    dayOfWeek: 'mon',
    startTime: '5:00pm',
    endTime: '8:00pm',
  },
  {
    dayOfWeek: 'wed',
    startTime: '5:00pm',
    endTime: '8:00pm',
  },
  {
    dayOfWeek: 'thu',
    startTime: '5:00pm',
    endTime: '6:00pm',
  },
];
const bookingRate = 23;
const paymentMethodType = 'us_bank_account';

const metadata = {
  lineItems: [
    {
      code: 'line-item/booking',
      startTime: '12:00pm',
      endTime: '1:00pm',
      date: '2023-10-02T00:00:00.000-06:00',
      shortDate: '10/02',
      hours: 1,
      amount: '23.00',
      bookingFee: '4.05',
    },
    {
      code: 'line-item/booking',
      startTime: '12:00pm',
      endTime: '1:00pm',
      date: '2023-10-03T00:00:00.000-06:00',
      shortDate: '10/03',
      hours: 1,
      amount: '23.00',
      bookingFee: '1.15',
    },
    {
      code: 'line-item/booking',
      startTime: '12:00pm',
      endTime: '1:00pm',
      date: '2023-10-05T00:00:00.000-06:00',
      shortDate: '10/05',
      hours: 1,
      amount: '23.00',
      bookingFee: '1.15',
    },
  ],
  bookingRate: '27',
  bookingFee: '3.45',
  processingFee: '0.57',
  totalPayment: '85.74',
  payout: '73.02',
  type: 'oneTime',
  paymentMethodId: 'pm_1NYH31JsU2TVwfKB4U3Rja7M',
  paymentMethodType: 'us_bank_account',
  senderListingTitle: '24 Hour Care Needed for My Spouse in Westminster ',
  senderCity: 'Westminster',
  senderListingDescription:
    "It was cloudy outside but not really raining. There was a light sprinkle at most and there certainly wasn't a need for an umbrella. This hadn't stopped Sarah from pulling her umbrella ",
  stripeCustomerId: 'cus_Mqfug6MnoKUAdt',
  clientEmail: 'peyton.hobson1@gmail.com',
  stripeAccountId: 'acct_1MFf3NQw1sFyCVAj',
  providerName: 'Peyton C',
};

//   constructBookingMetadataRecurring(
//   bookingSchedule,
//   moment().startOf('day'),
//   null,
//   bookingRate,
//   paymentMethodType,
//   exceptions
// );

const BODY_PARAMS = {
  processAlias: 'single-booking-process/active',
  transition: 'transition/request-booking',
  params: {
    listingId: {
      _sdkType: 'UUID',
      uuid: LISTING_ID,
    },
    seats: 1,
    bookingStart,
    bookingEnd,
    metadata: {
      bookingSchedule,
      startDate: start.startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
      endDate: null,
      cancelAtPeriodEnd: false,
      // type: 'recurring',
      bookingRate,
      paymentMethodId: 'pm_1NYH31JsU2TVwfKB4U3Rja7M',
      paymentMethodType,
      senderListingTitle: '24 Hour Care Needed for My Spouse in Westminster ',
      senderCity: 'Westminster',
      stripeCustomerId: 'cus_Mqfug6MnoKUAdt',
      clientEmail: 'peyton.hobson1@gmail.com',
      stripeAccountId: 'acct_1MFf3NQw1sFyCVAj',
      providerName: 'Peyton C',
      exceptions,
      ...metadata,
    },
  },
};

console.log('metadata', metadata);

const main = async () => {
  try {
    const trustedSdk = await getTrustedSdk(EMPLOYER_USER_TOKEN, isDev);

    const transactionResponse = await trustedSdk.transactions.initiate(BODY_PARAMS, {
      include: ['booking', 'provider'],
      expand: true,
    });

    const providerTrustedSdk = await getTrustedSdk(PROVIDER_USER_TOKEN, isDev);

    await providerTrustedSdk.transactions.transition({
      id: transactionResponse.data.data.id.uuid,
      transition: 'transition/accept',
      params: {},
    });

    console.log('SUCCESS');
  } catch (err) {
    if (err?.data?.errors) {
      console.log(err.data.errors);
    }
  }
};

main();
