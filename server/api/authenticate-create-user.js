const axios = require('axios');
const { integrationSdk, handleError, serialize } = require('../api-util/sdk');
const log = require('../log');
const AUTHENTICATE_COMPANY_ACCESS_KEY = process.env.AUTHENTICATE_COMPANY_ACCESS_KEY;
const AUTHENTICATE_API_KEY = process.env.AUTHENTICATE_API_KEY;
const isDev = process.env.REACT_APP_ENV === 'development';

const mockUser = {
  firstName: 'Jonathan',
  middleName: 'Gob',
  lastName: 'Zinx',
  dob: '22-05-1990',
  email: 'jonathan@authenticating.com',
  phone: '+19321765432',
  houseNumber: 504,
  streetName: '121, 9th ST',
  address: '121, 9th ST, APT 12111',
  city: 'Santa Monica',
  state: 'CA',
  zipCode: 90411,
  ssn: '123456789',
};

module.exports = (req, res) => {
  const { userInfo } = req.body;

  const mockString = isDev ? 'mock/' : '';

  axios
    .post(
      `https://api-v3.authenticating.com/${mockString}user/create`,
      {
        ...userInfo,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: isDev ? `Bearer ${AUTHENTICATE_API_KEY}` : '',
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
    .catch(e => log.error(e));
};
