const sgMail = require('@sendgrid/mail');
const { integrationSdk, handleError, serialize } = require('../api-util/sdk');
const log = require('../log');

module.exports = (req, res) => {
  const { fromEmail, receiverEmail, subject, html } = req.body;

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    from: fromEmail ?? 'no-reply@carevine.us',
    to: receiverEmail,
    subject,
    html,
  };

  return sgMail
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
      log.error(e, 'sendgrid-email-failed', e);
    });
};
