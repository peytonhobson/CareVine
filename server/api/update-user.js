const { integrationSdk, handleError, serialize } = require('../api-util/sdk');
var crypto = require('crypto');
const log = require('../log');

module.exports = (req, res) => {
  const { userId, privateData, publicData, metadata } = req.body;

  const privateDataMaybe = privateData ? { privateData } : {};
  const publicDataMaybe = publicData ? { publicData } : {};
  const metadataMaybe = metadata ? { metadata } : {};

  return integrationSdk.users
    .updateProfile({
      id: userId,
      ...privateDataMaybe,
      ...publicDataMaybe,
      ...metadataMaybe,
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
