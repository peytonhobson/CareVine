const { integrationSdk, handleError, serialize } = require('../api-util/sdk');
const { UUID } = (module.exports = (req, res) => {
  const { userId, notificationId, metadata } = req.body;

  integrationSdk.users
    .show({
      id: userId,
    })
    .then(fetchedUser => {
      const oldNotifications =
        fetchedUser.data.data.attributes.profile.privateData.notifications || [];

      const notificationToUpdate = oldNotifications.find(n => n.id === notificationId);

      if (!notificationToUpdate) {
        throw {
          status: 400,
          statusText: 'Bad Request',
          data: {
            errors: [
              {
                code: 'notification-not-found',
              },
            ],
          },
        };
      }

      const otherNotifications = oldNotifications.filter(n => n.id !== notificationId);

      return integrationSdk.users.updateProfile(
        {
          id: userId,
          privateData: {
            notifications: [
              ...otherNotifications,
              {
                ...notificationToUpdate,
                metadata: { ...notificationToUpdate.metadata, ...metadata },
              },
            ],
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
      handleError(res, e);
    });
});
