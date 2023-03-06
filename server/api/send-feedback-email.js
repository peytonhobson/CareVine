const sgMail = require('@sendgrid/mail');
const { handleError, serialize } = require('../api-util/sdk');
const log = require('../log');

module.exports = (req, res) => {
  const { feedback } = req.body;

  const { deviceType, userType, suggestions, issues, email, willingToContact } = feedback;

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: 'feedback@carevine.us',
    from: 'support@carevine.us',
    subject: 'Feedback from Carevine App',
    html: `<div>
        <p>Device Type: ${deviceType}</p>
        <p>User Type: ${userType}</p>
        <p>Suggestions: </br>${suggestions}</p>
        <p>Issues: </br>${issues}</p>
        <p>Email: ${email}</p>
        <p>Willing to Contact: ${willingToContact}</p>
    </div>`,
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
      handleError(res, e);
    });
};
