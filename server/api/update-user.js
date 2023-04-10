const { integrationSdk, handleError, serialize } = require('../api-util/sdk');
var crypto = require('crypto');
const log = require('../log');

module.exports = (req, res) => {
  const { userId, privateData, publicData, metadata, fetchUser } = req.body;

  return integrationSdk.users
    .updateProfile(
      {
        id: userId,
        metadata,
        publicData,
        privateData,
      },
      {
        expand: true,
        'fields.user': ['email', 'profile.metadata'],
      }
    )
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
      log.error(e.data.errors);
      handleError(res, e);
    });
};
