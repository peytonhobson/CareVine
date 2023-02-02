const axios = require('axios');

axios.post(
  `https://localhost:3000/api/update-user-metadata`,
  {
    userId: 'asdf',
    metadata: {},
  },
  {
    headers: {
      'Content-Type': 'application/json',
    },
  }
);
