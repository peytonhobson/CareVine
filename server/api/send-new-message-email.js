const sgMail = require('@sendgrid/mail');
const { integrationSdk, handleError, serialize } = require('../api-util/sdk');
const log = require('../log');

module.exports = (req, res) => {
  const { authorId, senderName } = req.body;

  integrationSdk.users
    .show({ id: authorId })
    .then(userResponse => {
      const user = userResponse?.data?.data;
      const receiverEmail = user?.attributes?.email;

      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      const msg = {
        to: receiverEmail,
        from: 'no-reply@carevine.us',
        subject: `New Message from ${senderName}`,
        html: `<div>
        <p>You have a new message from ${senderName}.</p>
        </div>`,
      };

      return sgMail.send(msg);
    })
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
      log.error(e?.response?.body?.errors, 'send-new-message-email', e);
      handleError(res, e);
    });
};
