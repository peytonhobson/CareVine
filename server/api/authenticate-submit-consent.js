const axios = require('axios');
const { integrationSdk, handleError, serialize } = require('../api-util/sdk');
const log = require('../log');
const AUTHENTICATE_COMPANY_ACCESS_KEY = process.env.AUTHENTICATE_COMPANY_ACCESS_KEY;
const AUTHENTICATE_API_KEY = process.env.AUTHENTICATE_API_KEY;
const isDev = process.env.REACT_APP_ENV === 'development';

const mockFullNames = ['Jonathan Doe', 'Michael Gary Scott'];

module.exports = (req, res) => {
  const { userAccessCode, fullName } = req.body;

  const mockString = isDev ? 'mock/' : '';

  axios
    .post(
      `https://api-v3.authenticating.com/${mockString}user/consent`,
      {
        userAccessCode,
        isBackgroundDisclosureAccepted: 1,
        GLBPurposeAndDPPAPurpose: 1,
        FCRAPurpose: 1,
        fullName: isDev ? mockFullNames[1] : fullName,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AUTHENTICATE_API_KEY}`,
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
