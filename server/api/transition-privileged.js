const { getTrustedSdk, handleError, serialize } = require('../api-util/sdk');
const log = require('../log');

module.exports = (req, res) => {
  const { bodyParams } = req.body;

  getTrustedSdk(req)
    .then(trustedSdk => {
      return trustedSdk.transactions.transition(bodyParams);
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
      console.log(e?.data?.errors?.[0]?.source);
      handleError(res, e);
    });
};
