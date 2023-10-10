const { integrationSdk, handleError, serialize } = require('../../api-util/sdk');
const log = require('../../log');

module.exports = (req, res) => {
  // Create a PaymentIntent with the order amount and currency

  const { userId } = req.body;

  integrationSdk.users
    .show({ id: userId.uuid ?? userId })
    .then(apiResponse => {
      const stripeConnected = apiResponse.data.data?.attributes?.stripeConnected;

      if (stripeConnected) {
        res
          .set('Content-Type', 'application/transit+json')
          .send(
            serialize({
              data: true,
            })
          )
          .end();
      } else {
        res
          .set('Content-Type', 'application/transit+json')
          .send(
            serialize({
              data: false,
            })
          )
          .end();
      }
    })
    .catch(e => {
      handleError(res, e);
    });
};
