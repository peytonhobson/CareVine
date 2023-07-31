const { integrationSdk, handleError, serialize } = require('../api-util/sdk');
const log = require('../log');

module.exports = (req, res) => {
  const { userId, newNotification } = req.body;

  integrationSdk.users
    .show({
      id: userId,
    })
    .then(fetchedUser => {
      const oldNotifications =
        fetchedUser.data.data.attributes.profile.privateData.notifications || [];

      const newNotifications = [...oldNotifications, newNotification];

      return integrationSdk.users.updateProfile(
        {
          id: userId,
          privateData: {
            notifications: newNotifications,
          },
        },
        {
          expand: true,
          'fields.user': ['profile.privateData'],
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
      log.error(e, 'update-user-notifications-failed', {});
    });
};
