const { integrationSdk, handleError, serialize } = require('../api-util/sdk');
var crypto = require('crypto');
const log = require('../log');

module.exports = async (req, res) => {
  const { userId, newNotification } = req.body;

  try {
    const fetchedUser = await integrationSdk.users.show({
      id: userId,
    });

    const oldNotifications =
      fetchedUser.data.data.attributes.profile.privateData.notifications || [];

    const newNotifications = [...oldNotifications, newNotification];

    const apiResponse = await integrationSdk.users.updateProfile(
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
  } catch (e) {
    handleError(res, e);
  }
};
