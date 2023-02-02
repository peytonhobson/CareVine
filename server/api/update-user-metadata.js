const { integrationSdk, handleError, serialize } = require('../api-util/sdk');
var crypto = require('crypto');
const log = require('../log');

module.exports = (req, res) => {
  const { userId, email, metadata } = req.body;

  integrationSdk.users
    .show({ id: userId, email })
    .then(userResponse => {
      const user = userResponse.data.data;

      return integrationSdk.users.updateProfile(
        {
          id: user.id,
          metadata,
        },
        {
          expand: true,
          'fields.user': ['email', 'profile.metadata'],
        }
      );
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
      // handleError(res, e);
    });
};
