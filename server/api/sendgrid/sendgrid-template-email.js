const sgMail = require('@sendgrid/mail');
const { integrationSdk, handleError, serialize } = require('../../api-util/sdk');
const log = require('../../log');
const isDev = process.env.NODE_ENV === 'development';

const SENDGRID_TEMPLATE_IDS = {
  'listing-approved': 'd-8b99728fb8784ec3a28e16708abfcffc',
  'listing-closed': 'd-023abb2594c24fc4a2f10f48a4a2e904',
  'background-check-approved': 'd-03e273474de74c448fd2c2fbb903a317',
  'background-check-rejected': 'd-5bed9a37fa574a0d822832887d62b4ea',
  'subscription-confirmed': 'd-86a4b53a6f61498a99caef79c3a17c7a',
  'subscription-canceled': 'd-2d9c30381681481baeb101fd53e89bdf',
  'payment-failed': 'd-9ad97a905d484aecb18b2a4e7886bc10',
  'subscription-schedule-confirmed': 'd-f353ec706a8f4a24b5247475a51561d7',
  'subscription-schedule-canceled': 'd-73b663e822104c119174c3e02fff53e1',
  'subscription-reactivated': 'd-60700574227d45a9b96a1088d3fff48a',
  'subscription-upgraded': 'd-15926983dea741ae847bddcfa7ec05ca',
  'payment-received': 'd-8c3d87977c67483f91fe270b9267f9d2',
};

module.exports = (req, res) => {
  const { receiverId, templateData, templateName } = req.body;

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

  integrationSdk.users
    .show({ id: receiverId })
    .then(userResponse => {
      const user = userResponse?.data?.data;
      const receiverEmail = user?.attributes?.email;

      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      const msg = {
        from: 'CareVine@carevine-mail.us',
        personalizations: [
          {
            to: [
              {
                email: receiverEmail,
              },
            ],
            dynamic_template_data: templateData,
          },
        ],
        template_id: SENDGRID_TEMPLATE_IDS[templateName],
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
      log.error(e, 'sendgrid-email', e);
    });
};
