const { integrationSdk, handleError, serialize } = require('../api-util/sdk');
const log = require('../log');
const sgMail = require('@sendgrid/mail');
const REFERRAL_CLAIMED_EMAIL_ID = 'd-5a1a6a891ba8471bb44a8e4b4b87a576';

module.exports = async (req, res) => {
  const { email, referralCode } = req.body;

  let user = null;

  integrationSdk.users
    .query({ meta_referralCode: referralCode, include: ['profile.metadata'] })
    .then(response => {
      const users = response.data.data;
      user = users.length > 0 ? users[0] : null;

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
    .then(() => {
      const referrerEmail = user.attributes.email;

      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      const msg = {
        from: 'CareVine@carevine-mail.us',
        personalizations: [
          {
            to: [
              {
                email: referrerEmail,
              },
            ],
            dynamic_template_data: {
              marketplaceUrl: process.env.REACT_APP_CANONICAL_ROOT_URL,
            },
          },
        ],
        template_id: REFERRAL_CLAIMED_EMAIL_ID,
      };

      return sgMail.send(msg);
    })
    .then(apiResponse => {
      console.log(apiResponse);
      res
        .status(200)
        .set('Content-Type', 'application/transit+json')
        .send(
          serialize({
            data: apiResponse,
          })
        )
        .end();
    })
    .catch(e => handleError(res, e));
};
