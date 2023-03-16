const axios = require('axios');
const { integrationSdk, handleError, serialize } = require('../api-util/sdk');
const log = require('../log');
const AUTHENTICATE_COMPANY_ACCESS_KEY = process.env.AUTHENTICATE_COMPANY_ACCESS_KEY;
const AUTHENTICATE_API_KEY = process.env.AUTHENTICATE_API_KEY;
const isDev = process.env.REACT_APP_ENV === 'development';

const mockUserAccessCodes = [
  '100385a1-4308-49db-889f-9a898fa88c21', // Invalid Session/Session Expired, Please initiate the KBA process again.
  'a423efc3-f12d-4f85-92a6-2a35129c5285', // 4/5 success
  '9cg686b3-ccb3-497c-a298-3830ea8a1c96', // 2/5 fail
];

module.exports = (req, res) => {
  const { payload } = req.body;

  const mockString = isDev ? 'mock/' : '';

  const userAccessCodeMaybe = {
    userAccessCode: isDev ? mockUserAccessCodes[1] : payload.userAccessCode,
  };

  axios
    .post(
      `https://api-v3.authenticating.com/${mockString}identity/kba-verification`,
      {
        ...payload,
        ...userAccessCodeMaybe,
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
