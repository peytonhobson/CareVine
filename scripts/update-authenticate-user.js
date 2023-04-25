const axios = require('axios');
const AUTHENTICATE_API_KEY = '';

const userAccessCode = '1897baa6-7883-49bc-9838-676041d948b4';
const userInfo = {
  houseNumber: 1640,
};

axios
  .put(
    `https://api-v3.authenticating.com/user/update`,
    {
      userAccessCode,
      ...userInfo,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AUTHENTICATE_API_KEY}`,
      },
    }
  )
  .then(apiResponse => {
    console.log(apiResponse.data);
  });
