const axios = require('axios');
const { integrationSdk, handleError, serialize } = require('../api-util/sdk');
const log = require('../log');
const AUTHENTICATE_COMPANY_ACCESS_KEY = process.env.AUTHENTICATE_COMPANY_ACCESS_KEY;
const AUTHENTICATE_API_KEY = process.env.AUTHENTICATE_API_KEY;
const isDev = process.env.REACT_APP_ENV === 'development';

module.exports = (req, res) => {
  const { userAccessCode } = req.body;

  axios
    .delete(
      `https://api-v3.authenticating.com/user/service/monitoring`,
      {
        userAccessCode,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AUTHENTICATE_API_KEY}`,
        },
      }
    )
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
