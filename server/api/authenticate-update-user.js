const axios = require('axios');
const { integrationSdk, handleError, serialize } = require('../api-util/sdk');
const log = require('../log');
const AUTHENTICATE_COMPANY_ACCESS_KEY = process.env.AUTHENTICATE_COMPANY_ACCESS_KEY;
const AUTHENTICATE_API_KEY = process.env.AUTHENTICATE_API_KEY;
const isDev = process.env.REACT_APP_ENV === 'development';

module.exports = (req, res) => {
  const { userAccessCode, userInfo } = req.body;

  const mockString = isDev ? 'mock/' : '';

  axios
    .put(
      `https://api-v3.authenticating.com/${mockString}user/update`,
      {
        userAccessCode,
        ...userInfo,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: isDev ? '' : `Bearer ${AUTHENTICATE_API_KEY}`,
        },
      }
    )
    .then(apiResponse => {
      return res
        .status(200)
        .set('Content-Type', 'application/transit+json')
        .send(
          serialize({
            data: apiResponse.data,
          })
        )
        .end();
    })
    .catch(e => {
      log.error(e);
      res
        .status(e.response.status)
        .json({
          name: 'Local API request failed',
          status: e.response.status,
          statusText: e.response.data.errorMessage,
          data: e.response.data,
        })
        .end();
    });
};
