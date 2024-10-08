const sgMail = require('@sendgrid/mail');
const { integrationSdk, handleError, serialize } = require('../../api-util/sdk');
const log = require('../../log');
const isDev = process.env.NODE_ENV === 'development';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = (req, res) => {
  const { fromEmail, receiverEmail, subject, html } = req.body;

  if (isDev) {
    res
      .status(500)
      .set('Content-Type', 'application/transit+json')
      .send(
        serialize({
          data: {
            message: 'Emails are not sent in development mode',
          },
        })
      )
      .end();
    return;
  }

  const msg = {
    from: {
      email: fromEmail ?? 'CareVine@carevine-mail.us',
      name: 'CareVine',
    },
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
      handleError(res, e);
    });
};
