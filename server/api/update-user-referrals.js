const { integrationSdk, handleError, serialize } = require('../api-util/sdk');
const log = require('../log');

module.exports = async (req, res) => {
  const { email, referralCode } = req.body;

  integrationSdk.users
    .query({ meta_referralCode: referralCode, include: ['profile.metadata'] })
    .then(response => {
      const users = response.data.data;
      const user = users.length > 0 ? users[0] : null;

      if (!user) {
        throw new Error('No user found with that referral code');
      }

      const oldReferrals = user.attributes.profile.metadata.referrals || [];

      const newReferrals = oldReferrals.map(r => {
        if (r.email === email) {
          return {
            ...r,
            claimed: true,
          };
        }
        return r;
      });

      return integrationSdk.users.updateProfile({
        id: user.id.uuid,
        metadata: {
          referrals: newReferrals,
        },
      });
    })
    .then(apiResponse => {
      const { status, statusText, data } = apiResponse;
      res
        .status(status)
        .set('Content-Type', 'application/transit+json')
        .send(
          serialize({
            status,
            statusText,
            data,
          })
        )
        .end();
    })
    .catch(e => handleError(res, e));
};
