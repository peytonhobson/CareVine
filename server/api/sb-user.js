const axios = require('axios');
const { integrationSdk, handleError, serialize } = require('../api-util/sdk');
const log = require('../log');
const SB_API_TOKEN = process.env.SENDBIRD_API_TOKEN;

module.exports = (req, res) => {
  const { currentUser } = req.body;

  const appId = process.env.REACT_APP_SENDBIRD_APP_ID;
  const userId = currentUser && currentUser.id && currentUser.id.uuid;
  const nickname =
    currentUser && currentUser.attributes && currentUser.attributes.profile.displayName;
  const profileUrl =
    currentUser &&
    currentUser.profileImage &&
    currentUser.profileImage.attributes.variants['square-small'].url;

  axios
    .put(
      `https://api-${appId}.sendbird.com/v3/users/${userId}`,
      {
        user_id: userId,
        nickname,
        profile_url: profileUrl || '',
        issue_access_token: true,
      },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf8',
          'Api-Token': SB_API_TOKEN,
        },
      }
    )
    .then(apiResponse => {
      return integrationSdk.users.updateProfile(
        {
          id: userId,
          privateData: {
            sbAccessToken: apiResponse.data.access_token,
          },
        },
        {
          expand: true,
          'fields.user': ['email', 'profile.metadata', 'emailVerified'],
        }
      );
    })
    .then(apiResponse => {
      res
        .status(200)
        .set('Content-Type', 'application/transit+json')
        .send(
          serialize({
            data: apiResponse,
          })
        )
        .end();
    })
    .catch(e => log.error(e));
};
