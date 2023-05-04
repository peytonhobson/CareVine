const sgMail = require('@sendgrid/mail');
const { integrationSdk, handleError, serialize } = require('../../api-util/sdk');
const log = require('../../log');

const SENDGRID_TEMPLATE_ID = 'd-f4e098e3ecc24d13afb508e764926520';
const marketplaceUrl = process.env.REACT_APP_CANONICAL_ROOT_URL;

module.exports = async (req, res) => {
  const { email, senderName, referralCode } = req.body;

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    from: 'CareVine@carevine-mail.us',
    personalizations: [
      {
        to: [
          {
            email,
          },
        ],
        dynamic_template_data: {
          senderName,
          referralCode,
          marketplaceUrl,
        },
      },
    ],
    template_id: SENDGRID_TEMPLATE_ID,
  };

  sgMail
    .send(msg)
    .then(apiResponse => {
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
    .catch(e => {
      log.error(e?.response?.body, 'sendgrid-referral-email-failed');
      handleError(res, e);
    });
};
