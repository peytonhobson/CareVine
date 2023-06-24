const sgMail = require('@sendgrid/mail');
const { integrationSdk, handleError, serialize } = require('../../api-util/sdk');
const log = require('../../log');
const isDev = process.env.NODE_ENV === 'development';

module.exports = (req, res) => {
  const { fromEmail, receiverEmail, subject, html } = req.body;

  if (isDev) {
    res
      .status(200)
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

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    from: fromEmail ?? 'CareVine@carevine-mail.us',
    to: receiverEmail,
    subject,
    html,
  };

  console.log(msg);

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
