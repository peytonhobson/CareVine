const axios = require('axios');
const { integrationSdk, handleError, serialize } = require('../api-util/sdk');
const log = require('../log');
const AUTHENTICATE_API_KEY = process.env.AUTHENTICATE_API_KEY;

module.exports = (req, res) => {
  const { userAccessCode } = req.body;

  axios
    .delete(`https://api-v3.authenticating.com/user/service/monitoring`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AUTHENTICATE_API_KEY}`,
      },
      data: {
        userAccessCode,
      },
    })
    .then(apiResponse => {
      res
        .status(200)
        .set('Content-Type', 'application/transit+json')
        .send(
          serialize({
            data: apiResponse.data.userAccessCode,
          })
        )
        .end();
    })
    .catch(e => handleError(res, e.response));
};
