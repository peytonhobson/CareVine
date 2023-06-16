const {
  getSdk,
  getTrustedSdk,
  integrationSdk,
  handleError,
  serialize,
} = require('../api-util/sdk');

module.exports = (req, res) => {
  const { bodyParams, queryParams } = req.body;

  const listingId = bodyParams?.params ? bodyParams.params.listingId : null;
  const metadata = bodyParams.params.metadata;

  const sdk = getSdk(req, res);

  let transactionResponse = null;
  let prevBookedDates = null;
  const bookingDates = metadata.lineItems.map(l => l.date);

  sdk.listings
    .show({ id: listingId })
    .then(listingResponse => {
      const listing = listingResponse.data.data;

      prevBookedDates = listing.attributes.metadata.bookedDates ?? [];
      const bookedDatesUnixTimestamps = prevBookedDates.map(d => new Date(d).getTime()) ?? [];
      const bookingDatesUnixTimestamps = bookingDates.map(d => new Date(d).getTime());

      const isBooked =
        bookingDatesUnixTimestamps.some(d => bookedDatesUnixTimestamps.includes(d)) ?? false;

      if (isBooked) {
        throw {
          status: 400,
          statusText: 'Bad Request',
          data: {
            errors: [
              {
                code: 'transaction-booking-time-not-available',
              },
            ],
          },
        };
      }

      return getTrustedSdk(req);
    })
    .then(trustedSdk => {
      return trustedSdk.transactions.initiate(bodyParams, queryParams);
    })
    .then(apiResponse => {
      transactionResponse = apiResponse;

      return integrationSdk.listings.update({
        id: listingId,
        metadata: {
          bookedDates: [...bookingDates, ...prevBookedDates],
        },
      });
    })
    .then(() => {
      const { status, statusText, data } = transactionResponse;
      res
        .status(status)
        .set('Content-Type', 'application/transit+json')
        .send(
          serialize({
            status,
            statusText,
            data,
          })
        )
        .end();
    })
    .catch(e => {
      handleError(res, e);
    });
};
