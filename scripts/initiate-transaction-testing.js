// This dotenv import is required for the `.env` file to be read
require('dotenv').config();
const moment = require('moment');
const { getTrustedSdk } = require('./sdk');
const {
  constructBookingMetadataRecurring,
  constructBookingMetadataOneTime,
} = require('../server/bookingHelpers');
const isDev = true;
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
    'eyJhbGciOiJIUzI1NiJ9.eyJjbGllbnQtaWQiOiJjODdlZTY0ZS0yMDMwLTQ0ZjMtYjUwNS1jNDkyYjUyMjAzNmEiLCJ0ZW5hbmN5LWlkIjoiNjM1MWE0Y2YtMGNhYy00MzA5LTgyYjktN2UwNjYzMjI3OTllIiwic2NvcGUiOiJ1c2VyIiwiZXhwIjoxNjk4NzA0NDg2LCJlbnYiOiJkZXYiLCJpZGVudCI6ImNhcmVnaXZlci1kZXYiLCJ1c2VyLWlkIjoiNjU0MDIxZDctOWU2My00YmQyLTk3MTQtMmUwMzk0OWU4MzczIiwidXNlci1yb2xlcyI6WyJ1c2VyLnJvbGUvcHJvdmlkZXIiLCJ1c2VyLnJvbGUvY3VzdG9tZXIiXX0.j-hYxz88fDvn0dgkWncqCq7DMBst5A8vJ_Y2G2HeUsc',
  scope: 'user',
  token_type: 'bearer',
  expires_in: 600,
  refresh_token:
    'v2--bef83b03-b310-4f5b-8694-2c00d6137ba7--dff1ba61c1ca0ea6b9747d0921923a0948b239b2',
};

// {
//   access_token:
//     'eyJhbGciOiJIUzI1NiJ9.eyJjbGllbnQtaWQiOiJjODdlZTY0ZS0yMDMwLTQ0ZjMtYjUwNS1jNDkyYjUyMjAzNmEiLCJ0ZW5hbmN5LWlkIjoiNjM1MWE0Y2YtMGNhYy00MzA5LTgyYjktN2UwNjYzMjI3OTllIiwic2NvcGUiOiJ1c2VyIiwiZXhwIjoxNjk4NjAxMjgyLCJlbnYiOiJkZXYiLCJpZGVudCI6ImNhcmVnaXZlci1kZXYiLCJ1c2VyLWlkIjoiNjM1MWE4OTQtNTI1Ni00OTViLWJkMDItOWFjYTFmNjk3ODk2IiwidXNlci1yb2xlcyI6WyJ1c2VyLnJvbGUvcHJvdmlkZXIiLCJ1c2VyLnJvbGUvY3VzdG9tZXIiXX0.LlmUoyR5gwBX0keMT6NF_VYuOg1NDzKkStPRXAoESMw',
//   scope: 'user',
//   token_type: 'bearer',
//   expires_in: 600,
//   refresh_token:
//     'v2--517999a9-6c35-4427-a60f-48a11dcd5190--992f899759bdd8ea02947731c54fab08d1128521',
// };
const providerUserTokenDev = {
  access_token:
    'eyJhbGciOiJIUzI1NiJ9.eyJjbGllbnQtaWQiOiJjODdlZTY0ZS0yMDMwLTQ0ZjMtYjUwNS1jNDkyYjUyMjAzNmEiLCJ0ZW5hbmN5LWlkIjoiNjM1MWE0Y2YtMGNhYy00MzA5LTgyYjktN2UwNjYzMjI3OTllIiwic2NvcGUiOiJ1c2VyIiwiZXhwIjoxNjk4NjAxNDM4LCJlbnYiOiJkZXYiLCJpZGVudCI6ImNhcmVnaXZlci1kZXYiLCJ1c2VyLWlkIjoiNjQ0NDUzMTItMzhiOS00OGM0LTk5ZmUtY2EwNWI0MmI0ZTRmIiwidXNlci1yb2xlcyI6WyJ1c2VyLnJvbGUvcHJvdmlkZXIiLCJ1c2VyLnJvbGUvY3VzdG9tZXIiXX0.O57I0x3phAjvjcnfy8zvAmMBRK_I0eVYPyMOZDLQIc0',
  scope: 'user',
  token_type: 'bearer',
  expires_in: 600,
  refresh_token:
    'v2--d47a96aa-c114-47d7-a342-94c45b5bf6ae--357c51e057fba4b43af2772f406cff7ef694a75f',
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
  addedDays: [],
  removedDays: [],
  changedDays: [
    // {
    //   date: startOfDay.add(19, 'days').format(ISO_OFFSET_FORMAT),
    //   startTime: '5:00pm',
    //   endTime: '7:00pm',
    //   type: 'changeDate',
    //   day: 'wed',
    // },
  ],
};

const bookingSchedule = [
  {
    dayOfWeek: 'tue',
    dayOfWeekFull: 'Tuesday',
    startTime: '3:00pm',
    endTime: '4:00pm',
  },
  {
    dayOfWeek: 'fri',
    dayOfWeekFull: 'Friday',
    startTime: '10:00am',
    endTime: '1:00pm',
  },
];
const bookingRate = 23;
const paymentMethodType = 'us_bank_account';

const metadata = constructBookingMetadataRecurring(
  bookingSchedule,
  moment()
    .startOf('week')
    .subtract(1, 'week'),
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
      startDate: start
        .startOf('day')
        .subtract(1, 'week')
        .format(ISO_OFFSET_FORMAT),
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
      bookingNumber: '22342342',
      dontUpdateBookingEnd: true,
      ...metadata,
      // lineItems: metadata.lineItems.map(l => ({
      //   ...l,
      //   date: moment(l.date)
      //     .subtract(1, 'week')
      //     .format(ISO_OFFSET_FORMAT),
      //   shortDate: moment(l.date)
      //     .subtract(1, 'week')
      //     .format('MM/DD'),
      // })),
    },
  },
};

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
    }
  }
};

main();
