// This dotenv import is required for the `.env` file to be read
require('dotenv').config();
const flexIntegrationSdk = require('sharetribe-flex-integration-sdk');
var crypto = require('crypto');

const integrationSdk = flexIntegrationSdk.createInstance({
  // These two env vars need to be set in the `.env` file.
  clientId: process.env.FLEX_INTEGRATION_CLIENT_ID,
  clientSecret: process.env.FLEX_INTEGRATION_CLIENT_SECRET,

  // Normally you can just skip setting the base URL and just use the
  // default that the `createInstance` uses. We explicitly set it here
  // for local testing and development.
  baseUrl: process.env.FLEX_INTEGRATION_BASE_URL || 'https://flex-integ-api.sharetribe.com',
});

function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  );
}

const emails = [
  'asdfklj@akjlsh.com',
  'akjsdfhm@kajlsdhf.com',
  'asdfkljh@kajlsdfhjk.com',
  'asdfs@asdf.com',
  'asdfasdf@asdfsd.com',
  'akjlsf@akjldf.com',
  'asdfasd@asdf.com',
  'kaljsfdhsk@akjlsd.com',
  'lkajshdflkj@kljadhsf.com',
  'ajksldfhj@kjlahsdf.com',
  'kjasdfjks@kjahsdfkjasd.com',
  'kjasdfjklsa@akjlsdfjls.com',
  'asdfsad@asdf.com',
  'lsakdhfkjlsd@akjlsdfhjkasd.com',
  'kjladfhs@kjlahsdf.com',
  'kjhsdfskj@kljsdfkja.com',
  'peyton-hobson@uiowa.edu',
  'kjasdf@akljsd.com',
  'asdfasdf@asdf.com',
  'klajsfdhjk@akldjsf.com',
  'lkjsahfdjk@akjlsdf.com',
  'kjlasdfhj@lkjasdhfjks.com',
  'asldkfj@alskdjfhj.com',
  'asdfasd@asdfasd.com',
  'kaljshd@aksjdf.com',
  'kjlasf@askdjl.com',
  'kjsa@kaljdf.com',
  'lkajsfd@klajsdf.com',
  'klsdjfk@aksdfjk.com',
  'person.example@example.com',
  'peyton.hobson1@gmail.com',
];

let sbAccessToken = null;
let privateData = null;

emails.forEach(email => {
  sbAccessToken = uuidv4();
  privateData = {
    sbAccessToken: null,
  };

  integrationSdk.users
    .show({ email })
    .then(res => {
      const userId = res.data.data.id;

      integrationSdk.users.updateProfile(
        {
          id: userId,
          privateData,
        },
        {
          expand: true,
          'fields.user': ['email', 'profile.metadata', 'emailVerified'],
        }
      );
    })
    .catch(e => {
      throw e;
    });
});
