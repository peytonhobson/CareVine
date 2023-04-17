const axios = require('axios');
const { integrationSdk, handleError, serialize } = require('../api-util/sdk');
const log = require('../log');
const SB_API_TOKEN = process.env.SENDBIRD_API_TOKEN;
const appId = process.env.REACT_APP_SENDBIRD_APP_ID;

module.exports = (req, res) => {
  const { userAccessCode } = req.body;

  axios
    .get(`https://api-${appId}.sendbird.com/v3/users/${userAccessCode}/unread_message_count`, {
      headers: {
        'Content-Type': 'application/json; charset=utf8',
        'Api-Token': SB_API_TOKEN,
      },
    })
    .then(apiResponse => {
      console.log(apiResponse);
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
    .catch(e => {
      if (e.response) {
        handleError(res, e.response);
      } else {
        handleError(res, e);
      }
    });
};
