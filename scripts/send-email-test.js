const sgMail = require('@sendgrid/mail');

// async..await is not allowed in global scope, must use a wrapper
async function main() {
  console.log('SENDGRID_API_KEY: ' + process.env.SENDGRID_API_KEY);
  sgMail.setApiKey();
  const msg = {
    to: 'peyton.hobson@carevine.us', // Change to your recipient
    from: 'support@carevine.us', // Change to your verified sender
    subject: 'Sending with SendGrid is Fun',
    text: 'and easy to do anywhere, even with Node.js',
    html: '<strong>and easy to do anywhere, even with Node.js</strong>',
  };
  sgMail
    .send(msg)
    .then(() => {
      console.log('Email sent');
    })
    .catch(error => {
      console.error(error);
    });
}

main().catch(console.error);
