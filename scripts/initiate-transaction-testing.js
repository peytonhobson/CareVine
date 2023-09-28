// This dotenv import is required for the `.env` file to be read
require('dotenv').config();
const moment = require('moment');
const { getTrustedSdk } = require('./sdk');
const { constructBookingMetadataRecurring } = require('../server/bookingHelpers');
const isDev = false;
const ISO_OFFSET_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSZ';

const employerUserTokenLocal = {
  access_token:
    'eyJhbGciOiJIUzI1NiJ9.eyJjbGllbnQtaWQiOiJjM2Q1NWZhMy04OGJjLTQ1YjItOTkyYS0yZTdmNTNiNGQ2MWIiLCJ0ZW5hbmN5LWlkIjoiNjM1MWE0Y2YtMjU4OS00YjIxLWI2NGUtNThjZjg4NzI0MDI4Iiwic2NvcGUiOiJ1c2VyIiwiZXhwIjoxNjk1NjY3MjQ4LCJlbnYiOiJkZW1vIiwiaWRlbnQiOiJjYXJlZ2l2ZXItdGVzdCIsInVzZXItaWQiOiI2MzUyZTFmNi1jMDdjLTQwM2MtODRhYy00OGJiYWVmNTg2YTIiLCJ1c2VyLXJvbGVzIjpbInVzZXIucm9sZS9wcm92aWRlciIsInVzZXIucm9sZS9jdXN0b21lciJdfQ.RzW9hqmSZvQ6ag8kebdIOVdKlG3TsSsYEOJpbMGOmPE',
  scope: 'user',
  token_type: 'bearer',
  expires_in: 600,
  refresh_token:
    'v2--8b44fc85-b961-4330-98cd-8420c2c8bb4a--2538a3f7837fbc7443bdc1ee83de80a22c617848',
};
const providerUserTokenLocal = {
  access_token:
    'eyJhbGciOiJIUzI1NiJ9.eyJjbGllbnQtaWQiOiJjM2Q1NWZhMy04OGJjLTQ1YjItOTkyYS0yZTdmNTNiNGQ2MWIiLCJ0ZW5hbmN5LWlkIjoiNjM1MWE0Y2YtMjU4OS00YjIxLWI2NGUtNThjZjg4NzI0MDI4Iiwic2NvcGUiOiJ1c2VyIiwiZXhwIjoxNjk1NjY3MzYzLCJlbnYiOiJkZW1vIiwiaWRlbnQiOiJjYXJlZ2l2ZXItdGVzdCIsInVzZXItaWQiOiI2MzliYmM5ZC05ZGFiLTRjMWQtYWYyYi1hY2QyNWYzNTAzMzQiLCJ1c2VyLXJvbGVzIjpbInVzZXIucm9sZS9wcm92aWRlciIsInVzZXIucm9sZS9jdXN0b21lciJdfQ.1YSaCfeNYPkPjyZNvP_FKkiRPcf4fmUfa1CAGD1BWCE',
  scope: 'user',
  token_type: 'bearer',
  expires_in: 600,
  refresh_token:
    'v2--c1c81ac1-ff2c-4e39-b579-0fb1775f52db--29f5079408ca98d3c32615b4f756641a44b6bcf7',
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
  .format('YYYY-MM-DDTHH:mm:ss.SSSZ');
const bookingEnd = moment(bookingStart)
  .clone()
  .add(5, 'minutes')
  .format('YYYY-MM-DDTHH:mm:ss.SSSZ');

console.log(bookingStart);

const exceptions = {
  addedDays: [
    // {
    //   date: startOfDay.add(3, 'days').format(ISO_OFFSET_FORMAT),
    //   startTime: '12:00am',
    //   endTime: '2:00am',
    //   type: 'addDate',
    //   day: 'mon',
    // },
  ],
  removedDays: [
    // {
    //   date: startOfDay
    //     .clone()
    //     .add(8, 'days')
    //     .format(ISO_OFFSET_FORMAT),
    //   type: 'removeDate',
    //   day: 'fri',
    // },
  ],
  changedDays: [
    {
      date: startOfDay.format(ISO_OFFSET_FORMAT),
      startTime: '5:00pm',
      endTime: '7:00pm',
      type: 'changeDate',
      day: 'thu',
    },
  ],
};

const bookingSchedule = [
  {
    dayOfWeek: 'thu',
    startTime: '2:00pm',
    endTime: '3:00pm',
  },
  {
    dayOfWeek: 'sun',
    startTime: '2:00pm',
    endTime: '3:00pm',
  },
];
const bookingRate = 24;
const paymentMethodType = 'us_bank_account';

const metadata = constructBookingMetadataRecurring(
  bookingSchedule,
  moment().startOf('day'),
  null,
  bookingRate,
  paymentMethodType,
  exceptions
);

const BODY_PARAMS = {
  processAlias: 'booking-process/active',
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
      type: 'recurring',
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
    console.log(err);

    if (err?.data?.errors) {
      console.log(err.data.errors);
      console.log(err.data.errors.map(e => e.source));
    }
  }
};

main();
