const sgMail = require('@sendgrid/mail');
const { handleError, serialize } = require('../api-util/sdk');
const log = require('../log');

module.exports = (req, res) => {
  const { feedback } = req.body;

  const {
    deviceType,
    userType,
    findSite,
    security,
    securityReason,
    suggestions,
    abilityRating,
    appearanceRating,
    easeRating,
    email,
    willingToContact,
  } = feedback;

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: 'feedback@carevine.us',
    from: 'support@carevine.us',
    subject: 'Feedback from Carevine App',
    html: `<div>
        <p>Device Type: ${deviceType}</p>
        <p>User Type: ${userType}</p>
        <p>How they found out about Carevine: </br>${findSite}</p>
        <p>Do they feel carevine is secure: ${security}</p>
        <p>Security Reason: </br>${securityReason}</p>
        <p>Ability Rating: ${abilityRating}</p>
        <p>Appearance Rating: ${appearanceRating}</p>
        <p>Ease Rating: ${easeRating}</p>
        <p>Suggestions: </br>${suggestions}</p>
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
