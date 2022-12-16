const { integrationSdk, handleError, serialize } = require('../api-util/sdk');
const log = require('../log');

module.exports = (req, res) => {
  // Create a PaymentIntent with the order amount and currency

  const { userId } = req.body;

  integrationSdk.users
    .show({ id: userId })
    .then(async res => {
      return res.data.data.attributes.email;
    })
    .then(apiResponse => {
      res
        .set('Content-Type', 'application/transit+json')
        .send(
          serialize({
            data: apiResponse,
          })
        )
        .end();
    })
    .catch(e => {
      handleError(res, e);
    });
};
