const { getSdk, getTrustedSdk, handleError, serialize } = require('../api-util/sdk');
const { checkIsBlockedOneTime, checkIsBlockedRecurring } = require('../bookingHelpers');

module.exports = (req, res) => {
  const { bodyParams, queryParams } = req.body;

  const listingId = bodyParams?.params ? bodyParams.params.listingId : null;
  const metadata = bodyParams.params.metadata;

  const { type, bookingSchedule, startDate, endDate, exceptions } = metadata;

  const sdk = getSdk(req, res);

  const bookingDates = metadata.lineItems.map(l => l.date);

  return sdk.listings
    .show({ id: listingId })
    .then(listingResponse => {
      const listing = listingResponse.data.data;

      const isBooked =
        type === 'recurring'
          ? checkIsBlockedRecurring({
              bookingSchedule,
              startDate,
              endDate,
              exceptions,
              listing,
            })
          : checkIsBlockedOneTime({ dates: bookingDates, listing });

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
      const { status, statusText, data } = apiResponse;
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
