const axios = require('axios');
const { integrationSdk, handleError, serialize } = require('../api-util/sdk');
const log = require('../log');
const AUTHENTICATE_COMPANY_ACCESS_KEY = process.env.AUTHENTICATE_COMPANY_ACCESS_KEY;
const AUTHENTICATE_API_KEY = process.env.AUTHENTICATE_API_KEY;
const isDev = process.env.REACT_APP_ENV === 'development';

const mockUserAccessCodes = [
  '100385a1-4308-49db-889f-9a898fa88c21', // To call generateCriminalReport, ID verification has to be completed first.
  '2d91a19f-d07b-48f0-912f-886ed67009dd', // Success
];

const mockFullNames = ['Jonathan Doe', 'Michael Gary Scott'];

module.exports = (req, res) => {
  const { userAccessCode } = req.body;

  const mockString = isDev ? 'mock/' : '';

  axios
    .post(
      `https://api-v3.authenticating.com/${mockString}user/generateCriminalReport`,
      {
        userAccessCode: isDev ? mockUserAccessCodes[1] : userAccessCode,
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
      handleError(res, e.response);
    });
};
