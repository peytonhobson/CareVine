const axios = require('axios');
const { integrationSdk, handleError, serialize } = require('../api-util/sdk');
const log = require('../log');
const AUTHENTICATE_COMPANY_ACCESS_KEY = process.env.AUTHENTICATE_COMPANY_ACCESS_KEY;
const AUTHENTICATE_API_KEY = process.env.AUTHENTICATE_API_KEY;
const isDev = process.env.REACT_APP_ENV === 'development';

const mockUserAccessCodes = [
  '100385a1-4308-49db-889f-9a898fa88c21', // Contains records
  '9cg686b3-ccb3-497c-a298-3830ea8a1c96', // No records found
];

module.exports = (req, res) => {
  const { userAccessCode } = req.body;

  const mockString = isDev ? 'mock/' : '';

  axios
    .post(
      `https://api-v3.authenticating.com/${mockString}identity/request/criminal/report/seven`,
      {
        userAccessCode: isDev ? mockUserAccessCodes[0] : userAccessCode,
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
