// This dotenv import is required for the `.env` file to be read
require('dotenv').config();
const { getTrustedSdk, integrationSdk } = require('./sdk');
const moment = require('moment');

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const employerUserToken = {
  access_token:
    'eyJhbGciOiJIUzI1NiJ9.eyJjbGllbnQtaWQiOiJjM2Q1NWZhMy04OGJjLTQ1YjItOTkyYS0yZTdmNTNiNGQ2MWIiLCJ0ZW5hbmN5LWlkIjoiNjM1MWE0Y2YtMjU4OS00YjIxLWI2NGUtNThjZjg4NzI0MDI4Iiwic2NvcGUiOiJ1c2VyIiwiZXhwIjoxNjk1NjY3MjQ4LCJlbnYiOiJkZW1vIiwiaWRlbnQiOiJjYXJlZ2l2ZXItdGVzdCIsInVzZXItaWQiOiI2MzUyZTFmNi1jMDdjLTQwM2MtODRhYy00OGJiYWVmNTg2YTIiLCJ1c2VyLXJvbGVzIjpbInVzZXIucm9sZS9wcm92aWRlciIsInVzZXIucm9sZS9jdXN0b21lciJdfQ.RzW9hqmSZvQ6ag8kebdIOVdKlG3TsSsYEOJpbMGOmPE',
  scope: 'user',
  token_type: 'bearer',
  expires_in: 600,
  refresh_token:
    'v2--8b44fc85-b961-4330-98cd-8420c2c8bb4a--2538a3f7837fbc7443bdc1ee83de80a22c617848',
};
const providerUserToken = {
  access_token:
    'eyJhbGciOiJIUzI1NiJ9.eyJjbGllbnQtaWQiOiJjM2Q1NWZhMy04OGJjLTQ1YjItOTkyYS0yZTdmNTNiNGQ2MWIiLCJ0ZW5hbmN5LWlkIjoiNjM1MWE0Y2YtMjU4OS00YjIxLWI2NGUtNThjZjg4NzI0MDI4Iiwic2NvcGUiOiJ1c2VyIiwiZXhwIjoxNjk1NjY3MzYzLCJlbnYiOiJkZW1vIiwiaWRlbnQiOiJjYXJlZ2l2ZXItdGVzdCIsInVzZXItaWQiOiI2MzliYmM5ZC05ZGFiLTRjMWQtYWYyYi1hY2QyNWYzNTAzMzQiLCJ1c2VyLXJvbGVzIjpbInVzZXIucm9sZS9wcm92aWRlciIsInVzZXIucm9sZS9jdXN0b21lciJdfQ.1YSaCfeNYPkPjyZNvP_FKkiRPcf4fmUfa1CAGD1BWCE',
  scope: 'user',
  token_type: 'bearer',
  expires_in: 600,
  refresh_token:
    'v2--c1c81ac1-ff2c-4e39-b579-0fb1775f52db--29f5079408ca98d3c32615b4f756641a44b6bcf7',
};

const timeout = 500;

const LISTING_ID = '63de6118-d981-4bbd-a6aa-074ceee7d5fd';
const now = moment(new Date());
const startOfDay = now.clone().startOf('day');
const start = now
  .clone()
  .add(5 - (now.minute() % 5), 'minutes')
  .set({ second: 0, millisecond: 0 });

const bookingStart = moment(start)
  .clone()
  .toISOString();
const bookingEnd = moment(bookingStart)
  .clone()
  .add(5, 'minutes')
  .toISOString();

const startTime = start
  .clone()
  .add(1, 'hours')
  .set({ minutes: 0, second: 0, millisecond: 0 })
  .format('h:mma');
const endTime = start
  .clone()
  .set({ minutes: 0, second: 0, millisecond: 0 })
  .add(2, 'hours')
  .format('h:mma');

const exceptions = {
  addedDays: [
    // {
    //   date: startOfDay.add(6, 'days').toISOString(),
    //   startTime: '3:00am',
    //   endTime: '4:00am',
    //   type: 'addDate',
    //   day: WEEKDAYS[moment().weekday() - 2],
    // },
  ],
  removedDays: [
    // {
    //   date: startOfDay
    //     .clone()
    //     .add(7, 'days')
    //     .toISOString(),
    //   type: 'removeDate',
    //   day: WEEKDAYS[moment().weekday() - 1],
    // },
  ],
  changedDays: [],
};

/*
EXCEPTIONS FORMAT

{
      date: startOfDay.add(6, 'days').toISOString(),
      startTime: "3:00am",
      endTime: "4:00am",
      type: 'addDate',
      day: WEEKDAYS[moment().weekday()],
}
{
      date: startOfDay.add(7, 'days').toISOString(),
      type: 'removeDate',
      day: WEEKDAYS[moment().weekday() -1],
    }
*/

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
      lineItems: [
        {
          code: 'line-item/booking',
          startTime,
          endTime,
          seats: 1,
          date: start.startOf('day').toISOString(),
          shortDate: start.format('MM/DD'),
          hours: 1,
          amount: '243.00',
          bookingFee: '12.15',
        },
      ],
      bookingFee: '12.15',
      processingFee: '2.06',
      totalPayment: '257.21',
      payout: '243.00',
      bookingSchedule: [
        {
          dayOfWeek: start.format('ddd').toLocaleLowerCase(),
          startTime,
          endTime,
        },
      ],
      startDate: start.startOf('day').toISOString(),
      endDate: null,
      cancelAtPeriodEnd: false,
      type: 'recurring',
      bookingRate: '27',
      paymentMethodId: 'pm_1NYH31JsU2TVwfKB4U3Rja7M',
      paymentMethodType: 'us_bank_account',
      senderListingTitle: '24 Hour Care Needed for My Spouse in Westminster ',
      senderCity: 'Westminster',
      stripeCustomerId: 'cus_Mqfug6MnoKUAdt',
      clientEmail: 'peyton.hobson1@gmail.com',
      stripeAccountId: 'acct_1MFf3NQw1sFyCVAj',
      providerName: 'Peyton C',
      exceptions,
    },
  },
};

const main = async () => {
  try {
    const trustedSdk = await getTrustedSdk(employerUserToken);

    const transactionResponse = await trustedSdk.transactions.initiate(BODY_PARAMS, {
      include: ['booking', 'provider'],
      expand: true,
    });

    const providerTrustedSdk = await getTrustedSdk(providerUserToken);

    await providerTrustedSdk.transactions.transition({
      id: transactionResponse.data.data.id.uuid,
      transition: 'transition/accept',
      params: {
        metadata: {
          asdf: 'asdf',
        },
      },
    });

    console.log('SUCCESS');
  } catch (err) {
    console.log(err?.data);

    if (err?.data?.errors) {
      console.log(err.data.errors.map(e => e.source));
    }
  }
};

main();
